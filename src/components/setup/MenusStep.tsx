"use client";

import { useActionState } from "react";
import {
  addServiceAction,
  updateServiceAction,
  deleteServiceAction,
  advanceMenusAction,
  type WizState,
} from "@/app/setup/actions";

type Svc = {
  id: string;
  name: string;
  price: number;
  category: string | null;
  durationMin: number | null;
  defaultCycleDays: number | null;
};
const input = "rounded-md border border-zinc-300 px-2.5 py-1.5 text-sm outline-none focus:border-zinc-500";

// 登録済みメニュー1件 = インライン編集フォーム（保存）＋ 削除。
function MenuRow({ s }: { s: Svc }) {
  const [state, action, pending] = useActionState<WizState, FormData>(updateServiceAction, {});
  return (
    <li className="rounded-lg border border-zinc-200 p-3">
      <form action={action} className="grid grid-cols-2 items-end gap-2 sm:grid-cols-6">
        <input type="hidden" name="id" value={s.id} />
        <label className="col-span-2 flex flex-col gap-1 text-[11px] text-zinc-500 sm:col-span-2">
          メニュー名<input name="name" defaultValue={s.name} className={input} />
        </label>
        <label className="flex flex-col gap-1 text-[11px] text-zinc-500">
          価格(円)<input name="price" type="number" min={0} defaultValue={s.price} className={input} />
        </label>
        <label className="flex flex-col gap-1 text-[11px] text-zinc-500">
          区分<input name="category" defaultValue={s.category ?? ""} className={input} />
        </label>
        <label className="flex flex-col gap-1 text-[11px] text-zinc-500">
          所要(分)<input name="durationMin" type="number" min={0} defaultValue={s.durationMin ?? ""} className={input} />
        </label>
        <label className="flex flex-col gap-1 text-[11px] text-zinc-500">
          周期(日)<input name="defaultCycleDays" type="number" min={0} defaultValue={s.defaultCycleDays ?? ""} className={input} />
        </label>
        <div className="col-span-2 sm:col-span-6">
          <button
            disabled={pending}
            className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-700 disabled:opacity-60"
          >
            {pending ? "保存中…" : "保存"}
          </button>
        </div>
      </form>
      <div className="mt-1.5 flex items-center justify-between">
        <span className="text-xs">
          {state.error ? <span className="text-red-600">{state.error}</span> : null}
          {state.ok ? <span className="text-emerald-600">{state.ok}</span> : null}
        </span>
        <form action={deleteServiceAction}>
          <input type="hidden" name="id" value={s.id} />
          <button className="text-xs text-red-600 hover:underline">削除</button>
        </form>
      </div>
    </li>
  );
}

export function MenusStep({ services }: { services: Svc[] }) {
  const [addState, addAction, addPending] = useActionState<WizState, FormData>(addServiceAction, {});
  const [nextState, nextAction, nextPending] = useActionState<WizState, FormData>(advanceMenusAction, {});

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-500">提供する施術メニューを登録します（1つ以上必要）。登録後も編集・削除できます。</p>

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

      <div>
        <p className="mb-2 text-xs font-medium text-zinc-500">登録済みメニュー（{services.length}件）— 編集して保存できます</p>
        {services.length === 0 ? (
          <p className="rounded-lg border border-zinc-200 p-3 text-sm text-zinc-400">まだ登録がありません。</p>
        ) : (
          <ul className="space-y-2">
            {services.map((s) => (
              <MenuRow key={s.id} s={s} />
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
