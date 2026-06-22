/**
 * デモ/テスト用データ投入（架空・ランダム生成）。
 *   npm run demo:seed         → 100名を生成（npm run demo:seed -- 50 で件数指定可）
 *   npm run demo:clear        → デモデータを削除（[DEMO]印のみ・実データには触れない）
 *
 * 来店サイクル状態（接近/超過/休眠/新規 等）・RFMセグメント・客単価・店販比率・連絡同意・
 * 先の予約有無をばらつかせ、ダッシュボード/分析(M4)/再来店提案(M6)が実際の分布で確認できる。
 * 氏名はすべて架空のランダム生成であり、実在の顧客ではありません。
 */
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const DAY = 86_400_000;
const now = Date.now();
const D = (daysAgo) => new Date(now - Math.round(daysAgo) * DAY);
const daysSince = (d) => Math.floor((now - d.getTime()) / DAY);
const median = (a) => {
  if (!a.length) return null;
  const s = [...a].sort((x, y) => x - y);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const ri = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const rf = (min, max) => Math.random() * (max - min) + min;
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const chance = (p) => Math.random() < p;

// 架空の氏名プール（[漢字, カナ]）
const SURNAMES = [["佐藤","サトウ"],["鈴木","スズキ"],["高橋","タカハシ"],["田中","タナカ"],["渡辺","ワタナベ"],["伊藤","イトウ"],["山本","ヤマモト"],["中村","ナカムラ"],["小林","コバヤシ"],["加藤","カトウ"],["吉田","ヨシダ"],["山田","ヤマダ"],["佐々木","ササキ"],["山口","ヤマグチ"],["松本","マツモト"],["井上","イノウエ"],["木村","キムラ"],["林","ハヤシ"],["清水","シミズ"],["山崎","ヤマザキ"],["森","モリ"],["池田","イケダ"],["橋本","ハシモト"],["阿部","アベ"],["石川","イシカワ"],["前田","マエダ"],["藤田","フジタ"],["後藤","ゴトウ"],["岡田","オカダ"],["長谷川","ハセガワ"]];
const GIVEN_F = [["美咲","ミサキ"],["陽子","ヨウコ"],["さくら","サクラ"],["葵","アオイ"],["結衣","ユイ"],["愛","アイ"],["杏","アン"],["真由","マユ"],["千尋","チヒロ"],["優花","ユウカ"],["彩","アヤ"],["七海","ナナミ"],["莉子","リコ"],["美穂","ミホ"],["直美","ナオミ"],["遥","ハルカ"],["美月","ミツキ"],["麻衣","マイ"],["香織","カオリ"],["恵","メグミ"]];
const GIVEN_M = [["翔","ショウ"],["健一","ケンイチ"],["大輔","ダイスケ"],["直樹","ナオキ"],["涼太","リョウタ"],["拓海","タクミ"],["蓮","レン"],["陸","リク"],["駿","シュン"],["亮","リョウ"],["健太","ケンタ"],["和也","カズヤ"],["翔太","ショウタ"],["大樹","ダイキ"],["悠斗","ユウト"],["颯","ハヤテ"],["智也","トモヤ"],["浩二","コウジ"],["誠","マコト"],["徹","トオル"]];
const MENUS = ["カット","カラー","パーマ","縮毛矯正","トリートメント","ヘッドスパ"];
const HAIR = ["軟毛","硬毛","くせ毛","直毛","普通", null];
const ALLERGY = [["ジアミン"], ["香料"], ["ラテックス"], ["パラベン"]];

let usedNames = new Set();
function uniqueName(gender) {
  const givenPool = gender === "female" ? GIVEN_F : GIVEN_M;
  for (let tries = 0; tries < 50; tries++) {
    const s = pick(SURNAMES);
    const g = pick(givenPool);
    const key = s[0] + g[0];
    if (!usedNames.has(key)) {
      usedNames.add(key);
      return { name: `${s[0]} ${g[0]}`, kana: `${s[1]} ${g[1]}` };
    }
  }
  const s = pick(SURNAMES), g = pick(givenPool);
  return { name: `${s[0]} ${g[0]}${ri(1, 99)}`, kana: `${s[1]} ${g[1]}` };
}

async function clearDemo() {
  const r = await prisma.customer.deleteMany({ where: { notes: { startsWith: "[DEMO]" } } });
  console.log(`[demo] removed ${r.count} demo customers (+ cascade)`);
}

async function mkCustomer(opts) {
  const dates = opts.visitsDaysAgo.map(D).sort((a, b) => a - b);
  const intervals = [];
  for (let i = 1; i < dates.length; i++) intervals.push(Math.round((dates[i] - dates[i - 1]) / DAY));
  const avg = intervals.length ? median(intervals) : null;
  const last = dates[dates.length - 1] ?? null;
  const pred = avg && last ? new Date(last.getTime() + avg * DAY) : null;
  const visitCount = dates.length;
  const status = visitCount <= 1 ? "new" : last && daysSince(last) > 180 ? "dormant" : "repeat";

  const c = await prisma.customer.create({
    data: {
      name: opts.name,
      nameKana: opts.kana,
      gender: opts.gender,
      consentToContact: opts.consent,
      consentUpdatedAt: opts.consent ? new Date() : null,
      hairType: opts.hairType ?? null,
      allergies: opts.allergies ? JSON.stringify(opts.allergies) : null,
      notes: "[DEMO] テスト用デモ顧客（架空）",
      visitCount,
      firstVisitDate: dates[0] ?? null,
      lastVisitDate: last,
      avgVisitIntervalDays: avg,
      nextPredictedVisitDate: pred,
      status,
    },
  });

  let totalSales = 0;
  let lastAmt = 0;
  let retailItems = 0;
  for (let i = 0; i < dates.length; i++) {
    await prisma.visit.create({ data: { customerId: c.id, date: dates[i], menu: opts.menu } });
    const amt = opts.salePerVisit[i];
    const retail = Math.round(amt * opts.retailRatio);
    const tech = amt - retail;
    totalSales += amt;
    lastAmt = amt;
    const items = [{ itemType: "service", name: opts.menu, unitPrice: tech, quantity: 1, amount: tech }];
    if (retail > 0) { items.push({ itemType: "product", name: "店販商品", unitPrice: retail, quantity: 1, amount: retail }); retailItems++; }
    await prisma.sale.create({ data: { customerId: c.id, date: dates[i], totalAmount: amt, paymentMethod: pick(["cash", "card", "emoney"]), items: { create: items } } });
  }
  await prisma.customer.update({ where: { id: c.id }, data: { totalSales, lastSaleAmount: lastAmt || null, retailPurchaseCount: retailItems } });

  if (opts.reservationInDays != null) {
    await prisma.reservation.create({ data: { customerId: c.id, startAt: new Date(now + opts.reservationInDays * DAY), status: "booked", source: "manual", memo: opts.menu } });
  }
  return status;
}

// 状態ごとのパラメータを生成
function buildOpts(state) {
  const gender = pick(["female", "female", "male"]); // 美容サロンは女性多め
  const { name, kana } = uniqueName(gender);
  const interval = ri(24, 45);
  const menu = pick(MENUS);
  const retailRatio = chance(0.55) ? rf(0.05, 0.28) : 0;
  const hairType = pick(HAIR);
  const allergies = chance(0.15) ? pick(ALLERGY) : null;

  let n, lastAgo, baseSale, consent, reservationInDays = null;
  switch (state) {
    case "vip":
      n = ri(6, 11); lastAgo = interval * rf(0.2, 0.7); baseSale = ri(14000, 25000); consent = chance(0.95);
      if (chance(0.3)) reservationInDays = ri(2, 25);
      break;
    case "active":
      n = ri(3, 6); lastAgo = interval * rf(0.2, 0.75); baseSale = ri(7000, 15000); consent = chance(0.85);
      if (chance(0.15)) reservationInDays = ri(2, 25);
      break;
    case "approaching":
      n = ri(3, 6); lastAgo = interval * rf(0.82, 0.99); baseSale = ri(8000, 16000); consent = chance(0.85);
      if (chance(0.12)) reservationInDays = ri(2, 20);
      break;
    case "overdue":
      n = ri(3, 6); lastAgo = interval * rf(1.1, 1.9); baseSale = ri(8000, 16000); consent = chance(0.8);
      if (chance(0.12)) reservationInDays = ri(2, 20);
      break;
    case "at_risk":
      n = ri(4, 8); lastAgo = ri(120, 178); baseSale = ri(9000, 17000); consent = chance(0.8);
      break;
    case "dormant":
      n = ri(2, 5); lastAgo = ri(190, 520); baseSale = ri(6000, 14000); consent = chance(0.7);
      break;
    case "new":
    default:
      n = ri(1, 2); lastAgo = ri(3, 40); baseSale = ri(6000, 12000); consent = chance(0.8);
      break;
  }

  const visitsDaysAgo = [];
  for (let i = 0; i < n; i++) visitsDaysAgo.push(Math.max(1, lastAgo + i * interval + ri(-4, 4)));
  const salePerVisit = [];
  for (let i = 0; i < n; i++) salePerVisit.push(Math.round((baseSale + ri(-2000, 3000)) / 100) * 100);

  return { name, kana, gender, consent, hairType, allergies, menu, retailRatio, visitsDaysAgo, salePerVisit, reservationInDays };
}

async function seed(num) {
  await clearDemo();

  // 状態の配分（合計が num に満たない分は active で補充）
  const planSpec = [["vip", 0.08], ["active", 0.18], ["approaching", 0.16], ["overdue", 0.17], ["at_risk", 0.10], ["dormant", 0.16], ["new", 0.15]];
  const plan = [];
  for (const [state, p] of planSpec) for (let i = 0; i < Math.round(num * p); i++) plan.push(state);
  while (plan.length < num) plan.push("active");
  while (plan.length > num) plan.pop();
  // shuffle
  for (let i = plan.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [plan[i], plan[j]] = [plan[j], plan[i]]; }

  const counts = {};
  for (const state of plan) {
    const s = await mkCustomer(buildOpts(state));
    counts[s] = (counts[s] || 0) + 1;
  }
  console.log(`[demo] seeded ${plan.length} demo customers.`);
  console.log(`[demo] 永続status内訳:`, counts);
}

async function main() {
  if (process.argv[2] === "clear") {
    await clearDemo();
  } else {
    const num = Number(process.argv[2]) || 100;
    await seed(num);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
