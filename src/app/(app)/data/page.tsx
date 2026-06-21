import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ImportPanel } from "@/components/ImportPanel";
import { CUSTOMER_COLUMNS } from "@/lib/data-io";

export const dynamic = "force-dynamic";

export default async function DataPage() {
  await requireAuth();
  const count = await prisma.customer.count({ where: { deletedAt: null } });

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">データ入出力</h1>
        <p className="mt-1 text-sm text-zinc-500">
          顧客データ {count} 件。持ち込みデータ方式（CSV / JSON）。データは利用者環境にのみ保存されます。
        </p>
      </header>

      <section className="mb-6 rounded-xl border border-zinc-200 bg-white p-5">
        <h2 className="mb-1 text-sm font-semibold text-zinc-800">エクスポート</h2>
        <p className="mb-3 text-xs text-zinc-500">
          連絡先（電話・メール）は復号して出力されます。取り扱いに注意してください。
        </p>
        <div className="flex gap-3">
          <a
            href="/api/export/customers?format=csv"
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
          >
            CSV をダウンロード
          </a>
          <a
            href="/api/export/customers?format=json"
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-100"
          >
            JSON をダウンロード
          </a>
        </div>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-5">
        <h2 className="mb-1 text-sm font-semibold text-zinc-800">インポート</h2>
        <p className="mb-3 text-xs text-zinc-500">
          CSV / JSON を取り込みます。<code className="rounded bg-zinc-100 px-1">id</code> が既存と一致する行は更新、
          無い行は新規作成します。不正な行はスキップしてエラーを報告します。
        </p>
        <ImportPanel />
        <details className="mt-4 text-xs text-zinc-500">
          <summary className="cursor-pointer">対応カラム</summary>
          <p className="mt-2 break-all">
            <code>{CUSTOMER_COLUMNS.join(", ")}</code>
          </p>
          <p className="mt-1">
            必須: <code>name</code>。<code>allergies</code> は <code>;</code> 区切り、
            <code>consentToContact</code> は <code>true</code>/<code>false</code>、
            <code>birthday</code> は <code>YYYY-MM-DD</code>。
          </p>
        </details>
      </section>
    </div>
  );
}
