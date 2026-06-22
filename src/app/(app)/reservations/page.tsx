import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { listReservations } from "@/lib/reservations";
import { listCustomerOptions, listActiveStaff } from "@/lib/customers";
import { listServices } from "@/lib/services";
import { formatDateTime, toDateTimeLocalValue } from "@/lib/format";
import { ReservationCreatePanel } from "@/components/reservations/ReservationCreatePanel";
import { VisitedButton } from "@/components/reservations/VisitedButton";
import { GoogleCalendarButton } from "@/components/GoogleCalendarButton";
import {
  createReservationAction,
  setReservationStatusAction,
  deleteReservationAction,
  markVisitedAction,
  quickCreateCustomerAction,
} from "./actions";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, { l: string; c: string }> = {
  booked: { l: "予約済み", c: "bg-sky-100 text-sky-700" },
  done: { l: "来店済み", c: "bg-emerald-100 text-emerald-700" },
  cancelled: { l: "取り消し", c: "bg-zinc-200 text-zinc-500" },
  noshow: { l: "無断キャンセル", c: "bg-red-100 text-red-700" },
};

type Item = { itemType: "service" | "product"; name: string; price: number };
const isRetail = (cat?: string | null) => !!cat && cat.includes("物販");

function parseMenus(json: string | null): { name: string; price: number }[] {
  if (!json) return [];
  try {
    const a = JSON.parse(json);
    return Array.isArray(a) ? a.filter((m) => m && typeof m.name === "string") : [];
  } catch {
    return [];
  }
}

export default async function ReservationsPage() {
  await requireAuth();
  const now = new Date();
  const [reservations, customers, staff, services] = await Promise.all([
    listReservations(),
    listCustomerOptions(),
    listActiveStaff(),
    listServices(),
  ]);

  const upcoming = reservations
    .filter((r) => r.status === "booked" && r.startAt >= now)
    .sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
  const others = reservations.filter((r) => !(r.status === "booked" && r.startAt >= now));

  const defaultStart = toDateTimeLocalValue(new Date(now.getTime() + 60 * 60 * 1000));
  const defaultStaffId = staff.length ? staff[0].id : "";
  // 来店確認モーダルで「メニューを追加」する候補（区分が物販なら店販扱い）。
  const menuOptions: Item[] = services.map((s) => ({
    itemType: isRetail(s.category) ? "product" : "service",
    name: s.name,
    price: s.price,
  }));
  const svcByName = (nm: string) => services.find((s) => s.name === nm);

  const renderRow = (r: (typeof reservations)[number], canAct: boolean) => {
    const st = STATUS_LABEL[r.status] ?? { l: r.status, c: "bg-zinc-100" };
    const menus = parseMenus(r.menusJson);
    const menuLabel = menus.length ? menus.map((m) => m.name).join("・") : r.memo;
    // モーダルのプリフィル：menusJson 優先。旧予約は memo/serviceId から価格・区分を補完。
    let prefill: Item[] = menus.map((m) => ({
      itemType: isRetail(svcByName(m.name)?.category) ? "product" : "service",
      name: m.name,
      price: m.price,
    }));
    if (prefill.length === 0) {
      const names = (r.memo ?? "").split("・").map((s) => s.trim()).filter(Boolean);
      prefill = names.map((nm) => {
        const svc = svcByName(nm);
        return { itemType: isRetail(svc?.category) ? "product" : "service", name: nm, price: svc?.price ?? 0 };
      });
      if (prefill.length === 0 && r.serviceId) {
        const svc = services.find((s) => s.id === r.serviceId);
        if (svc) prefill = [{ itemType: isRetail(svc.category) ? "product" : "service", name: svc.name, price: svc.price }];
      }
    }
    const resDate = toDateTimeLocalValue(r.startAt).slice(0, 10);
    const boundCancel = setReservationStatusAction.bind(null, r.id, "cancelled");
    const boundDelete = deleteReservationAction.bind(null, r.id);
    return (
      <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
        <div className="min-w-0">
          <span className="text-sm font-medium text-zinc-800">{formatDateTime(r.startAt)}</span>
          <Link href={`/customers/${r.customer.id}`} className="ml-3 text-sm text-zinc-700 hover:underline">
            {r.customer.name}
          </Link>
          {menuLabel ? <span className="ml-2 text-xs text-zinc-500">{menuLabel}</span> : null}
          {r.staff?.name ? <span className="ml-2 text-xs text-zinc-400">担当 {r.staff.name}</span> : null}
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${st.c}`}>{st.l}</span>
          {canAct ? (
            <>
              <VisitedButton
                action={markVisitedAction.bind(null, r.id)}
                customerName={r.customer.name}
                prefill={prefill}
                menuOptions={menuOptions}
                defaultDate={resDate}
              />
              <form action={boundCancel}>
                <button className="rounded border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-100">予約取り消し</button>
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
      <header className="mb-6 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">予約・来店サイクル</h1>
          <p className="mt-1 text-sm text-zinc-500">今後の予約 {upcoming.length} 件</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <GoogleCalendarButton connected={false} />
          <a
            href="/api/export/ics"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100"
          >
            ICS出力
          </a>
          <a
            href="/api/export/ics?pii=off"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100"
            title="顧客名を含めずに出力（共有カレンダー向け）"
          >
            ICS出力（匿名）
          </a>
        </div>
      </header>

      <section className="mb-6 rounded-xl border border-zinc-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-zinc-800">予約を追加</h2>
        <ReservationCreatePanel
          customers={customers}
          staff={staff}
          services={services.map((s) => ({ id: s.id, name: s.name, price: s.price, category: s.category }))}
          defaultStart={defaultStart}
          defaultStaffId={defaultStaffId}
          createAction={createReservationAction}
          quickCreateAction={quickCreateCustomerAction}
        />
      </section>

      <section className="mb-6 rounded-xl border border-zinc-200 bg-white p-5">
        <h2 className="mb-2 text-sm font-semibold text-zinc-800">今後の予約</h2>
        {upcoming.length === 0 ? (
          <p className="py-6 text-center text-sm text-zinc-400">今後の予約はありません。</p>
        ) : (
          <div className="max-h-80 overflow-y-auto pr-1">
            <ul className="divide-y divide-zinc-100">{upcoming.map((r) => renderRow(r, true))}</ul>
          </div>
        )}
      </section>

      {others.length > 0 ? (
        <section className="rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="mb-2 text-sm font-semibold text-zinc-800">履歴</h2>
          <div className="max-h-80 overflow-y-auto pr-1">
            <ul className="divide-y divide-zinc-100">{others.map((r) => renderRow(r, false))}</ul>
          </div>
        </section>
      ) : null}
    </div>
  );
}
