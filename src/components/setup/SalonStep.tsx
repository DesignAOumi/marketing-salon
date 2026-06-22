"use client";

import { useActionState } from "react";
import { saveSalonAction, type WizState } from "@/app/setup/actions";

const input = "rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500";

export function SalonStep({ defaultName }: { defaultName?: string }) {
  const [state, action, pending] = useActionState<WizState, FormData>(saveSalonAction, {});
  return (
    <form action={action} className="space-y-4">
      <p className="text-sm text-zinc-500">サロンの基本情報を登録します。</p>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-zinc-700">サロン名 *</span>
        <input name="salonName" required defaultValue={defaultName === "My Salon" ? "" : defaultName} className={input} />
      </label>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-zinc-700">電話</span>
          <input name="salonPhone" className={input} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-zinc-700">メール</span>
          <input name="salonEmail" type="email" className={input} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-zinc-700">タイムゾーン</span>
          <input name="timezone" defaultValue="Asia/Tokyo" className={input} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-zinc-700">通貨</span>
          <input name="currency" defaultValue="JPY" className={input} />
        </label>
      </div>
      {state.error ? <p role="alert" className="text-sm text-red-600">{state.error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-60"
      >
        {pending ? "保存中…" : "保存して次へ"}
      </button>
    </form>
  );
}
