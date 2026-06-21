import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { getCustomerById, listActiveStaff } from "@/lib/customers";
import { getCustomerSalesMetrics, listSalesByCustomer } from "@/lib/sales";
import { customerUpcoming } from "@/lib/reservations";
import { getAdviceForCustomer } from "@/lib/advice";
import { deriveStatus } from "@/lib/customer-status";
import { cycleOverdueRatio, cycleState, CYCLE_STATE_LABEL } from "@/lib/cycle";
import { StatusBadge } from "@/components/StatusBadge";
import { AddVisitForm } from "@/components/AddVisitForm";
import { SaleForm } from "@/components/SaleForm";
import { CopyButton } from "@/components/CopyButton";
import { formatDate, formatYen } from "@/lib/format";
import {
  addVisitAction,
  deleteCustomerAction,
  deleteSaleAction,
  createSaleAction,
} from "../actions";

export const dynamic = "force-dynamic";

const GENDER_LABEL: Record<string, string> = {
  female: "女性",
  male: "男性",
  other: "その他",
  unknown: "不明",
};

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAuth();
  const { id } = await params;
  const [customer, staff, metrics, sales, upcoming, advice] = await Promise.all([
    getCustomerById(id),
    listActiveStaff(),
    getCustomerSalesMetrics(id),
    listSalesByCustomer(id),
    customerUpcoming(id),
    getAdviceForCustomer(id),
  ]);
  if (!customer) notFound();

  const s = deriveStatus(customer);
  const ratio = cycleOverdueRatio(s.daysSinceLastVisit, customer.avgVisitIntervalDays);
  const cstate = cycleState(ratio, s.daysSinceLastVisit);
  const today = new Date().toISOString().slice(0, 10);
  const boundAddVisit = addVisitAction.bind(null, id);
  const boundDelete = deleteCustomerAction.bind(null, id);
  const boundCreateSale = createSaleAction.bind(null, id);

  const kpis = [
    { label: "客単価", value: formatYen(metrics.avgSpend) },
    { label: "累計売上 / LTV", value: formatYen(metrics.ltv) },
    {
      label: "店販比率",
      value: metrics.retailRatio === null ? "—" : `${Math.round(metrics.retailRatio * 100)}%`,
    },
    { label: "来店回数", value: `${customer.visitCount} 回` },
  ];

  const PAY_LABEL: Record<string, string> = {
    cash: "現金",
    card: "カード",
    emoney: "電子マネー",
    other: "その他",
  };

  const info: { label: string; value: string }[] = [
    { label: "フリガナ", value: customer.nameKana ?? "—" },
    { label: "性別", value: customer.gender ? (GENDER_LABEL[customer.gender] ?? customer.gender) : "—" },
    { label: "生年月日", value: formatDate(customer.birthday) },
    { label: "電話", value: customer.phone ?? "—" },
    { label: "メール", value: customer.email ?? "—" },
    { label: "担当", value: customer.preferredStaff?.name ?? "—" },
    { label: "髪質", value: customer.hairType ?? "—" },
    { label: "肌質", value: customer.skinType ?? "—" },
  ];

  return (
    <div className="mx-auto max-w-4xl">
      <nav className="mb-4 text-sm text-zinc-500">
        <Link href="/customers" className="hover:underline">
          顧客カルテ
        </Link>
        <span className="mx-1">/</span>
        {customer.name}
      </nav>

      <header className="mb-6 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-zinc-900">{customer.name}</h1>
            <StatusBadge label={s.label} tone={s.tone} />
          </div>
          <p className="mt-1 text-sm text-zinc-500">
            来店 {customer.visitCount} 回 ・ 累計 {formatYen(customer.totalSales)}
            {s.daysSinceLastVisit !== null ? ` ・ 最終来店から ${s.daysSinceLastVisit} 日` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/customers/${id}/edit`}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100"
          >
            編集
          </Link>
          <form action={boundDelete}>
            <button
              type="submit"
              className="rounded-md border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              削除
            </button>
          </form>
        </div>
      </header>

      {customer.allergiesList.length > 0 ? (
        <div className="mb-6 rounded-lg border border-red-300 bg-red-50 p-4">
          <p className="text-sm font-bold text-red-700">⚠ アレルギー・禁忌</p>
          <p className="mt-1 text-sm text-red-700">{customer.allergiesList.join(" / ")}</p>
        </div>
      ) : null}

      <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-xl border border-zinc-200 bg-white p-4">
            <p className="text-xs text-zinc-500">{k.label}</p>
            <p className="mt-1 text-xl font-bold text-zinc-900">{k.value}</p>
          </div>
        ))}
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="lg:col-span-1">
          <div className="mb-4 rounded-xl border border-zinc-200 bg-white p-5">
            <h2 className="mb-3 text-sm font-semibold text-zinc-800">来店サイクル</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500">平均来店間隔</dt>
                <dd className="text-zinc-800">
                  {customer.avgVisitIntervalDays
                    ? `${Math.round(customer.avgVisitIntervalDays)} 日`
                    : "算出不可"}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500">次回予測日</dt>
                <dd className="text-zinc-800">{formatDate(customer.nextPredictedVisitDate)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500">サイクル状態</dt>
                <dd>
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-700">
                    {CYCLE_STATE_LABEL[cstate]}
                  </span>
                </dd>
              </div>
              <div className="flex justify-between gap-4 border-t border-zinc-100 pt-2">
                <dt className="text-zinc-500">先の予約</dt>
                <dd className="text-zinc-800">
                  {upcoming.hasUpcomingReservation
                    ? formatDate(upcoming.nextReservationDate)
                    : "なし"}
                </dd>
              </div>
            </dl>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <h2 className="mb-3 text-sm font-semibold text-zinc-800">基本情報</h2>
            <dl className="space-y-2 text-sm">
              {info.map((row) => (
                <div key={row.label} className="flex justify-between gap-4">
                  <dt className="text-zinc-500">{row.label}</dt>
                  <dd className="text-right text-zinc-800">{row.value}</dd>
                </div>
              ))}
              <div className="flex justify-between gap-4 border-t border-zinc-100 pt-2">
                <dt className="text-zinc-500">連絡同意</dt>
                <dd className="text-right text-zinc-800">
                  {customer.consentToContact ? "あり" : "なし"}
                </dd>
              </div>
            </dl>
            {customer.preferences ? (
              <div className="mt-4 border-t border-zinc-100 pt-3">
                <p className="text-xs font-medium text-zinc-500">嗜好</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-700">{customer.preferences}</p>
              </div>
            ) : null}
            {customer.notes ? (
              <div className="mt-4 border-t border-zinc-100 pt-3">
                <p className="text-xs font-medium text-zinc-500">メモ</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-700">{customer.notes}</p>
              </div>
            ) : null}
          </div>
        </section>

        <section className="lg:col-span-2">
          <div className="mb-4 rounded-xl border border-zinc-200 bg-white p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-800">AIアドバイス（オフライン）</h2>
              <span className="text-xs text-zinc-400">外部送信ゼロ・定型カタログ照合</span>
            </div>
            {advice.length === 0 ? (
              <p className="py-4 text-center text-sm text-zinc-400">
                現在、該当するアドバイスはありません。
              </p>
            ) : (
              <ul className="space-y-3">
                {advice.map((a) => (
                  <li key={a.id} className="rounded-lg border border-zinc-100 p-3">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] text-zinc-500">
                        {a.id}
                      </span>
                      <span className="text-sm font-medium text-zinc-800">{a.title}</span>
                    </div>
                    <p className="mt-1 text-sm text-zinc-600">{a.insight}</p>
                    <p className="mt-1 text-xs text-zinc-500">
                      <span className="font-medium">推奨アクション:</span> {a.recommendedAction}
                    </p>
                    {a.customerMessage ? (
                      <div className="mt-2 rounded bg-zinc-50 p-2">
                        <p className="whitespace-pre-wrap text-xs text-zinc-700">{a.customerMessage}</p>
                        <div className="mt-1">
                          <CopyButton text={a.customerMessage} />
                        </div>
                      </div>
                    ) : (
                      <p className="mt-2 text-xs text-amber-600">
                        連絡同意がないため顧客向け文面は生成されません。
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <h2 className="mb-3 text-sm font-semibold text-zinc-800">施術履歴（来店）</h2>
            <div className="mb-4 rounded-lg bg-zinc-50 p-3">
              <AddVisitForm action={boundAddVisit} staff={staff} today={today} />
            </div>
            {customer.visits.length === 0 ? (
              <p className="py-6 text-center text-sm text-zinc-400">まだ来店記録がありません。</p>
            ) : (
              <ol className="relative space-y-3 border-l border-zinc-200 pl-4">
                {customer.visits.map((v) => (
                  <li key={v.id} className="relative">
                    <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-zinc-400" />
                    <div className="flex items-baseline justify-between">
                      <p className="text-sm font-medium text-zinc-800">{formatDate(v.date)}</p>
                      {v.staff?.name ? (
                        <span className="text-xs text-zinc-400">担当: {v.staff.name}</span>
                      ) : null}
                    </div>
                    {v.menu ? <p className="text-sm text-zinc-600">{v.menu}</p> : null}
                    {v.memo ? <p className="text-xs text-zinc-500">{v.memo}</p> : null}
                  </li>
                ))}
              </ol>
            )}
          </div>
        </section>
      </div>

      <section className="mt-6 rounded-xl border border-zinc-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-zinc-800">会計・購買履歴</h2>
        <div className="mb-4 rounded-lg bg-zinc-50 p-3">
          <SaleForm action={boundCreateSale} staff={staff} today={today} />
        </div>
        {sales.length === 0 ? (
          <p className="py-6 text-center text-sm text-zinc-400">まだ会計記録がありません。</p>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {sales.map((sale) => {
              const tech = sale.items
                .filter((it) => it.itemType === "service")
                .reduce((a, it) => a + it.amount, 0);
              const retail = sale.items
                .filter((it) => it.itemType === "product")
                .reduce((a, it) => a + it.amount, 0);
              const boundDeleteSale = deleteSaleAction.bind(null, id, sale.id);
              return (
                <li key={sale.id} className="py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-zinc-800">{formatDate(sale.date)}</span>
                      <span className="ml-2 text-lg font-bold text-zinc-900">
                        {formatYen(sale.totalAmount)}
                      </span>
                      {sale.paymentMethod ? (
                        <span className="ml-2 text-xs text-zinc-400">
                          {PAY_LABEL[sale.paymentMethod] ?? sale.paymentMethod}
                        </span>
                      ) : null}
                    </div>
                    <form action={boundDeleteSale}>
                      <button type="submit" className="text-xs text-zinc-400 hover:text-red-600">
                        削除
                      </button>
                    </form>
                  </div>
                  <p className="mt-1 text-xs text-zinc-500">
                    技術 {formatYen(tech)} ／ 店販 {formatYen(retail)}
                    {sale.discountAmount > 0 ? ` ／ 値引 ${formatYen(sale.discountAmount)}` : ""}
                  </p>
                  <ul className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-zinc-600">
                    {sale.items.map((it) => (
                      <li key={it.id}>
                        <span className={it.itemType === "product" ? "text-violet-600" : "text-zinc-500"}>
                          [{it.itemType === "product" ? "店販" : "技術"}]
                        </span>{" "}
                        {it.name} ×{it.quantity} {formatYen(it.amount)}
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
