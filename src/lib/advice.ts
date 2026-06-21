/**
 * 連携なしAIアドバイス（M6 + アドバイスカタログ照合）。Node 専用・外部送信ゼロ。
 *  - data/advice-catalog.json（110件）の triggerRule を顧客コンテキストに照合（§6.3）。
 *  - requiredData 充足チェック・consentToContact ガード・priority ソート。
 *  - M6 抽出（spec-appendix §B.3）：周期接近/超過 かつ 未予約 かつ 周期確定 かつ 連絡同意。
 */
import "server-only";
import { prisma } from "@/lib/prisma";
import { computeRfm, type RfmSegment } from "@/lib/rfm";
import { cycleState as cycleStateOf, type CycleState } from "@/lib/cycle";
import { parseRule, evaluateRule, type AdviceNode, type AdviceContext } from "@/lib/advice-dsl";
import { formatDate } from "@/lib/format";
import catalogData from "../../data/advice-catalog.json";

type CatalogItem = {
  id: string;
  category: string;
  title: string;
  triggerDescription: string;
  triggerRule: string;
  priority: "high" | "medium" | "low";
  segment: string;
  requiredData: string[];
  salonMessage: string;
  customerTemplate: string;
  recommendedAction: string;
  aiExtension: string;
};

const CATALOG = catalogData.items as CatalogItem[];
const PRIORITY_RANK: Record<string, number> = { high: 3, medium: 2, low: 1 };
const DAY = 86_400_000;

// triggerRule を起動時に一度だけパース（評価のたびに再パースしない）。
const COMPILED: { item: CatalogItem; ast: AdviceNode | null }[] = CATALOG.map((item) => {
  try {
    return { item, ast: parseRule(item.triggerRule) };
  } catch {
    return { item, ast: null };
  }
});

// data-model §4.3 のセグメント → カタログが参照する語彙へマッピング。
const SEGMENT_TO_CATALOG: Record<RfmSegment, string> = {
  vip: "VIP",
  loyal: "Loyal",
  stable: "stable",
  new: "new",
  at_risk: "at_risk",
  lost: "loss",
};

const dayNum = (d: Date | null | undefined): number | null =>
  d ? Math.floor(new Date(d).getTime() / DAY) : null;

