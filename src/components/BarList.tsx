// 依存追加なしの横棒分布（サーバーコンポーネント）。Recharts へ後日差し替え可。
export function BarList({
  items,
  color = "bg-zinc-800",
}: {
  items: { label: string; count: number }[];
  color?: string;
}) {
  const max = Math.max(1, ...items.map((i) => i.count));
  return (
    <div className="space-y-2">
      {items.map((it) => (
        <div key={it.label} className="flex items-center gap-2">
          <span className="w-24 shrink-0 text-xs text-zinc-500">{it.label}</span>
          <div className="h-5 flex-1 overflow-hidden rounded bg-zinc-100">
            <div
              className={`h-5 rounded ${color}`}
              style={{ width: `${(it.count / max) * 100}%`, minWidth: it.count > 0 ? "6px" : "0" }}
            />
          </div>
          <span className="w-10 shrink-0 text-right text-xs text-zinc-600">{it.count}</span>
        </div>
      ))}
    </div>
  );
}
