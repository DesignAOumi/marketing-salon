import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { getAnalytics } from "@/lib/analytics";
import { RFM_SEGMENT_LABEL, type RfmSegment } from "@/lib/rfm";
import { CYCLE_STATE_LABEL, type CycleState } from "@/lib/cycle";
import { BarList } from "@/components/BarList";
import { formatYen } from "@/lib/format";

export const dynamic = "force-dynamic";

const SEG_ORDER: RfmSegment[] = ["vip", "loyal", "stable", "new", "at_risk", "lost"];
const CYCLE_ORDER: CycleState[] = ["before", "approaching", "overdue", "dormant", "unknown"];

export default async function AnalyticsPage() {
  await requireAuth();
  const a = await getAnalytics();

  const kpis = [
    { label: "総顧客数", value: `${a.kpi.total}` },
    { label: "アクティブ / 休眠", value: `${a.kpi.active} / ${a.kpi.dormant}` },
    { label: "要フォロー", value: `${a.kpi.followUp}` },
    { label: "当月売上", value: formatYen(a.kpi.monthSales) },
    { label: "平均客単価", value: formatYen(a.kpi.avgSpend) },
    {
      label: "店販比率",
      value: a.kpi.retailRatio === null ? "—" : `${Math.round(a.kpi.retailRatio * 100)}%`,
    },
  ];

  const segItems = SEG_ORDER.map((s) => ({ label: RFM_SEGMENT_LABEL[s], count: a.segCount[s] }));
  const cycleItems = CYCLE_ORDER.map((s) => ({
    label: CYCLE_STATE_LABEL[s],
    count: a.cycleCount[s],
  }));

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">分析ダッシュボード</h1>
        <p className="mt-1 text-sm text-zinc-500">RFM・セグメント・来店周期の俯瞰（M4）</p>
      </header>

      <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-xl border border-zinc-200 bg-white p-4">
            <p className="text-xs text-zinc-500">{k.label}</p>
            <p className="mt-1 text-lg font-bold text-zinc-900">{k.value}</p>
          </div>
        ))}
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-zinc-800">RFM セグメント分布</h2>
          <BarList items={segItems} color="bg-indigo-500" />
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="mb-1 text-sm font-semibold text-zinc-800">来店サイクル状態分布</h2>
          <p className="mb-4 text-xs text-zinc-400">
            「接近」「超過」が再来店提案（M6）の主対象です。
          </p>
          <BarList items={cycleItems} color="bg-amber-500" />
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-zinc-800">客単価分布</h2>
          <BarList items={a.spendDist} color="bg-emerald-500" />
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-zinc-800">上位顧客（累計売上）</h2>
          {a.top.length === 0 ? (
            <p className="py-6 text-center text-sm text-zinc-400">売上データがありません。</p>
          ) : (
            <ol className="space-y-1 text-sm">
              {a.top.map((c, i) => (
                <li key={c.id} className="flex items-center justify-between">
                  <span className="text-zinc-700">
                    <span className="mr-2 text-xs text-zinc-400">{i + 1}.</span>
                    <Link href={`/customers/${c.id}`} className="hover:underline">
                      {c.name}
                    </Link>
                    <span className="ml-2 text-xs text-zinc-400">{c.visitCount}回</span>
                  </span>
                  <span className="font-medium text-zinc-900">{formatYen(c.totalSales)}</span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </div>
  );
}
