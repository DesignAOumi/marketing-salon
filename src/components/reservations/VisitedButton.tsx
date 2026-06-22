"use client";

import { useActionState, useEffect, useState } from "react";
import type { VisitState } from "@/app/(app)/reservations/actions";

type Item = { itemType: "service" | "product"; name: string; unitPrice: number; quantity: number };
type Prefill = { name: string; price: number };

const inputCls = "rounded-md border border-zinc-300 px-2 py-1 text-sm outline-none focus:border-zinc-500";
const yen = (n: number) => "¥" + n.toLocaleString("ja-JP");

export function VisitedButton({
  action,
  customerName,
  prefill,
  today,
}: {
  action: (prev: VisitState, formData: FormData) => Promise<VisitState>;
  customerName: string;
  prefill: Prefill[];
  today: string;
}) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [state, formAction, pending] = useActionState<VisitState, FormData>(action, {});

  function openModal() {
    const init: Item[] = prefill.length
      ? prefill.map((p) => ({ itemType: "service", name: p.name, unitPrice: p.price, quantity: 1 }))
      : [{ itemType: "service", name: "", unitPrice: 0, quantity: 1 }];
    setItems(init);
    setOpen(true);
  }

  useEffect(() => {
    if (state.ok) setOpen(false);
  }, [state.ok]);

  const upd = (idx: number, patch: Partial<Item>) =>
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  const total = items.reduce((a, i) => a + Math.max(0, i.unitPrice * i.quantity), 0);
  const validItems = items.filter((i) => i.name.trim());

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

            <div className="space-y-2">
              {items.map((it, idx) => (
                <div key={idx} className="grid grid-cols-12 items-center gap-2">
                  <select
                    value={it.itemType}
                    onChange={(e) => upd(idx, { itemType: e.target.value as Item["itemType"] })}
                    className={`${inputCls} col-span-3`}
                  >
                    <option value="service">技術</option>
                    <option value="product">店販</option>
                  </select>
                  <input
                    value={it.name}
                    onChange={(e) => upd(idx, { name: e.target.value })}
                    placeholder="品目名"
                    className={`${inputCls} col-span-4`}
                  />
                  <input
                    type="number"
                    min={0}
                    value={it.unitPrice}
                    onChange={(e) => upd(idx, { unitPrice: Number(e.target.value) || 0 })}
                    className={`${inputCls} col-span-2`}
                  />
                  <input
                    type="number"
                    min={1}
                    value={it.quantity}
                    onChange={(e) => upd(idx, { quantity: Number(e.target.value) || 1 })}
                    className={`${inputCls} col-span-2`}
                  />
                  <button
                    type="button"
                    onClick={() => setItems((prev) => prev.filter((_, i) => i !== idx))}
                    className="col-span-1 text-xs text-red-500 hover:text-red-700"
                    aria-label="明細を削除"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setItems((prev) => [...prev, { itemType: "service", name: "", unitPrice: 0, quantity: 1 }])}
                className="text-xs text-blue-600 hover:underline"
              >
                ＋ 明細を追加
              </button>
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-zinc-100 pt-3 text-sm">
              <span className="text-zinc-500">合計（税込）</span>
              <span className="text-lg font-bold text-zinc-900">{yen(total)}</span>
            </div>

            <form action={formAction} className="mt-3 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1 text-xs text-zinc-600">
                  会計日<input type="date" name="date" required defaultValue={today} className={inputCls} />
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
              <input type="hidden" name="items" value={JSON.stringify(validItems)} />
              {state.error ? <p className="text-xs text-red-600">{state.error}</p> : null}
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={pending || validItems.length === 0}
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
