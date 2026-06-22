/**
 * サンプル顧客データの取り込み（ウィザードのボタンから実行）。Node 専用。
 * 架空の顧客を来店履歴・売上・予約・連絡同意つきで生成し、各機能を体験できるようにする。
 * すべて notes が "[サンプル]" で始まり、後から識別・一括削除が可能（実在の顧客ではありません）。
 */
import "server-only";
import { prisma } from "@/lib/prisma";

const DAY = 86_400_000;
const SURNAMES = [["佐藤","サトウ"],["鈴木","スズキ"],["高橋","タカハシ"],["田中","タナカ"],["渡辺","ワタナベ"],["伊藤","イトウ"],["山本","ヤマモト"],["中村","ナカムラ"],["小林","コバヤシ"],["加藤","カトウ"],["吉田","ヨシダ"],["山田","ヤマダ"],["松本","マツモト"],["井上","イノウエ"],["木村","キムラ"],["清水","シミズ"]];
const GIVEN_F = [["美咲","ミサキ"],["陽子","ヨウコ"],["さくら","サクラ"],["結衣","ユイ"],["愛","アイ"],["優花","ユウカ"],["彩","アヤ"],["七海","ナナミ"],["莉子","リコ"],["麻衣","マイ"]];
const GIVEN_M = [["翔","ショウ"],["健一","ケンイチ"],["大輔","ダイスケ"],["涼太","リョウタ"],["蓮","レン"],["駿","シュン"],["和也","カズヤ"],["大樹","ダイキ"]];
const MENUS = ["カット", "カラー", "パーマ", "トリートメント", "ヘッドスパ"];
const STATES = ["vip","active","approaching","overdue","overdue","at_risk","dormant","new"];

export async function countSampleCustomers() {
  return prisma.customer.count({ where: { notes: { startsWith: "[サンプル]" }, deletedAt: null } });
}

export async function clearSampleCustomers() {
  return prisma.customer.deleteMany({ where: { notes: { startsWith: "[サンプル]" } } });
}

/** サンプル顧客を生成して取り込む（既定24名）。既存サンプルがあれば置き換える。 */
export async function importSampleCustomers(count = 24): Promise<number> {
  await clearSampleCustomers();
  const now = Date.now();
  const ri = (a: number, b: number) => Math.floor(Math.random() * (b - a + 1)) + a;
  const rf = (a: number, b: number) => Math.random() * (b - a) + a;
  const pick = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)];
  const med = (a: number[]) => { const s = [...a].sort((x, y) => x - y); const m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
  const used = new Set<string>();
  const name = (g: string) => {
    for (let t = 0; t < 30; t++) {
      const s = pick(SURNAMES), gv = pick(g === "female" ? GIVEN_F : GIVEN_M);
      if (!used.has(s[0] + gv[0])) { used.add(s[0] + gv[0]); return { name: `${s[0]} ${gv[0]}`, kana: `${s[1]} ${gv[1]}` }; }
    }
    const s = pick(SURNAMES), gv = pick(g === "female" ? GIVEN_F : GIVEN_M);
    return { name: `${s[0]} ${gv[0]}${ri(1, 9)}`, kana: `${s[1]} ${gv[1]}` };
  };

  for (let k = 0; k < count; k++) {
    const state = STATES[k % STATES.length];
    const gender = pick(["female", "female", "male"]);
    const { name: nm, kana } = name(gender);
    const interval = ri(26, 44);
    const menu = pick(MENUS);
    const retailRatio = Math.random() < 0.5 ? rf(0.05, 0.25) : 0;

    let n, lastAgo, base, consent, resv = null;
    if (state === "vip") { n = ri(6, 9); lastAgo = interval * rf(0.2, 0.7); base = ri(14000, 24000); consent = true; }
    else if (state === "active") { n = ri(3, 6); lastAgo = interval * rf(0.2, 0.7); base = ri(7000, 14000); consent = Math.random() < 0.85; }
    else if (state === "approaching") { n = ri(3, 6); lastAgo = interval * rf(0.82, 0.99); base = ri(8000, 15000); consent = true; }
    else if (state === "overdue") { n = ri(3, 6); lastAgo = interval * rf(1.1, 1.8); base = ri(8000, 15000); consent = Math.random() < 0.85; if (Math.random() < 0.12) resv = ri(3, 18); }
    else if (state === "at_risk") { n = ri(4, 7); lastAgo = ri(120, 175); base = ri(9000, 16000); consent = true; }
    else if (state === "dormant") { n = ri(2, 4); lastAgo = ri(200, 480); base = ri(6000, 13000); consent = Math.random() < 0.7; }
    else { n = 1; lastAgo = ri(3, 35); base = ri(6000, 11000); consent = Math.random() < 0.8; }

    const dates: Date[] = [];
    for (let i = 0; i < n; i++) dates.push(new Date(now - Math.round(Math.max(1, lastAgo + i * interval + ri(-3, 3))) * DAY));
    dates.sort((a, b) => a.getTime() - b.getTime());
    const intervals: number[] = [];
    for (let i = 1; i < dates.length; i++) intervals.push(Math.round((dates[i].getTime() - dates[i - 1].getTime()) / DAY));
    const avg = intervals.length ? med(intervals) : null;
    const last = dates[dates.length - 1];
    const pred = avg ? new Date(last.getTime() + avg * DAY) : null;
    const status = n <= 1 ? "new" : Math.floor((now - last.getTime()) / DAY) > 180 ? "dormant" : "repeat";

    const c = await prisma.customer.create({
      data: {
        name: nm, nameKana: kana, gender, consentToContact: consent,
        consentUpdatedAt: consent ? new Date() : null,
        notes: "[サンプル] 体験用の架空データ",
        visitCount: n, firstVisitDate: dates[0], lastVisitDate: last,
        avgVisitIntervalDays: avg, nextPredictedVisitDate: pred, status,
      },
    });
    let total = 0, lastAmt = 0, retailCount = 0;
    for (let i = 0; i < dates.length; i++) {
      await prisma.visit.create({ data: { customerId: c.id, date: dates[i], menu } });
      const amt = Math.round((base + ri(-1500, 2500)) / 100) * 100;
      const retail = Math.round(amt * retailRatio);
      total += amt; lastAmt = amt;
      const items = [{ itemType: "service", name: menu, unitPrice: amt - retail, quantity: 1, amount: amt - retail }];
      if (retail > 0) { items.push({ itemType: "product", name: "店販商品", unitPrice: retail, quantity: 1, amount: retail }); retailCount++; }
      await prisma.sale.create({ data: { customerId: c.id, date: dates[i], totalAmount: amt, paymentMethod: pick(["cash", "card"]), items: { create: items } } });
    }
    await prisma.customer.update({ where: { id: c.id }, data: { totalSales: total, lastSaleAmount: lastAmt || null, retailPurchaseCount: retailCount } });
    if (resv != null) await prisma.reservation.create({ data: { customerId: c.id, startAt: new Date(now + resv * DAY), status: "booked", source: "manual", memo: menu } });
  }
  return count;
}
