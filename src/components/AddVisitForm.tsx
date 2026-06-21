"use client";

import { useActionState } from "react";
import type { FormState } from "@/app/(app)/customers/actions";

type Staff = { id: string; name: string };

const inputCls =
  "rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500";

export function AddVisitForm({
  action,
  staff,
  today,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  staff: Staff[];
  today: string;
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, {});
  const fe = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1 text-xs text-zinc-600">
        来店日
        <input type="date" name="date" required defaultValue={today} className={inputCls} />
        {fe.date ? <span className="text-red-600">{fe.date}</span> : null}
      </label>
      <label className="flex flex-col gap-1 text-xs text-zinc-600">
        メニュー
        <input name="menu" placeholder="カット・カラー等" className={inputCls} />
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
        メモ
        <input name="memo" className={inputCls} />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-60"
      >
        {pending ? "追加中…" : "来店を記録"}
      </button>
      {state.error ? (
        <p role="alert" className="w-full text-xs text-red-600">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
