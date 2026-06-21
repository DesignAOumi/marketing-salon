import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { listReservations } from "@/lib/reservations";
import { listCustomerOptions, listActiveStaff } from "@/lib/customers";
import { formatDateTime, toDateTimeLocalValue } from "@/lib/format";
import { CreateReservationForm } from "@/components/CreateReservationForm";
import {
  createReservationAction,
  setReservationStatusAction,
  deleteReservationAction,
} from "./actions";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, { l: string; c: string }> = {
  booked: { l: "予約済み", c: "bg-sky-100 text-sky-700" },
  done: { l: "来店済み", c: "bg-emerald-100 text-emerald-700" },
  cancelled: { l: "キャンセル", c: "bg-zinc-200 text-zinc-500" },
  noshow: { l: "無断キャンセル", c: "bg-red-100 text-red-700" },
};

export default async function ReservationsPage() {
  await requireAuth();
  const now = new Date();
  const [reservations, customers, staff] = await Promise.all([
    listReservations(),
    listCustomerOptions(),
    listActiveStaff(),
  ]);

  const upcoming = reservations
    .filter((r) => r.status === "booked" && r.startAt >= now)
    .sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
  const others = reservations.filter((r) => !(r.status === "booked" && r.startAt >= now));

  const defaultStart = toDateTimeLocalValue(new Date(now.getTime() + 60 * 60 * 1000));

  const renderRow = (r: (typeof reservations)[number], canAct: boolean) => {
    const st = STATUS_LABEL[r.status] ?? { l: r.status, c: "bg-zinc-100" };
    const boundDone = setReservationStatusAction.bind(null, r.id, "done");
    const boundCancel = setReservationStatusAction.bind(null, r.id, "cancelled");
    const boundDelete = deleteReservationAction.bind(null, r.id);
    return (
      <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
        <div>
          <span className="text-sm font-medium text-zinc-800">{formatDateTime(r.startAt)}</span>
          <Link href={`/customers/${r.customer.id}`} className="ml-3 text-sm text-zinc-700 hover:underline">
            {r.customer.name}
          </Link>
          {r.staff?.name ? <span className="ml-2 text-xs text-zinc-400">担当 {r.staff.name}</span> : null}
          {r.memo ? <span className="ml-2 text-xs text-zinc-500">{r.memo}</span> : null}
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${st.c}`}>{st.l}</span>
          {canAct ? (
            <>
              <form action={boundDone}>
                <button className="rounded border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-100">
                  来店済み
                </button>
              </form>
              <form action={boundCancel}>
                <button className="rounded border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-100">
                  キャンセル
                </button>
              </form>
            </>
          ) : null}
          <form action={boundDelete}>
            <button className="px-1 text-xs text-zinc-400 hover:text-red-600">削除</button>
          </form>
        </div>
      </li>
    );
  };

  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">予約・来店サイクル</h1>
        <p className="mt-1 text-sm text-zinc-500">今後の予約 {upcoming.length} 件</p>
      </header>

      <section className="mb-6 rounded-xl border border-zinc-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-zinc-800">予約を追加</h2>
        <CreateReservationForm
          action={createReservationAction}
          customers={customers}
          staff={staff}
          defaultStart={defaultStart}
        />
      </section>

      <section className="mb-6 rounded-xl border border-zinc-200 bg-white p-5">
        <h2 className="mb-2 text-sm font-semibold text-zinc-800">今後の予約</h2>
        {upcoming.length === 0 ? (
          <p className="py-6 text-center text-sm text-zinc-400">今後の予約はありません。</p>
        ) : (
          <ul className="divide-y divide-zinc-100">{upcoming.map((r) => renderRow(r, true))}</ul>
        )}
      </section>

      {others.length > 0 ? (
        <section className="rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="mb-2 text-sm font-semibold text-zinc-800">履歴</h2>
          <ul className="divide-y divide-zinc-100">{others.map((r) => renderRow(r, false))}</ul>
        </section>
      ) : null}
    </div>
  );
}
