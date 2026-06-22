import Link from "next/link";
import { listCustomers } from "@/lib/customers";
import { deriveStatus, daysSince } from "@/lib/customer-status";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDate, formatYen } from "@/lib/format";

export const dynamic = "force-dynamic";

type SP = {
  q?: string;
  status?: string;
  sort?: string;
  vmin?: string;
  vmax?: string;
  lfrom?: string;
  lto?: string;
  smin?: string;
  smax?: string;
  amin?: string;
  amax?: string;
  consent?: string;
  page?: string;
};

const SORT_OPTIONS = [
  { v: "kana", l: "50音順" },
  { v: "visit_asc", l: "来店回数（昇順）" },
  { v: "visit_desc", l: "来店回数（降順）" },
  { v: "last_asc", l: "最終来店（昇順）" },
  { v: "last_desc", l: "最終来店（降順）" },
  { v: "sales_asc", l: "累計売上（昇順）" },
  { v: "sales_desc", l: "累計売上（降順）" },
  { v: "avg_asc", l: "平均売上単価（昇順）" },
  { v: "avg_desc", l: "平均売上単価（降順）" },
];
const SORT_VALUES = SORT_OPTIONS.map((o) => o.v);

const field = "rounded-md border border-zinc-300 px-2 py-1.5 text-sm outline-none focus:border-zinc-500";

