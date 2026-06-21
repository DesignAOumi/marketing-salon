import Link from "next/link";
import { listCustomers } from "@/lib/customers";
import { deriveStatus } from "@/lib/customer-status";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDate, formatYen } from "@/lib/format";

export const dynamic = "force-dynamic";

type SP = { q?: string; status?: string; sort?: string; page?: string };

const STATUS_TABS = [
  { v: "", l: "すべて" },
  { v: "new", l: "新規" },
  { v: "repeat", l: "リピート" },
  { v: "dormant", l: "休眠" },
];

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const status =
    sp.status === "new" || sp.status === "repeat" || sp.status === "dormant"
      ? sp.status
      : undefined;
  const sort =
    sp.sort === "name" || sp.sort === "registered" ? sp.sort : "recent";
  const page = Number(sp.page ?? "1") || 1;

  const { rows, total, totalPages } = await listCustomers({
    q: sp.q,
    status,
    sort,
    page,
  });

  const qp = (over: Partial<SP>) => {
    const params = new URLSearchParams();
    if (sp.q) params.set("q", sp.q);
    if (status) params.set("status", status);
    if (sort !== "recent") params.set("sort", sort);
    for (const [k, v] of Object.entries(over)) {
      if (v) params.set(k, String(v));
      else params.delete(k);
    }
    const s = params.toString();
    return s ? `/customers?${s}` : "/customers";
  };

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">顧客カルテ</h1>
          <p className="mt-1 text-sm text-zinc-500">{total} 名</p>
        </div>
        <Link
          href="/customers/new"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
        >
          ＋ 新規登録
        </Link>
      </header>

      <form method="get" className="mb-4 flex flex-wrap items-center gap-2">
        <input
          name="q"
          defaultValue={sp.q}
          placeholder="氏名・フリガナで検索"
          className="w-64 rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500"
        />
        {status ? <input type="hidden" name="status" value={status} /> : null}
        <select
          name="sort"
          defaultValue={sort}
          className="rounded-md border border-zinc-300 px-2 py-2 text-sm"
        >
          <option value="recent">最終来店が新しい順</option>
          <option value="name">フリガナ順</option>
          <option value="registered">登録が新しい順</option>
        </select>
        <button className="rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100">
          検索
        </button>
      </form>

      <nav className="mb-4 flex gap-2">
        {STATUS_TABS.map((t) => {
          const active = (status ?? "") === t.v;
          return (
            <Link
              key={t.v}
              href={qp({ status: t.v || undefined, page: undefined })}
              className={`rounded-full px-3 py-1 text-sm ${
                active ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              {t.l}
            </Link>
          );
        })}
      </nav>

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-left text-xs text-zinc-500">
            <tr>
              <th className="px-4 py-3 font-medium">氏名</th>
              <th className="px-4 py-3 font-medium">状態</th>
              <th className="px-4 py-3 font-medium">来店回数</th>
              <th className="px-4 py-3 font-medium">最終来店</th>
              <th className="px-4 py-3 font-medium">累計売上</th>
              <th className="px-4 py-3 font-medium">連絡同意</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-zinc-400">
                  該当する顧客がいません。
                </td>
              </tr>
            ) : (
              rows.map((c) => {
                const s = deriveStatus(c);
                return (
                  <tr key={c.id} className="hover:bg-zinc-50">
                    <td className="px-4 py-3">
                      <Link href={`/customers/${c.id}`} className="font-medium text-zinc-900 hover:underline">
                        {c.name}
                      </Link>
                      {c.nameKana ? (
                        <span className="ml-2 text-xs text-zinc-400">{c.nameKana}</span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge label={s.label} tone={s.tone} />
                    </td>
                    <td className="px-4 py-3 text-zinc-600">{c.visitCount} 回</td>
                    <td className="px-4 py-3 text-zinc-600">{formatDate(c.lastVisitDate)}</td>
                    <td className="px-4 py-3 text-zinc-600">{formatYen(c.totalSales)}</td>
                    <td className="px-4 py-3 text-zinc-600">
                      {c.consentToContact ? "○" : "—"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 ? (
        <div className="mt-4 flex items-center justify-center gap-3 text-sm">
          {page > 1 ? (
            <Link href={qp({ page: String(page - 1) })} className="rounded-md border px-3 py-1 hover:bg-zinc-100">
              ← 前へ
            </Link>
          ) : null}
          <span className="text-zinc-500">
            {page} / {totalPages}
          </span>
          {page < totalPages ? (
            <Link href={qp({ page: String(page + 1) })} className="rounded-md border px-3 py-1 hover:bg-zinc-100">
              次へ →
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
