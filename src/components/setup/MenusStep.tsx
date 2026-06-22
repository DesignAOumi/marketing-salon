"use client";

import { useActionState, useState } from "react";
import {
  addServiceAction,
  updateServiceAction,
  deleteServiceAction,
  advanceMenusAction,
  addCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
  type WizState,
} from "@/app/setup/actions";

type Svc = {
  id: string;
  name: string;
  price: number;
  memberPrice: number | null;
  category: string | null;
  durationMin: number | null;
  defaultCycleDays: number | null;
};
type Cat = { id: string; name: string };

const input = "rounded-md border border-zinc-300 px-2.5 py-1.5 text-sm outline-none focus:border-zinc-500";

// ── 区分1件（インライン編集 + 削除）──────────────────────────
function CategoryRow({ c }: { c: Cat }) {
  const [state, action, pending] = useActionState<WizState, FormData>(updateCategoryAction, {});
  return (
    <li className="flex items-center gap-2 py-1">
      <form action={action} className="flex flex-1 items-center gap-2">
        <input type="hidden" name="id" value={c.id} />
        <input name="name" defaultValue={c.name} className={`${input} flex-1`} />
        <button
          disabled={pending}
          className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-700 disabled:opacity-60"
        >
          {pending ? "…" : "保存"}
        </button>
      </form>
      <form action={deleteCategoryAction}>
        <input type="hidden" name="id" value={c.id} />
        <button className="text-xs text-red-600 hover:underline">削除</button>
      </form>
      {state.error ? <span className="text-xs text-red-600">{state.error}</span> : null}
    </li>
  );
}

