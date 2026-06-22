import { ImportPanel } from "@/components/ImportPanel";
import { importSampleAction, advanceCustomersAction } from "@/app/setup/actions";

// サーバーコンポーネント。サンプル取り込み / CSV取り込み / 次へ。
export function CustomersStep({ customerCount }: { customerCount: number }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-500">
        顧客を登録します。まずはサンプルで動きを試すか、お持ちのCSVを取り込めます。
      </p>

      <div className="rounded-lg border border-zinc-200 p-4">
        <p className="text-sm font-medium text-zinc-800">サンプルで試す</p>
        <p className="mt-1 text-xs text-zinc-500">
          架空の顧客（来店・売上つき・約24名）を取り込みます。来店サイクルや分析・再来店提案をすぐ確認できます。
        </p>
        <div className="mt-3 flex items-center gap-3">
          <form action={importSampleAction}>
            <button className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700">
              サンプル顧客を取り込む
            </button>
          </form>
          <span className="text-sm text-zinc-500">現在の顧客数: {customerCount} 名</span>
        </div>
      </div>

      <details className="rounded-lg border border-zinc-200 p-4">
        <summary className="cursor-pointer text-sm font-medium text-zinc-800">CSV / JSON で取り込む</summary>
        <p className="mt-2 text-xs text-zinc-500">既存ツールからのエクスポートや、サンプルCSV（data/samples）を取り込めます。</p>
        <div className="mt-3">
          <ImportPanel />
        </div>
      </details>

      <form action={advanceCustomersAction}>
        <button className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700">
          次へ
        </button>
      </form>
      <p className="text-xs text-zinc-400">※ 顧客は後からいつでも追加できます。サンプルは設定後に個別削除も可能です。</p>
    </div>
  );
}