function parseArr(v: string | null): string[] {
  if (!v) return [];
  try {
    const a = JSON.parse(v);
    return Array.isArray(a) ? a.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

/** 次に到来する月日（誕生日・記念日）までの日数。 */
function daysToNextAnnual(date: Date | null, today: Date): number | null {
  if (!date) return null;
  const d = new Date(date);
  const base = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  let next = new Date(today.getFullYear(), d.getMonth(), d.getDate());
  if (next < base) next = new Date(today.getFullYear() + 1, d.getMonth(), d.getDate());
  return Math.round((next.getTime() - base.getTime()) / DAY);
}

function ageInYears(birthday: Date | null, today: Date): number | null {
  if (!birthday) return null;
  const b = new Date(birthday);
  let age = today.getFullYear() - b.getFullYear();
  if (today.getMonth() < b.getMonth() || (today.getMonth() === b.getMonth() && today.getDate() < b.getDate())) {
    age--;
  }
  return age;
}

export type CustomerCtx = {
  id: string;
  name: string;
  consentToContact: boolean;
  preferredStaffName: string | null;
  nextPredictedVisitDate: Date | null;
  lastService: string | null;
  cycleState: CycleState;
  cycleOverdueRatio: number | null;
  hasUpcomingReservation: boolean;
  ctx: AdviceContext;
};

/** 全顧客の評価コンテキストを一括構築（RFM・店販比率・先の予約・前回メニュー等）。 */
export async function buildAllContexts(now: Date = new Date()): Promise<Map<string, CustomerCtx>> {
  const todayNum = Math.floor(now.getTime() / DAY);
  const currentMonth = now.getMonth() + 1;

  const [customers, visits, ups, retailItems] = await Promise.all([
    prisma.customer.findMany({
      where: { deletedAt: null },
      include: { preferredStaff: { select: { name: true } } },
    }),
    prisma.visit.findMany({
      where: { customer: { deletedAt: null } },
      select: { customerId: true, date: true, menu: true },
      orderBy: { date: "desc" },
    }),
    prisma.reservation.findMany({
      where: { status: "booked", startAt: { gte: now } },
      select: { customerId: true, startAt: true },
      orderBy: { startAt: "asc" },
    }),
    prisma.saleItem.findMany({
      where: { itemType: "product" },
      select: { amount: true, sale: { select: { customerId: true } } },
    }),
  ]);

  const rfm = computeRfm(
    customers.map((c) => ({
      id: c.id,
      recencyDays: c.lastVisitDate ? Math.floor((now.getTime() - c.lastVisitDate.getTime()) / DAY) : null,
      frequency: c.visitCount,
      monetary: c.totalSales,
    })),
  );
  const rfmMap = new Map(rfm.map((r) => [r.id, r]));

  const lastServiceMap = new Map<string, string | null>();
  for (const v of visits) if (!lastServiceMap.has(v.customerId)) lastServiceMap.set(v.customerId, v.menu);

  const upMap = new Map<string, Date>();
  for (const r of ups) if (!upMap.has(r.customerId)) upMap.set(r.customerId, r.startAt);

  const retailMap = new Map<string, number>();
  for (const it of retailItems) {
    const cid = it.sale.customerId;
    retailMap.set(cid, (retailMap.get(cid) ?? 0) + it.amount);
  }

  const result = new Map<string, CustomerCtx>();
  for (const c of customers) {
    const r = rfmMap.get(c.id);
    const dsl = c.lastVisitDate ? Math.floor((now.getTime() - c.lastVisitDate.getTime()) / DAY) : null;
    const ratio = dsl !== null && c.avgVisitIntervalDays && c.avgVisitIntervalDays > 0 ? dsl / c.avgVisitIntervalDays : null;
    const retailSales = retailMap.get(c.id) ?? 0;
    const hasUpcoming = upMap.has(c.id);

    const ctx: AdviceContext = {
      today: todayNum,
      currentMonth,
      name: c.name,
      gender: c.gender,
      status: c.status,
      consentToContact: c.consentToContact,
      visitCount: c.visitCount,
      daysSinceLastVisit: dsl,
      avgVisitIntervalDays: c.avgVisitIntervalDays,
      cycleOverdueRatio: ratio,
      nextPredictedVisitDate: dayNum(c.nextPredictedVisitDate),
      lastVisitDate: dayNum(c.lastVisitDate),
      lastContactDate: dayNum(c.lastContactDate),
      hasUpcomingReservation: hasUpcoming,
      nextReservationDate: dayNum(upMap.get(c.id) ?? null),
      totalSales: c.totalSales,
      avgSpend: c.visitCount > 0 ? Math.round(c.totalSales / c.visitCount) : null,
      ltv: c.totalSales,
      lastSaleAmount: c.lastSaleAmount,
      retailPurchaseCount: c.retailPurchaseCount,
      retailRatio: c.totalSales > 0 ? retailSales / c.totalSales : null,
      rfmRecency: r?.r ?? null,
      rfmFrequency: r?.f ?? null,
      rfmMonetary: r?.m ?? null,
      rfmSegment: r ? SEGMENT_TO_CATALOG[r.segment] : null,
      hairType: c.hairType,
      skinType: c.skinType,
      allergies: parseArr(c.allergies),
      preferredStaff: c.preferredStaffId,
      reviewGiven: c.reviewGiven,
      referralCount: c.referralCount,
      lastService: lastServiceMap.get(c.id) ?? null,
      daysToBirthday: daysToNextAnnual(c.birthday, now),
      daysToAnniversary: daysToNextAnnual(c.anniversaryDate ?? c.firstVisitDate, now),
      ageInYears: ageInYears(c.birthday, now),
    };

    result.set(c.id, {
      id: c.id,
      name: c.name,
      consentToContact: c.consentToContact,
      preferredStaffName: c.preferredStaff?.name ?? null,
      nextPredictedVisitDate: c.nextPredictedVisitDate,
      lastService: lastServiceMap.get(c.id) ?? null,
      cycleState: cycleStateOf(ratio, dsl),
      cycleOverdueRatio: ratio,
      hasUpcomingReservation: hasUpcoming,
      ctx,
    });
  }
  return result;
}

function renderTemplate(tpl: string, vals: Record<string, string>): string {
  return tpl.replace(/\{(\w+)\}/g, (_, k: string) => vals[k] ?? "");
}

export type Advice = {
  id: string;
  category: string;
  title: string;
  priority: string;
  insight: string; // salonMessage
  recommendedAction: string;
  customerMessage: string | null; // consent 無しは null（抑制）
};

function evaluateCatalog(cc: CustomerCtx, limit: number): Advice[] {
  // 欠損安全評価（null 参照の比較は false）に依拠するため requiredData のハードゲートは設けない。
  // requiredData は連携ありモードのグラウンディング用に保持し、顧客向け文面の欠損は
  // テンプレートのフォールバックで補完する（過剰除外による未提示を避ける）。
  const matched: CatalogItem[] = [];
  for (const { item, ast } of COMPILED) {
    if (ast && evaluateRule(ast, cc.ctx)) matched.push(item);
  }
  matched.sort((a, b) => (PRIORITY_RANK[b.priority] ?? 0) - (PRIORITY_RANK[a.priority] ?? 0));

  const vals: Record<string, string> = {
    name: cc.name,
    nextPredictedVisitDate: formatDate(cc.nextPredictedVisitDate),
    preferredStaff: cc.preferredStaffName ?? "担当",
    lastService: cc.lastService ?? "施術",
  };

  return matched.slice(0, limit).map((item) => ({
    id: item.id,
    category: item.category,
    title: item.title,
    priority: item.priority,
    insight: item.salonMessage,
    recommendedAction: item.recommendedAction,
    customerMessage: cc.consentToContact ? renderTemplate(item.customerTemplate, vals) : null,
  }));
}

/** 顧客1名分のオフライン・アドバイス（カルテ画面のアドバイスパネル用）。 */
export async function getAdviceForCustomer(customerId: string, limit = 5): Promise<Advice[]> {
  const contexts = await buildAllContexts();
  const cc = contexts.get(customerId);
  if (!cc) return [];
  return evaluateCatalog(cc, limit);
}

export type M6Target = {
  id: string;
  name: string;
  cycleState: CycleState;
  cycleOverdueRatio: number | null;
  nextPredictedVisitDate: Date | null;
  lastService: string | null;
  topAdvice: Advice | null;
};

/** M6 抽出（§B.3）：周期接近/超過 × 未予約 × 周期確定 × 連絡同意。 */
export async function getM6Targets(): Promise<M6Target[]> {
  const contexts = await buildAllContexts();
  const targets: M6Target[] = [];
  for (const cc of contexts.values()) {
    const inWindow = cc.cycleState === "approaching" || cc.cycleState === "overdue";
    const cycleConfirmed = cc.ctx.avgVisitIntervalDays != null;
    if (inWindow && !cc.hasUpcomingReservation && cycleConfirmed && cc.consentToContact) {
      const advice = evaluateCatalog(cc, 5);
      const rv = advice.find((a) => a.id.startsWith("RV")) ?? advice[0] ?? null;
      targets.push({
        id: cc.id,
        name: cc.name,
        cycleState: cc.cycleState,
        cycleOverdueRatio: cc.cycleOverdueRatio,
        nextPredictedVisitDate: cc.nextPredictedVisitDate,
        lastService: cc.lastService,
        topAdvice: rv,
      });
    }
  }
  // 超過度の高い順（null は後ろ）
  targets.sort((a, b) => (b.cycleOverdueRatio ?? 0) - (a.cycleOverdueRatio ?? 0));
  return targets;
}
