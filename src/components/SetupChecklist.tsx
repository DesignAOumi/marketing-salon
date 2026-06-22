import Link from "next/link";
import { getSetupStatus } from "@/lib/setup-status";

// ダッシュボード用「導入チェックリスト」。実データから完了を自動判定し進捗を表示する。
export async function SetupChecklist() {
  const { items, requiredTotal, requiredDone, optionalTotal, optionalDone, percent } =
    await getSetupStatus();

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-zinc-800">導入チェックリスト（自動判定）</h2>
        <Link href="/dashboard" className="text-xs text-zinc-400 hover:text-zinc-600">
          ↻ 再チェック
        </Link>
      </div>

      {/* 進捗バー（必須項目の達成率） */}
      <div className="mb-1 flex items-center justify-between text-xs text-zinc-500">
        <span>
          必須 {requiredDone}/{requiredTotal} 完了
          <span className="ml-2 text-zinc-400">
            ・任意 {optionalDone}/{optionalTotal}
          </span>
        </span>
        <span className="font-medium text-zinc-700">{percent}%</span>
      </div>
      <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-zinc-100">
        <div
          className={`h-2 rounded-full ${percent === 100 ? "bg-emerald-500" : "bg-zinc-900"}`}
          style={{ width: `${percent}%` }}
        />
      </div>

      <ul className="divide-y divide-zinc-100">
        {items.map((item) => (
          <li key={item.key} className="flex items-start gap-3 py-2.5">
            <span
              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs ${
                item.done ? "bg-emerald-100 text-emerald-700" : "border border-zinc-300 text-zinc-300"
              }`}
              aria-label={item.done ? "完了" : "未完了"}
            >
              {item.done ? "✓" : ""}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium ${item.done ? "text-zinc-800" : "text-zinc-700"}`}>
                  {item.title}
                </span>
                {!item.required ? (
                  <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] text-zinc-500">任意</span>
                ) : null}
              </div>
              <p className="mt-0.5 text-xs text-zinc-500">{item.description}</p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1 text-right">
              <span className={`text-xs ${item.done ? "text-emerald-600" : "text-zinc-400"}`}>
                {item.detail}
              </span>
              <Link href={item.href} className="text-xs text-zinc-500 hover:underline">
                {item.done ? "開く" : "設定する"}
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
