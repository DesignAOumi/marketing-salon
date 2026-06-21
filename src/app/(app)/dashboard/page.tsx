import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getCurrentMonthSales } from "@/lib/sales";
import { formatYen } from "@/lib/format";

export const dynamic = "force-dynamic";

// Phase 0: ダッシュボード「枠」。DB接続を確認しつつ主要KPIのプレースホルダを表示する。
// 実データの集計（FR-M4-01 等）は Phase 1〜2 で実装する。
export default async function DashboardPage() {
  const session = await getSession();

  // DB 接続確認（マイグレーション済みなら成功）。未移行時も画面が壊れないようにフォールバック。
  let customerCount: number | null = null;
  let reservationCount: number | null = null;
  let monthSales: number | null = null;
  let dbError: string | null = null;
  try {
    [customerCount, reservationCount, monthSales] = await Promise.all([
      prisma.customer.count({ where: { deletedAt: null } }),
      prisma.reservation.count(),
      getCurrentMonthSales(),
    ]);
  } catch (e) {
    dbError = e instanceof Error ? e.message : String(e);
  }

  const kpis = [
    { label: "総顧客数", value: customerCount === null ? "—" : `${customerCount}`, hint: "M1 / M4" },
    { label: "当月売上", value: monthSales === null ? "—" : formatYen(monthSales), hint: "M2" },
    { label: "予約件数", value: reservationCount === null ? "—" : `${reservationCount}`, hint: "M3" },
    { label: "本日の再来店提案", value: "—", hint: "M6（Phase 3）" },
  ];

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">ダッシュボード</h1>
        <p className="mt-1 text-sm text-zinc-500">
          ようこそ、{session?.name || session?.email} さん。これは Phase 0 の初期画面枠です。
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

      <section className="mt-8 rounded-xl border border-zinc-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-zinc-800">実装ロードマップ</h2>
        <ol className="mt-3 space-y-1 text-sm text-zinc-600">
          <li>Phase 0 — 雛形・Docker・DBスキーマ（現在地）</li>
          <li>Phase 1 — M1顧客カルテ ＋ M2売上・購買</li>
          <li>Phase 2 — M3来店サイクル ＋ M4分析</li>
          <li>Phase 3 — M6再来店提案 ＋ 連携なしアドバイス（MVP到達点）</li>
          <li>Phase 4 — M5 GCal連携 ＋ 連携ありAI</li>
          <li>Phase 5 — OSS公開整備</li>
        </ol>
      </section>
    </div>
  );
}
