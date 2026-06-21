"use client";

import { useActionState } from "react";
import type { ResFormState } from "@/app/(app)/reservations/actions";

type Option = { id: string; name: string };

const inputCls =
  "rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500";

export function CreateReservationForm({
  action,
  customers,
  staff,
  defaultStart,
  defaultCustomerId,
}: {
  action: (prev: ResFormState, formData: FormData) => Promise<ResFormState>;
  customers: Option[];
  staff: Option[];
  defaultStart: string;
  defaultCustomerId?: string;
}) {
  const [state, formAction, pending] = useActionState<ResFormState, FormData>(action, {});
  const fe = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1 text-xs text-zinc-600">
        顧客
        <select name="customerId" defaultValue={defaultCustomerId ?? ""} required className={inputCls}>
          <option value="">選択してください</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {fe.customerId ? <span className="text-red-600">{fe.customerId}</span> : null}
      </label>
      <label className="flex flex-col gap-1 text-xs text-zinc-600">
        日時
        <input type="datetime-local" name="startAt" required defaultValue={defaultStart} className={inputCls} />
        {fe.startAt ? <span className="text-red-600">{fe.startAt}</span> : null}
      </label>
      <label className="flex flex-col gap-1 text-xs text-zinc-600">
        担当
        <select name="staffId" defaultValue="" className={inputCls}>
          <option value="">未設定</option>
          {staff.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-1 flex-col gap-1 text-xs text-zinc-600">
        メニュー・メモ
        <input name="memo" placeholder="カット等" className={inputCls} />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-60"
      >
        {pending ? "登録中…" : "予約を追加"}
      </button>
      {state.error ? (
        <p role="alert" className="w-full text-xs text-red-600">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
