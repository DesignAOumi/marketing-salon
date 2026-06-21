/**
 * 分析ダッシュボード集計（M4）。Node 専用。
 * KPI・RFMセグメント分布・来店サイクル状態分布・上位顧客・客単価分布を提供する。
 */
import "server-only";
import { prisma } from "@/lib/prisma";
import { computeRfm, type RfmSegment } from "@/lib/rfm";
import { daysSince, cycleOverdueRatio, cycleState, type CycleState } from "@/lib/cycle";
import { getCurrentMonthSales } from "@/lib/sales";

const SPEND_BUCKETS: { label: string; min: number; max: number }[] = [
  { label: "〜3千円", min: 0, max: 3000 },
  { label: "3〜6千円", min: 3000, max: 6000 },
  { label: "6千〜1万円", min: 6000, max: 10000 },
  { label: "1〜1.5万円", min: 10000, max: 15000 },
  { label: "1.5万円〜", min: 15000, max: Infinity },
];

export async function getAnalytics() {
  const now = new Date();
  const customers = await prisma.customer.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      name: true,
      visitCount: true,
      totalSales: true,
      lastVisitDate: true,
      avgVisitIntervalDays: true,
      status: true,
    },
  });

  // RFM
  const rfm = computeRfm(
    customers.map((c) => ({
      id: c.id,
      recencyDays: daysSince(c.lastVisitDate, now),
      frequency: c.visitCount,
      monetary: c.totalSales,
    })),
  );
  const segCount: Record<RfmSegment, number> = {
    vip: 0,
    loyal: 0,
    stable: 0,
    new: 0,
    at_risk: 0,
    lost: 0,
  };
  for (const r of rfm) segCount[r.segment]++;

  // 来店サイクル状態分布
  const cycleCount: Record<CycleState, number> = {
    before: 0,
    approaching: 0,
    overdue: 0,
    dormant: 0,
    unknown: 0,
  };
  for (const c of customers) {
    const dsl = daysSince(c.lastVisitDate, now);
    const ratio = cycleOverdueRatio(dsl, c.avgVisitIntervalDays);
    cycleCount[cycleState(ratio, dsl)]++;
  }

  // 客単価分布（来店のある顧客のみ）
  const spendDist = SPEND_BUCKETS.map((b) => ({ label: b.label, count: 0 }));
  for (const c of customers) {
    if (c.visitCount <= 0) continue;
    const spend = c.totalSales / c.visitCount;
    const idx = SPEND_BUCKETS.findIndex((b) => spend >= b.min && spend < b.max);
    if (idx >= 0) spendDist[idx].count++;
  }

  // KPI
  const total = customers.length;
  const dormant = customers.filter((c) => c.status === "dormant").length;
  const active = total - dormant;
  const followUp = cycleCount.overdue + cycleCount.approaching;
  const totalVisits = customers.reduce((a, c) => a + c.visitCount, 0);
  const totalSalesAll = customers.reduce((a, c) => a + c.totalSales, 0);
  const avgSpend = totalVisits > 0 ? Math.round(totalSalesAll / totalVisits) : 0;

  const [monthSales, retailAgg] = await Promise.all([
    getCurrentMonthSales(now),
    prisma.saleItem.aggregate({ where: { itemType: "product" }, _sum: { amount: true } }),
  ]);
  const retailRatio = totalSalesAll > 0 ? (retailAgg._sum.amount ?? 0) / totalSalesAll : null;

  // 上位顧客（累計売上）
  const top = [...customers]
    .filter((c) => c.totalSales > 0)
    .sort((a, b) => b.totalSales - a.totalSales)
    .slice(0, 10)
    .map((c) => ({ id: c.id, name: c.name, totalSales: c.totalSales, visitCount: c.visitCount }));

  return {
    kpi: { total, active, dormant, followUp, monthSales, avgSpend, retailRatio },
    segCount,
    cycleCount,
    spendDist,
    top,
  };
}
