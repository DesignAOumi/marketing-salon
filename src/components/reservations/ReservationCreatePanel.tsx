"use client";

import { useActionState, useEffect, useState } from "react";
import type { ResFormState, QuickCustomerState } from "@/app/(app)/reservations/actions";

type Option = { id: string; name: string };
type Svc = { id: string; name: string; price: number; category: string | null };

const inputCls = "rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500";

export function ReservationCreatePanel({
  customers,
  staff,
  services,
  defaultStart,
  defaultStaffId,
  createAction,
  quickCreateAction,
}: {
  customers: Option[];
  staff: Option[];
  services: Svc[];
  defaultStart: string;
  defaultStaffId: string;
  createAction: (prev: ResFormState, formData: FormData) => Promise<ResFormState>;
  quickCreateAction: (prev: QuickCustomerState, formData: FormData) => Promise<QuickCustomerState>;
}) {
  const [list, setList] = useState<Option[]>(customers);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Option | null>(null);
  const [open, setOpen] = useState(false);
  const [menuIds, setMenuIds] = useState<string[]>([]);
  const [showNew, setShowNew] = useState(false);

  const [state, formAction, pending] = useActionState<ResFormState, FormData>(createAction, {});
  const [newState, newFormAction, newPending] = useActionState<QuickCustomerState, FormData>(quickCreateAction, {});

  // 新規顧客が作成されたら、リストへ追加・選択してモーダルを閉じる。
  useEffect(() => {
    const c = newState.created;
    if (c) {
      setList((prev) => (prev.some((x) => x.id === c.id) ? prev : [c, ...prev]));
      setSelected(c);
      setQuery(c.name);
      setOpen(false);
      setShowNew(false);
    }
  }, [newState.created]);

  const q = query.trim();
  const filtered = q ? list.filter((c) => c.name.includes(q)) : list;
  const selectedMenus = services
    .filter((s) => menuIds.includes(s.id))
    .map((s) => ({ serviceId: s.id, name: s.name, price: s.price }));
  const showNewBtn = !selected && (q === "" || filtered.length === 0);

  const fe = state.fieldErrors ?? {};

  return (
    <>
      <form action={formAction} className="space-y-3">
        {/* 顧客（オートコンプリート） */}
        <div className="relative">
          <label className="text-xs text-zinc-600">顧客 *</label>
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelected(null);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder="顧客名を入力（1文字から候補表示）"
            className={`${inputCls} w-full ${selected ? "border-emerald-400" : ""}`}
            autoComplete="off"
          />
          <input type="hidden" name="customerId" value={selected?.id ?? ""} />
          {open ? (
            <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-zinc-200 bg-white shadow-lg">
              <ul className="max-h-48 overflow-y-auto">
                {filtered.slice(0, 100).map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelected(c);
                        setQuery(c.name);
                        setOpen(false);
                      }}
                      className="block w-full px-3 py-2 text-left text-sm hover:bg-zinc-100"
                    >
                      {c.name}
                    </button>
                  </li>
                ))}
                {filtered.length === 0 ? (
                  <li className="px-3 py-2 text-sm text-zinc-400">該当する顧客がいません</li>
                ) : null}
              </ul>
              {showNewBtn ? (
                <button
                  type="button"
                  onClick={() => {
                    setShowNew(true);
                    setOpen(false);
                  }}
                  className="block w-full border-t border-zinc-100 px-3 py-2 text-left text-sm font-medium text-blue-600 hover:bg-blue-50"
                >
                  ＋ 新規顧客を登録
                </button>
              ) : null}
            </div>
          ) : null}
          {fe.customerId ? <p className="mt-1 text-xs text-red-600">{fe.customerId}</p> : null}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-xs text-zinc-600">
            日時 *
            <input type="datetime-local" name="startAt" required defaultValue={defaultStart} className={inputCls} />
            {fe.startAt ? <span className="text-red-600">{fe.startAt}</span> : null}
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-600">
            担当
            <select name="staffId" defaultValue={defaultStaffId} className={inputCls}>
              <option value="">未設定</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </label>
        </div>

        {/* メニュー（複数選択） */}
        <div>
          <p className="mb-1 text-xs text-zinc-600">メニュー（複数選択可）</p>
          {services.length === 0 ? (
            <p className="text-xs text-zinc-400">メニュー未登録です。「メニュー管理」から登録してください。</p>
          ) : (
            <div className="flex max-h-32 flex-wrap gap-2 overflow-y-auto rounded-md border border-zinc-200 p-2">
              {services.map((s) => {
                const on = menuIds.includes(s.id);
                return (
                  <button
                    type="button"
                    key={s.id}
                    onClick={() => setMenuIds((prev) => (on ? prev.filter((x) => x !== s.id) : [...prev, s.id]))}
                    className={`rounded-full border px-3 py-1 text-xs ${
                      on ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-300 text-zinc-600 hover:bg-zinc-100"
                    }`}
                  >
                    {on ? "✓ " : ""}{s.name}
                  </button>
                );
              })}
            </div>
          )}
          <input type="hidden" name="menusJson" value={JSON.stringify(selectedMenus)} />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={pending || !selected}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
          >
            {pending ? "登録中…" : "予約を追加"}
          </button>
          {!selected ? <span className="text-xs text-zinc-400">顧客を選択してください</span> : null}
        </div>
        {state.error ? <p role="alert" className="text-xs text-red-600">{state.error}</p> : null}
      </form>

      {/* 新規顧客 登録ポップアップ */}
      {showNew ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowNew(false)} aria-hidden />
          <div className="relative z-10 w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-bold text-zinc-900">新規顧客の登録</h3>
              <button type="button" onClick={() => setShowNew(false)} className="text-zinc-400 hover:text-zinc-700">✕</button>
            </div>
            <form action={newFormAction} className="space-y-3">
              <label className="flex flex-col gap-1 text-xs text-zinc-600">
                氏名 *<input name="name" required defaultValue={q} className={inputCls} />
              </label>
              <label className="flex flex-col gap-1 text-xs text-zinc-600">
                フリガナ<input name="nameKana" className={inputCls} />
              </label>
              <label className="flex flex-col gap-1 text-xs text-zinc-600">
                電話<input name="phone" className={inputCls} />
              </label>
              {newState.error ? <p className="text-xs text-red-600">{newState.error}</p> : null}
              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  disabled={newPending}
                  className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-60"
                >
                  {newPending ? "登録中…" : "登録して選択"}
                </button>
                <button type="button" onClick={() => setShowNew(false)} className="text-sm text-zinc-500 hover:text-zinc-800">
                  キャンセル
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
