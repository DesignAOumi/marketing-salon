"use client";

import { useActionState, useEffect, useState } from "react";
import type { VisitState } from "@/app/(app)/reservations/actions";

type Item = { itemType: "service" | "product"; name: string; price: number };

const inputCls = "rounded-md border border-zinc-300 px-2 py-1 text-sm outline-none focus:border-zinc-500";
const yen = (n: number) => "¥" + n.toLocaleString("ja-JP");

export function VisitedButton({
  action,
  customerName,
  prefill,
  menuOptions,
  defaultDate,
}: {
  action: (prev: VisitState, formData: FormData) => Promise<VisitState>;
  customerName: string;
  prefill: Item[];
  menuOptions: Item[];
  defaultDate: string;
}) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [discount, setDiscount] = useState(0);
  const [state, formAction, pending] = useActionState<VisitState, FormData>(action, {});

  function openModal() {
    setItems(prefill.map((p) => ({ ...p })));
    setDiscount(0);
    setOpen(true);
  }

  useEffect(() => {
    if (state.ok) setOpen(false);
  }, [state.ok]);

  const subtotal = items.reduce((a, i) => a + Math.max(0, i.price), 0);
  const total = Math.max(0, subtotal - (discount || 0));
  const payloadItems = items.map((i) => ({ itemType: i.itemType, name: i.name, unitPrice: i.price, quantity: 1 }));

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="rounded border border-emerald-300 bg-emerald-50 px-2 py-1 text-xs text-emerald-700 hover:bg-emerald-100"
      >
        来店済み
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} aria-hidden />
          <div className="relative z-10 max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-1 flex items-center justify-between">
              <h3 className="text-base font-bold text-zinc-900">来店内容の確認</h3>
              <button type="button" onClick={() => setOpen(false)} className="text-zinc-400 hover:text-zinc-700">✕</button>
            </div>
            <p className="mb-3 text-xs text-zinc-500">{customerName} の会計として売上に登録します。メニュー・金額を確認してください。</p>

            {/* メニュー（表示のみ・削除可） */}
            <div className="divide-y divide-zinc-100">
              {items.length === 0 ? (
                <p className="py-2 text-sm text-zinc-400">メニューがありません。下から追加してください。</p>
              ) : (
                items.map((it, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-3 py-2">
                    <span className="text-sm text-zinc-800">{it.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-zinc-700">{yen(it.price)}</span>
                      <button
                        type="button"
                        onClick={() => setItems((prev) => prev.filter((_, i) => i !== idx))}
                        className="text-xs text-red-500 hover:text-red-700"
                        aria-label="削除"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* ＋ メニューを追加（登録メニューから選択） */}
            <div className="mt-2">
              <select
                value=""
                onChange={(e) => {
                  const opt = menuOptions[Number(e.target.value)];
                  if (opt) setItems((prev) => [...prev, { ...opt }]);
                }}
                className={`${inputCls} text-blue-600`}
                disabled={menuOptions.length === 0}
              >
                <option value="">＋ メニューを追加</option>
                {menuOptions.map((m, i) => (
                  <option key={i} value={i}>{m.name}（{yen(m.price)}）</option>
                ))}
              </select>
            </div>

            {/* 割引金額（赤ラベル） */}
            <div className="mt-3 flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm">
                <span className="font-medium text-red-600">割引金額</span>
                <input
                  type="number"
                  min={0}
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                  className={`${inputCls} w-28 text-right`}
                />
                <span className="text-xs text-zinc-400">円</span>
              </label>
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-zinc-100 pt-3 text-sm">
              <span className="text-zinc-500">合計（税込）</span>
              <span className="text-lg font-bold text-zinc-900">{yen(total)}</span>
            </div>

            <form action={formAction} className="mt-3 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1 text-xs text-zinc-600">
                  会計日<input type="date" name="date" required defaultValue={defaultDate} className={inputCls} />
                </label>
                <label className="flex flex-col gap-1 text-xs text-zinc-600">
                  支払方法
                  <select name="paymentMethod" defaultValue="cash" className={inputCls}>
                    <option value="cash">現金</option>
                    <option value="card">カード</option>
                    <option value="emoney">電子マネー</option>
                    <option value="other">その他</option>
                  </select>
                </label>
              </div>
              <input type="hidden" name="items" value={JSON.stringify(payloadItems)} />
              <input type="hidden" name="discountAmount" value={String(discount || 0)} />
              {state.error ? <p className="text-xs text-red-600">{state.error}</p> : null}
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={pending || items.length === 0}
                  className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
                >
                  {pending ? "登録中…" : "確定して売上に登録"}
                </button>
                <button type="button" onClick={() => setOpen(false)} className="text-sm text-zinc-500 hover:text-zinc-800">
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
