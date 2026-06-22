import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ImportPanel } from "@/components/ImportPanel";
import { CUSTOMER_COLUMNS } from "@/lib/data-io";

export const dynamic = "force-dynamic";

function ExportCard({
  title,
  desc,
  base,
  note,
}: {
  title: string;
  desc: string;
  base: string;
  note?: string;
}) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5">
      <h3 className="mb-1 text-sm font-semibold text-zinc-800">{title}</h3>
      <p className="mb-3 text-xs text-zinc-500">{desc}</p>
      <div className="flex flex-wrap gap-3">
        <a
          href={`${base}?format=csv`}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
        >
          CSV をダウンロード
        </a>
        <a
          href={`${base}?format=json`}
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-100"
        >
          JSON をダウンロード
        </a>
      </div>
      {note ? <p className="mt-2 text-xs text-zinc-400">{note}</p> : null}
    </section>
  );
}

export default async function DataPage() {
  await requireAuth();
  const [customerCount, saleCount, reservationCount] = await Promise.all([
    prisma.customer.count({ where: { deletedAt: null } }),
    prisma.sale.count(),
    prisma.reservation.count(),
  ]);

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">データ入出力</h1>
        <p className="mt-1 text-sm text-zinc-500">
          持ち込みデータ方式（CSV / JSON）。データは利用者環境にのみ保存されます。種別ごとにエクスポートできます。
        </p>
      </header>

      <h2 className="mb-3 text-sm font-semibold text-zinc-600">エクスポート（データ種別ごと）</h2>
      <div className="mb-8 space-y-4">
        <ExportCard
          title="顧客情報データ"
          desc={`顧客 ${customerCount} 件。氏名・連絡先・髪質/肌質/アレルギー・同意 等。`}
          base="/api/export/customers"
          note="連絡先（電話・メール）は復号して出力されます。取り扱いに注意してください。"
        />
        <ExportCard
          title="売上データ"
          desc={`会計 ${saleCount} 件。会計日・顧客・内訳・金額(税込)・割引・支払方法・担当。`}
          base="/api/export/sales"
        />
        <ExportCard
          title="予約データ"
          desc={`予約 ${reservationCount} 件。日時・顧客・メニュー・担当・状態・登録元。`}
          base="/api/export/reservations"
        />
        <ExportCard
          title="分析ダッシュボードデータ"
          desc="KPI・RFMセグメント分布・来店サイクル状態分布・客単価分布・上位顧客の集計。"
          base="/api/export/analytics"
          note="CSV は集計の long 形式（カテゴリ・項目・値）、JSON は生の集計データです。"
        />
      </div>

      <h2 className="mb-3 text-sm font-semibold text-zinc-600">インポート</h2>
      <section className="rounded-xl border border-zinc-200 bg-white p-5">
        <p className="mb-3 text-xs text-zinc-500">
          顧客データを取り込みます（現在インポートは顧客データのみ対応）。
          <code className="rounded bg-zinc-100 px-1">id</code> が既存と一致する行は更新、無い行は新規作成します。
          不正な行はスキップしてエラーを報告します。
        </p>
        <ImportPanel />
        <details className="mt-4 text-xs text-zinc-500">
          <summary className="cursor-pointer">対応カラム</summary>
          <p className="mt-2 break-all">
            <code>{CUSTOMER_COLUMNS.join(", ")}</code>
          </p>
          <p className="mt-1">
            必須: <code>name</code>。<code>hairType</code>/<code>skinType</code>/<code>allergies</code> は{" "}
            <code>;</code> 区切り、<code>consentToContact</code> は <code>true</code>/<code>false</code>、
            <code>birthday</code> は <code>YYYY-MM-DD</code>。
          </p>
        </details>
      </section>
    </div>
  );
}