export default async function CustomersPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;

  const status =
    sp.status === "new" || sp.status === "repeat" || sp.status === "dormant" ? sp.status : undefined;
  const sort = SORT_VALUES.includes(sp.sort ?? "") ? (sp.sort as string) : "last_desc";
  const num = (v?: string) => {
    const n = Number(v);
    return v != null && v !== "" && Number.isFinite(n) ? n : undefined;
  };
  const consent = sp.consent === "yes" || sp.consent === "no" ? sp.consent : undefined;
  const page = Number(sp.page ?? "1") || 1;

  const { rows, total, totalPages } = await listCustomers({
    q: sp.q,
    status,
    sort,
    visitMin: num(sp.vmin),
    visitMax: num(sp.vmax),
    salesMin: num(sp.smin),
    salesMax: num(sp.smax),
    avgMin: num(sp.amin),
    avgMax: num(sp.amax),
    lastFrom: sp.lfrom ? new Date(`${sp.lfrom}T00:00:00`) : undefined,
    lastTo: sp.lto ? new Date(`${sp.lto}T23:59:59`) : undefined,
    consent,
    page,
  });

  // ページネーション用に現在の絞り込みを維持して page だけ差し替える。
  const qp = (over: Partial<SP>) => {
    const params = new URLSearchParams();
    const base: Record<string, string | undefined> = {
      q: sp.q,
      status: sp.status,
      sort: sort === "last_desc" ? undefined : sort,
      vmin: sp.vmin,
      vmax: sp.vmax,
      lfrom: sp.lfrom,
      lto: sp.lto,
      smin: sp.smin,
      smax: sp.smax,
      amin: sp.amin,
      amax: sp.amax,
      consent: sp.consent,
      ...over,
    };
    for (const [k, v] of Object.entries(base)) if (v) params.set(k, String(v));
    const s = params.toString();
    return s ? `/customers?${s}` : "/customers";
  };

  const hasFilters =
    !!(status || sp.vmin || sp.vmax || sp.lfrom || sp.lto || sp.smin || sp.smax || sp.amin || sp.amax || consent);

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">顧客カルテ</h1>
          <p className="mt-1 text-sm text-zinc-500">{total} 名</p>
        </div>
        <Link href="/customers/new" className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700">
          ＋ 新規登録
        </Link>
      </header>

      <form method="get" className="mb-4 space-y-3 rounded-xl border border-zinc-200 bg-white p-4">
        <div className="flex flex-wrap items-center gap-2">
          <input name="q" defaultValue={sp.q} placeholder="氏名・フリガナで検索" className={`${field} w-56`} />
          <label className="flex items-center gap-1 text-xs text-zinc-500">
            並べ替え
            <select name="sort" defaultValue={sort} className={field}>
              {SORT_OPTIONS.map((o) => (
                <option key={o.v} value={o.v}>{o.l}</option>
              ))}
            </select>
          </label>
          <button className="rounded-md bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-zinc-700">検索</button>
          {sp.q || hasFilters || sort !== "last_desc" ? (
            <Link href="/customers" className="text-xs text-zinc-500 hover:underline">クリア</Link>
          ) : null}
        </div>

        <details open={hasFilters} className="border-t border-zinc-100 pt-3">
          <summary className="cursor-pointer select-none text-xs font-medium text-zinc-600">絞り込み</summary>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-xs text-zinc-500">
              状態
              <select name="status" defaultValue={status ?? ""} className={field}>
                <option value="">すべて</option>
                <option value="new">新規</option>
                <option value="repeat">リピート</option>
                <option value="dormant">休眠</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs text-zinc-500">
              連絡同意
              <select name="consent" defaultValue={consent ?? ""} className={field}>
                <option value="">すべて</option>
                <option value="yes">あり</option>
                <option value="no">なし</option>
              </select>
            </label>
            <div className="flex flex-col gap-1 text-xs text-zinc-500">
              来店回数（回）
              <div className="flex items-center gap-1">
                <input name="vmin" type="number" min={0} defaultValue={sp.vmin} placeholder="以上" className={`${field} w-24`} />
                <span>〜</span>
                <input name="vmax" type="number" min={0} defaultValue={sp.vmax} placeholder="以下" className={`${field} w-24`} />
              </div>
            </div>
            <div className="flex flex-col gap-1 text-xs text-zinc-500">
              最終来店（期間）
              <div className="flex items-center gap-1">
                <input name="lfrom" type="date" defaultValue={sp.lfrom} className={`${field} w-36`} />
                <span>〜</span>
                <input name="lto" type="date" defaultValue={sp.lto} className={`${field} w-36`} />
              </div>
            </div>
            <div className="flex flex-col gap-1 text-xs text-zinc-500">
              累計売上（円）
              <div className="flex items-center gap-1">
                <input name="smin" type="number" min={0} defaultValue={sp.smin} placeholder="以上" className={`${field} w-28`} />
                <span>〜</span>
                <input name="smax" type="number" min={0} defaultValue={sp.smax} placeholder="以下" className={`${field} w-28`} />
              </div>
            </div>
            <div className="flex flex-col gap-1 text-xs text-zinc-500">
              平均売上単価（円）
              <div className="flex items-center gap-1">
                <input name="amin" type="number" min={0} defaultValue={sp.amin} placeholder="以上" className={`${field} w-28`} />
                <span>〜</span>
                <input name="amax" type="number" min={0} defaultValue={sp.amax} placeholder="以下" className={`${field} w-28`} />
              </div>
            </div>
          </div>
        </details>
      </form>

      <p className="mb-2 text-xs text-zinc-400">
        状態は「最終来店からの経過 ÷ 平均来店間隔（＝サイクル経過率）」で判定：100%以下=アクティブ / 100〜300%=要フォロー /
        300%超=休眠（来店1回以下=新規）。
      </p>
      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-zinc-50 text-left text-xs text-zinc-500">
            <tr>
              <th className="whitespace-nowrap px-4 py-3 font-medium">氏名</th>
              <th className="whitespace-nowrap px-4 py-3 font-medium">状態</th>
              <th className="whitespace-nowrap px-4 py-3 font-medium">平均来店間隔</th>
              <th className="whitespace-nowrap px-4 py-3 font-medium">サイクル経過率</th>
              <th className="whitespace-nowrap px-4 py-3 font-medium">来店回数</th>
              <th className="whitespace-nowrap px-4 py-3 font-medium">最終来店</th>
              <th className="whitespace-nowrap px-4 py-3 font-medium">累計売上</th>
              <th className="whitespace-nowrap px-4 py-3 font-medium">平均売上単価</th>
              <th className="whitespace-nowrap px-4 py-3 font-medium">連絡同意</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-zinc-400">該当する顧客がいません。</td>
              </tr>
            ) : (
              rows.map((c) => {
                const s = deriveStatus(c);
                const dsl = daysSince(c.lastVisitDate);
                const avg = c.avgVisitIntervalDays && c.avgVisitIntervalDays > 0 ? Math.round(c.avgVisitIntervalDays) : null;
                const ratio = avg && dsl != null ? Math.round((dsl / avg) * 100) : null;
                return (
                  <tr key={c.id} className="hover:bg-zinc-50">
                    <td className="px-4 py-3">
                      <Link href={`/customers/${c.id}`} className="block whitespace-nowrap font-medium text-zinc-900 hover:underline">
                        {c.name}
                      </Link>
                      {c.nameKana ? <span className="block whitespace-nowrap text-xs text-zinc-400">{c.nameKana}</span> : null}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge label={s.label} tone={s.tone} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-zinc-600">{avg != null ? `${avg} 日` : "—"}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-zinc-600">
                      {ratio != null ? (
                        <>
                          <span className="font-medium">{ratio}%</span>
                          <span className="block text-[10px] text-zinc-400">{dsl}/{avg}日</span>
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-zinc-600">{c.visitCount} 回</td>
                    <td className="whitespace-nowrap px-4 py-3 text-zinc-600">{formatDate(c.lastVisitDate)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-zinc-600">{formatYen(c.totalSales)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-zinc-600">
                      {c.visitCount > 0 ? formatYen(c.avgSpend) : "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-zinc-600">{c.consentToContact ? "○" : "—"}</td>
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
            <Link href={qp({ page: String(page - 1) })} className="rounded-md border px-3 py-1 hover:bg-zinc-100">← 前へ</Link>
          ) : null}
          <span className="text-zinc-500">{page} / {totalPages}</span>
          {page < totalPages ? (
            <Link href={qp({ page: String(page + 1) })} className="rounded-md border px-3 py-1 hover:bg-zinc-100">次へ →</Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
