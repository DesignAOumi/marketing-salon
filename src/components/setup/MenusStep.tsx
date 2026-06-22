"use client";

import { useActionState } from "react";
import {
  addServiceAction,
  addDefaultServicesAction,
  advanceMenusAction,
  type WizState,
} from "@/app/setup/actions";

type Svc = { id: string; name: string; price: number; category: string | null };
const input = "rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500";

export function MenusStep({ services }: { services: Svc[] }) {
  const [addState, addAction, addPending] = useActionState<WizState, FormData>(addServiceAction, {});
  const [nextState, nextAction, nextPending] = useActionState<WizState, FormData>(advanceMenusAction, {});

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-500">提供する施術メニューを登録します（1つ以上必要）。</p>

      <form action={addDefaultServicesAction}>
        <button className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100">
          標準メニューを一括追加（カット・カラー・パーマ 等）
        </button>
      </form>

      <form action={addAction} className="grid grid-cols-2 items-end gap-3 rounded-lg border border-zinc-200 p-4 sm:grid-cols-4">
        <label className="col-span-2 flex flex-col gap-1 text-xs text-zinc-600 sm:col-span-1">
          メニュー名 *<input name="name" required className={input} />
        </label>
        <label className="flex flex-col gap-1 text-xs text-zinc-600">
          価格(円) *<input name="price" type="number" min={0} required defaultValue={5000} className={input} />
        </label>
        <label className="flex flex-col gap-1 text-xs text-zinc-600">
          所要(分)<input name="durationMin" type="number" min={0} className={input} />
        </label>
        <label className="flex flex-col gap-1 text-xs text-zinc-600">
          推奨周期(日)<input name="defaultCycleDays" type="number" min={0} className={input} />
        </label>
        <button
          disabled={addPending}
          className="col-span-2 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-60 sm:col-span-1"
        >
          {addPending ? "追加中…" : "追加"}
        </button>
        {addState.error ? <p className="col-span-full text-xs text-red-600">{addState.error}</p> : null}
      </form>

      <div className="rounded-lg border border-zinc-200 p-3">
        <p className="mb-2 text-xs font-medium text-zinc-500">登録済みメニュー（{services.length}件）</p>
        {services.length === 0 ? (
          <p className="text-sm text-zinc-400">まだ登録がありません。</p>
        ) : (
          <ul className="divide-y divide-zinc-100 text-sm">
            {services.map((s) => (
              <li key={s.id} className="flex justify-between py-1.5">
                <span className="text-zinc-700">{s.name}{s.category ? `（${s.category}）` : ""}</span>
                <span className="text-zinc-500">¥{s.price.toLocaleString("ja-JP")}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <form action={nextAction}>
        <button
          disabled={nextPending || services.length < 1}
          className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
        >
          次へ
        </button>
        {nextState.error ? <p role="alert" className="mt-2 text-sm text-red-600">{nextState.error}</p> : null}
      </form>
    </div>
  );
}
