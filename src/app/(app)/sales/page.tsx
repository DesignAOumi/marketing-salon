import Link from "next/link";
import { listRecentSales } from "@/lib/sales";
import { formatYen } from "@/lib/format";

export const dynamic = "force-dynamic";

const PAY: Record<string, string> = { cash: "現金", card: "カード", emoney: "電子マネー", other: "その他" };

function fmtDate(d: Date) {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export default async function SalesPage() {
  const sales = await listRecentSales();
  const total = sales.reduce((a, s) => a + s.totalAmount, 0);

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">売上・購買</h1>
        <p className="mt-1 text-sm text-zinc-500">
          直近の会計一覧（最新 {sales.length} 件・税込）。各会計の登録・編集は顧客カルテの「会計・購買履歴」から行えます。
        </p>
      </header>

      <div className="mb-4 grid grid-cols-2 gap-4 sm:max-w-md">
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <p className="text-xs text-zinc-500">表示件数</p>
          <p className="mt-1 text-xl font-bold text-zinc-900">{sales.length} 件</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <p className="text-xs text-zinc-500">合計（表示分）</p>
          <p className="mt-1 text-xl font-bold text-zinc-900">{formatYen(total)}</p>
        </div>
      </div>

      {sales.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-500">
          会計の記録がありません。顧客カルテを開き「会計・購買履歴」から登録できます。
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
          <table className="w-full min-w-[680px] text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-xs text-zinc-500">
                <th className="px-4 py-2">会計日</th>
                <th className="px-4 py-2">顧客</th>
                <th className="px-4 py-2">内訳</th>
                <th className="px-4 py-2 text-right">金額(税込)</th>
                <th className="px-4 py-2">支払</th>
                <th className="px-4 py-2">担当</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((s) => (
                <tr key={s.id} className="border-b border-zinc-100 last:border-0">
                  <td className="whitespace-nowrap px-4 py-2 text-zinc-600">{fmtDate(s.date)}</td>
                  <td className="px-4 py-2">
                    <Link href={`/customers/${s.customer.id}`} className="text-zinc-800 hover:underline">
                      {s.customer.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-zinc-500">{s.items.map((i) => i.name).join("・") || "—"}</td>
                  <td className="px-4 py-2 text-right font-medium text-zinc-800">{formatYen(s.totalAmount)}</td>
                  <td className="px-4 py-2 text-zinc-500">
                    {s.paymentMethod ? (PAY[s.paymentMethod] ?? s.paymentMethod) : "—"}
                  </td>
                  <td className="px-4 py-2 text-zinc-500">{s.staff?.name ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
