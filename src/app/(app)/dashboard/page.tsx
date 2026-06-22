import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getCurrentMonthSales } from "@/lib/sales";
import { getM6Targets } from "@/lib/advice";
import { formatYen } from "@/lib/format";

export const dynamic = "force-dynamic";

// サロンの状況サマリ(KPI)を表示する。導入チェックリストは設定画面へ移動。
export default async function DashboardPage() {
  const session = await getSession();

  // DB 接続確認（マイグレーション済みなら成功）。未移行時も画面が壊れないようにフォールバック。
  let customerCount: number | null = null;
  let reservationCount: number | null = null;
  let monthSales: number | null = null;
  let m6Count: number | null = null;
  let dbError: string | null = null;
  try {
    const [cc, rc, ms, m6] = await Promise.all([
      prisma.customer.count({ where: { deletedAt: null } }),
      prisma.reservation.count(),
      getCurrentMonthSales(),
      getM6Targets(),
    ]);
    customerCount = cc;
    reservationCount = rc;
    monthSales = ms;
    m6Count = m6.length;
  } catch (e) {
    dbError = e instanceof Error ? e.message : String(e);
  }

  const kpis = [
    { label: "総顧客数", value: customerCount === null ? "—" : `${customerCount}`, hint: "M1 / M4" },
    { label: "当月売上", value: monthSales === null ? "—" : formatYen(monthSales), hint: "M2" },
    { label: "予約件数", value: reservationCount === null ? "—" : `${reservationCount}`, hint: "M3" },
    { label: "本日の再来店提案", value: m6Count === null ? "—" : `${m6Count}`, hint: "M6" },
  ];

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">ダッシュボード</h1>
        <p className="mt-1 text-sm text-zinc-500">
          ようこそ、{session?.name || session?.email} さん。サロンの状況と導入の進捗を確認できます。
        </p>
      </header>

      {dbError ? (
        <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
          DBに接続できませんでした。マイグレーション未適用の可能性があります（
          <code className="rounded bg-amber-100 px-1">npm run prisma:migrate</code>
          ／Dockerでは起動時に自動適用）。詳細: {dbError}
        </div>
      ) : null}

      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {kpis.map((k) => (
          <div
            key={k.label}
            className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"
          >
            <p className="text-xs text-zinc-500">{k.label}</p>
            <p className="mt-2 text-2xl font-bold text-zinc-900">{k.value}</p>
            <p className="mt-1 text-[11px] text-zinc-400">{k.hint}</p>
          </div>
        ))}
      </section>

    </div>
  );
}