// ── メニュー1件（リスト表示・金額が編集ボタン → 展開編集）──────
function MenuRow({ s, categories }: { s: Svc; categories: Cat[] }) {
  const [editing, setEditing] = useState(false);
  const [state, action, pending] = useActionState<WizState, FormData>(updateServiceAction, {});

  const catOptions = categories.map((c) => c.name);
  if (s.category && !catOptions.includes(s.category)) catOptions.unshift(s.category);

  if (!editing) {
    return (
      <li className="flex items-center justify-between gap-3 border-b border-zinc-100 px-1 py-2.5 last:border-0">
        <span className="min-w-0 text-sm text-zinc-800">
          {s.name}
          {s.category ? <span className="ml-1.5 text-xs text-zinc-400">（{s.category}）</span> : null}
        </span>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="shrink-0 rounded border border-blue-200 px-2 py-1 text-xs text-blue-600 hover:bg-blue-50"
        >
          ✎ 編集
        </button>
      </li>
    );
  }

  return (
    <li className="rounded-lg border border-zinc-200 p-3">
      <form action={action} className="grid grid-cols-2 gap-2 sm:grid-cols-2">
        <input type="hidden" name="id" value={s.id} />
        <label className="col-span-2 flex flex-col gap-1 text-[11px] text-zinc-500">
          メニュー名<input name="name" defaultValue={s.name} className={input} />
        </label>
        <label className="col-span-2 flex flex-col gap-1 text-[11px] text-zinc-500">
          区分
          <select name="category" defaultValue={s.category ?? ""} className={input}>
            <option value="">（未選択）</option>
            {catOptions.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-[11px] text-zinc-500">
          価格（税込・円）<input name="price" type="number" min={0} defaultValue={s.price} className={input} />
        </label>
        <label className="flex flex-col gap-1 text-[11px] text-zinc-500">
          会員価格（税込・円）<input name="memberPrice" type="number" min={0} defaultValue={s.memberPrice ?? ""} className={input} />
        </label>
        <label className="flex flex-col gap-1 text-[11px] text-zinc-500">
          所要(分)<input name="durationMin" type="number" min={0} defaultValue={s.durationMin ?? ""} className={input} />
        </label>
        <label className="flex flex-col gap-1 text-[11px] text-zinc-500">
          推奨周期(日)<input name="defaultCycleDays" type="number" min={0} defaultValue={s.defaultCycleDays ?? ""} className={input} />
        </label>
        <div className="col-span-2 flex items-center gap-3 pt-1">
          <button disabled={pending} className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-700 disabled:opacity-60">
            {pending ? "保存中…" : "保存"}
          </button>
          <button type="button" onClick={() => setEditing(false)} className="text-xs text-zinc-500 hover:text-zinc-800">
            閉じる
          </button>
          {state.ok ? <span className="text-xs text-emerald-600">{state.ok}</span> : null}
          {state.error ? <span className="text-xs text-red-600">{state.error}</span> : null}
        </div>
      </form>
      <form action={deleteServiceAction} className="mt-1 text-right">
        <input type="hidden" name="id" value={s.id} />
        <button className="text-xs text-red-600 hover:underline">削除</button>
      </form>
    </li>
  );
}

export function MenusStep({ services, categories }: { services: Svc[]; categories: Cat[] }) {
  const [tab, setTab] = useState<"categories" | "menus">("categories");
  const [addCat, addCatAction, addCatPending] = useActionState<WizState, FormData>(addCategoryAction, {});
  const [addSvc, addSvcAction, addSvcPending] = useActionState<WizState, FormData>(addServiceAction, {});
  const [nextState, nextAction, nextPending] = useActionState<WizState, FormData>(advanceMenusAction, {});

  const tabCls = (active: boolean) =>
    `flex-1 rounded-md px-3 py-2 text-sm font-medium ${active ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"}`;

  return (
    <div className="space-y-4">
      {/* タブ：区分が先 */}
      <div className="flex gap-2">
        <button type="button" onClick={() => setTab("categories")} className={tabCls(tab === "categories")}>
          ① 区分登録（{categories.length}）
        </button>
        <button type="button" onClick={() => setTab("menus")} className={tabCls(tab === "menus")}>
          ② メニュー登録（{services.length}）
        </button>
      </div>

      {tab === "categories" ? (
        <div className="space-y-4">
          <p className="text-sm text-zinc-500">
            メニューの区分を登録します。ここで追加した区分は、すぐにメニュー登録の「区分」で選べます。
          </p>
          <form action={addCatAction} className="flex items-end gap-2 rounded-lg border border-zinc-200 p-4">
            <label className="flex flex-1 flex-col gap-1 text-xs text-zinc-600">
              区分名 *<input name="name" required placeholder="例: 施術 / 物販 / 会費" className={input} />
            </label>
            <button disabled={addCatPending} className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-60">
              {addCatPending ? "追加中…" : "追加"}
            </button>
          </form>
          {addCat.error ? <p className="text-xs text-red-600">{addCat.error}</p> : null}

          <div className="rounded-lg border border-zinc-200 p-3">
            <p className="mb-1 text-xs font-medium text-zinc-500">登録済み区分（{categories.length}件）</p>
            {categories.length === 0 ? (
              <p className="text-sm text-zinc-400">まだありません。</p>
            ) : (
              <ul className="max-h-[20rem] divide-y divide-zinc-100 overflow-y-auto overscroll-contain pr-1">
                {categories.map((c) => <CategoryRow key={c.id} c={c} />)}
              </ul>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-zinc-500">提供するメニューを登録します（1つ以上必要）。金額は税込で入力してください。</p>
          <form action={addSvcAction} className="grid grid-cols-2 gap-3 rounded-lg border border-zinc-200 p-4">
            <label className="col-span-2 flex flex-col gap-1 text-xs text-zinc-600">
              メニュー名 *<input name="name" required className={input} />
            </label>
            <label className="col-span-2 flex flex-col gap-1 text-xs text-zinc-600">
              区分
              <select name="category" defaultValue="" className={input}>
                <option value="">（未選択）</option>
                {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs text-zinc-600">
              価格（税込・円）*<input name="price" type="number" min={0} required defaultValue={5000} className={input} />
            </label>
            <label className="flex flex-col gap-1 text-xs text-zinc-600">
              会員価格（税込・円）<input name="memberPrice" type="number" min={0} className={input} />
            </label>
            <label className="flex flex-col gap-1 text-xs text-zinc-600">
              所要(分)<input name="durationMin" type="number" min={0} className={input} />
            </label>
            <label className="flex flex-col gap-1 text-xs text-zinc-600">
              推奨周期(日)<input name="defaultCycleDays" type="number" min={0} className={input} />
            </label>
            <button disabled={addSvcPending} className="col-span-2 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-60">
              {addSvcPending ? "追加中…" : "追加"}
            </button>
            {addSvc.error ? <p className="col-span-2 text-xs text-red-600">{addSvc.error}</p> : null}
          </form>

          <div className="rounded-lg border border-zinc-200 p-3">
            <p className="mb-1 text-xs font-medium text-zinc-500">登録済みメニュー（{services.length}件）</p>
            {services.length === 0 ? (
              <p className="text-sm text-zinc-400">まだありません。</p>
            ) : (
              <ul className="max-h-[20rem] overflow-y-auto overscroll-contain pr-1">
                {services.map((s) => <MenuRow key={s.id} s={s} categories={categories} />)}
              </ul>
            )}
          </div>
        </div>
      )}

      <form action={nextAction}>
        <button
          disabled={nextPending || services.length < 1}
          className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
        >
          次へ（確認画面）
        </button>
        {nextState.error ? <p role="alert" className="mt-2 text-sm text-red-600">{nextState.error}</p> : null}
      </form>
    </div>
  );
}
