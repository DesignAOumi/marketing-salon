import { advanceConfirmAction } from "@/app/setup/actions";
import { PendingButton } from "@/components/setup/PendingButton";

type Svc = {
  id: string;
  name: string;
  price: number;
  memberPrice: number | null;
  category: string | null;
  durationMin: number | null;
  defaultCycleDays: number | null;
};
type Cat = { id: string; name: string };

const yen = (n: number) => "¥" + n.toLocaleString("ja-JP");

export function ConfirmStep({ categories, services }: { categories: Cat[]; services: Svc[] }) {
  return (
    <div className="space-y-5">
      <p className="text-sm text-zinc-500">
        以下の内容で登録します。問題なければ「次へ」に進んでください（後から設定でいつでも変更できます）。
      </p>

      <section>
        <p className="mb-2 text-xs font-semibold text-zinc-500">区分（{categories.length}件）</p>
        {categories.length === 0 ? (
          <p className="text-sm text-zinc-400">区分なし</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <span key={c.id} className="rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-700">{c.name}</span>
            ))}
          </div>
        )}
      </section>

      <section>
        <p className="mb-2 text-xs font-semibold text-zinc-500">メニュー（{services.length}件）</p>
        <div className="overflow-x-auto rounded-lg border border-zinc-200">
          <table className="w-full min-w-[460px] text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-xs text-zinc-500">
                <th className="px-3 py-2">メニュー</th>
                <th className="px-3 py-2">区分</th>
                <th className="px-3 py-2 text-right">価格(税込)</th>
                <th className="px-3 py-2 text-right">会員価格(税込)</th>
                <th className="px-3 py-2 text-right">所要</th>
                <th className="px-3 py-2 text-right">周期</th>
              </tr>
            </thead>
            <tbody>
              {services.map((s) => (
                <tr key={s.id} className="border-b border-zinc-100 last:border-0">
                  <td className="px-3 py-2 text-zinc-800">{s.name}</td>
                  <td className="px-3 py-2 text-zinc-500">{s.category ?? "—"}</td>
                  <td className="px-3 py-2 text-right text-zinc-800">{yen(s.price)}</td>
                  <td className="px-3 py-2 text-right text-zinc-500">{s.memberPrice != null ? yen(s.memberPrice) : "—"}</td>
                  <td className="px-3 py-2 text-right text-zinc-500">{s.durationMin != null ? `${s.durationMin}分` : "—"}</td>
                  <td className="px-3 py-2 text-right text-zinc-500">{s.defaultCycleDays != null ? `${s.defaultCycleDays}日` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <form action={advanceConfirmAction}>
        <PendingButton
          pendingText="進んでいます…"
          className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-70"
        >
          次へ（AI連携）
        </PendingButton>
      </form>
      <p className="text-xs text-zinc-400">※ 修正する場合は「← 前のステップに戻る」でメニュー登録に戻れます。</p>
    </div>
  );
}
