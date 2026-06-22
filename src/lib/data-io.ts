/**
 * 顧客データの CSV/JSON 入出力（FR-M0-11/12）。Node 専用。
 *  - エクスポートは PII を復号して出力（開示・ポータビリティ用途）。
 *  - インポートは createCustomer/updateCustomer 経由で再暗号化（往復で整合：AC-M0-6）。
 *  - 行単位でバリデーションし、エラー行を報告（AC-M0-7）。
 */
import "server-only";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/crypto";
import { createCustomer, updateCustomer } from "@/lib/customers";
import { customerInputSchema } from "@/lib/validation";
import { toCsv } from "@/lib/csv";
import { getAnalytics } from "@/lib/analytics";
import { toDateInputValue } from "@/lib/format";

export const CUSTOMER_COLUMNS = [
  "id",
  "name",
  "nameKana",
  "gender",
  "birthday",
  "phone",
  "email",
  "hairType",
  "skinType",
  "allergies",
  "preferences",
  "notes",
  "consentToContact",
] as const;

function dec(v: string | null): string {
  if (!v) return "";
  if (v.startsWith("v1:")) {
    try {
      return decrypt(v);
    } catch {
      return "";
    }
  }
  return v;
}

function parseAllergies(v: string | null): string[] {
  if (!v) return [];
  try {
    const arr = JSON.parse(v);
    return Array.isArray(arr) ? arr.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

type ExportRow = {
  id: string;
  name: string;
  nameKana: string;
  gender: string;
  birthday: string;
  phone: string;
  email: string;
  hairType: string[];
  skinType: string[];
  allergies: string[];
  preferences: string;
  notes: string;
  consentToContact: string;
};

async function getExportRows(): Promise<ExportRow[]> {
  const customers = await prisma.customer.findMany({
    where: { deletedAt: null },
    orderBy: { registeredAt: "asc" },
  });
  return customers.map((c) => ({
    id: c.id,
    name: c.name,
    nameKana: c.nameKana ?? "",
    gender: c.gender ?? "",
    birthday: c.birthday ? toDateInputValue(c.birthday) : "",
    phone: dec(c.phone),
    email: dec(c.email),
    hairType: parseAllergies(c.hairType),
    skinType: parseAllergies(c.skinType),
    allergies: parseAllergies(c.allergies),
    preferences: c.preferences ?? "",
    notes: c.notes ?? "",
    consentToContact: c.consentToContact ? "true" : "false",
  }));
}

/** JSON エクスポート（allergies は配列）。 */
export async function exportCustomersJson(): Promise<string> {
  const rows = await getExportRows();
  return JSON.stringify(rows, null, 2);
}

/** CSV エクスポート（複数値項目は ";" 区切り、UTF-8 BOM 付与で Excel 互換）。 */
export async function exportCustomersCsv(): Promise<string> {
  const rows = await getExportRows();
  const flat = rows.map((r) => ({
    ...r,
    hairType: r.hairType.join(";"),
    skinType: r.skinType.join(";"),
    allergies: r.allergies.join(";"),
  }));
  return "﻿" + toCsv([...CUSTOMER_COLUMNS], flat);
}

export type ImportResult = {
  created: number;
  updated: number;
  errors: { row: number; message: string }[];
};

/** レコード配列を取り込み（id 一致は更新、無ければ作成）。 */
export async function importCustomerRecords(
  records: Record<string, unknown>[],
): Promise<ImportResult> {
  const result: ImportResult = { created: 0, updated: 0, errors: [] };

  for (let i = 0; i < records.length; i++) {
    const rec = records[i];
    const rawId = rec.id;
    const id = typeof rawId === "string" && rawId.trim() ? rawId.trim() : undefined;
    const parsed = customerInputSchema.safeParse(rec);
    if (!parsed.success) {
      result.errors.push({
        row: i + 1,
        message: parsed.error.issues
          .map((iss) => `${iss.path.join(".") || "_"}: ${iss.message}`)
          .join("; "),
      });
      continue;
    }
    try {
      if (id) {
        const exists = await prisma.customer.findUnique({ where: { id }, select: { id: true } });
        if (exists) {
          await updateCustomer(id, parsed.data);
          result.updated++;
          continue;
        }
      }
      await createCustomer(parsed.data);
      result.created++;
    } catch (e) {
      result.errors.push({ row: i + 1, message: e instanceof Error ? e.message : String(e) });
    }
  }
  return result;
}

// ── 売上 / 予約 / 分析 のエクスポート ────────────────────────
const BOM = "﻿";
function fmtDT(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
const PAY_LABEL: Record<string, string> = { cash: "現金", card: "カード", emoney: "電子マネー", other: "その他" };
const RES_STATUS_LABEL: Record<string, string> = { booked: "予約済み", done: "来店済み", cancelled: "取り消し", noshow: "無断キャンセル" };
const SEG_LABEL: Record<string, string> = { vip: "VIP", loyal: "優良", stable: "安定", new: "新規", at_risk: "離反リスク", lost: "離反" };
const CYCLE_LABEL: Record<string, string> = { before: "予測前", approaching: "接近", overdue: "超過", dormant: "休眠", unknown: "算出不可" };

// 売上
const SALES_COLUMNS = ["date", "customer", "items", "totalAmount", "discountAmount", "paymentMethod", "staff"];
async function salesRows() {
  const sales = await prisma.sale.findMany({
    orderBy: { date: "desc" },
    include: {
      customer: { select: { name: true } },
      staff: { select: { name: true } },
      items: { select: { name: true } },
    },
  });
  return sales.map((s) => ({
    date: fmtDT(s.date),
    customer: s.customer.name,
    items: s.items.map((i) => i.name).join("・"),
    totalAmount: s.totalAmount,
    discountAmount: s.discountAmount,
    paymentMethod: s.paymentMethod ? (PAY_LABEL[s.paymentMethod] ?? s.paymentMethod) : "",
    staff: s.staff?.name ?? "",
  }));
}
export async function exportSalesJson() {
  return JSON.stringify(await salesRows(), null, 2);
}
export async function exportSalesCsv() {
  return BOM + toCsv(SALES_COLUMNS, await salesRows());
}

// 予約
const RESERVATION_COLUMNS = ["startAt", "customer", "menus", "staff", "status", "source"];
function reservationMenus(menusJson: string | null, memo: string | null): string {
  if (menusJson) {
    try {
      const a = JSON.parse(menusJson);
      if (Array.isArray(a)) return a.map((m) => m?.name).filter(Boolean).join("・");
    } catch {
      /* noop */
    }
  }
  return memo ?? "";
}
async function reservationRows() {
  const rs = await prisma.reservation.findMany({
    orderBy: { startAt: "desc" },
    include: { customer: { select: { name: true } }, staff: { select: { name: true } } },
  });
  return rs.map((r) => ({
    startAt: fmtDT(r.startAt),
    customer: r.customer.name,
    menus: reservationMenus(r.menusJson, r.memo),
    staff: r.staff?.name ?? "",
    status: RES_STATUS_LABEL[r.status] ?? r.status,
    source: r.source,
  }));
}
export async function exportReservationsJson() {
  return JSON.stringify(await reservationRows(), null, 2);
}
export async function exportReservationsCsv() {
  return BOM + toCsv(RESERVATION_COLUMNS, await reservationRows());
}

// 分析ダッシュボード（集計を long 形式 CSV / 生集計 JSON で出力）
const ANALYTICS_COLUMNS = ["category", "item", "value"];
async function analyticsRows() {
  const a = await getAnalytics();
  const rows: { category: string; item: string; value: number | string }[] = [];
  const push = (category: string, item: string, value: number | string) => rows.push({ category, item, value });
  push("KPI", "総顧客数", a.kpi.total);
  push("KPI", "アクティブ", a.kpi.active);
  push("KPI", "休眠", a.kpi.dormant);
  push("KPI", "要フォロー", a.kpi.followUp);
  push("KPI", "当月売上", a.kpi.monthSales);
  push("KPI", "平均客単価", a.kpi.avgSpend);
  push("KPI", "店販比率", a.kpi.retailRatio != null ? `${Math.round(a.kpi.retailRatio * 1000) / 10}%` : "-");
  for (const [k, v] of Object.entries(a.segCount)) push("RFMセグメント", SEG_LABEL[k] ?? k, v);
  for (const [k, v] of Object.entries(a.cycleCount)) push("来店サイクル", CYCLE_LABEL[k] ?? k, v);
  for (const b of a.spendDist) push("客単価分布", b.label, b.count);
  a.top.forEach((c, i) => push("上位顧客", `${i + 1}. ${c.name}`, c.totalSales));
  return rows;
}
export async function exportAnalyticsJson() {
  return JSON.stringify(await getAnalytics(), null, 2);
}
export async function exportAnalyticsCsv() {
  return BOM + toCsv(ANALYTICS_COLUMNS, await analyticsRows());
}
