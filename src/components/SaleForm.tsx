"use client";

import { useActionState, useState } from "react";
import type { FormState } from "@/app/(app)/customers/actions";

type Staff = { id: string; name: string };
type Row = {
  itemType: "service" | "product";
  name: string;
  unitPrice: string;
  quantity: string;
  lineDiscount: string;
};

const inputCls =
  "rounded-md border border-zinc-300 px-2 py-1.5 text-sm outline-none focus:border-zinc-500";
const num = (s: string) => {
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
};
const yen = (n: number) => `¥${n.toLocaleString("ja-JP")}`;

const emptyRow: Row = { itemType: "service", name: "", unitPrice: "", quantity: "1", lineDiscount: "" };

export function SaleForm({
  action,
  staff,
  today,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  staff: Staff[];
  today: string;
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, {});
  const [rows, setRows] = useState<Row[]>([{ ...emptyRow }]);
  const [discount, setDiscount] = useState("0");

  const update = (i: number, patch: Partial<Row>) =>
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  const addRow = () => setRows((r) => [...r, { ...emptyRow }]);
  const removeRow = (i: number) => setRows((r) => (r.length > 1 ? r.filter((_, idx) => idx !== i) : r));

  const amount = (r: Row) => Math.max(0, num(r.unitPrice) * num(r.quantity) - num(r.lineDiscount));
  const serviceTotal = rows.filter((r) => r.itemType === "service").reduce((a, r) => a + amount(r), 0);
  const retailTotal = rows.filter((r) => r.itemType === "product").reduce((a, r) => a + amount(r), 0);
  const itemsTotal = serviceTotal + retailTotal;
  const total = Math.max(0, itemsTotal - num(discount));

  // サーバーへ渡す明細（金額はサーバーで再計算するため数量・単価のみ送る）。
  const itemsJson = JSON.stringify(
    rows.map((r) => ({
      itemType: r.itemType,
      name: r.name,
      unitPrice: num(r.unitPrice),
      quantity: num(r.quantity),
      lineDiscount: num(r.lineDiscount),
    })),
  );

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="items" value={itemsJson} />

      <div className="flex flex-wrap gap-3">
        <label className="flex flex-col gap-1 text-xs text-zinc-600">
          会計日
          <input type="date" name="date" required defaultValue={today} className={inputCls} />
        </label>
        <label className="flex flex-col gap-1 text-xs text-zinc-600">
          支払方法
          <select name="paymentMethod" defaultValue="" className={inputCls}>
            <option value="">未選択</option>
            <option value="cash">現金</option>
            <option value="card">カード</option>
            <option value="emoney">電子マネー</option>
            <option value="other">その他</option>
          </select>
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
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-zinc-500">
              <th className="py-1 pr-2 font-medium">区分</th>
              <th className="py-1 pr-2 font-medium">品目</th>
              <th className="py-1 pr-2 font-medium">単価</th>
              <th className="py-1 pr-2 font-medium">数量</th>
              <th className="py-1 pr-2 font-medium">明細値引</th>
              <th className="py-1 pr-2 text-right font-medium">小計</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td className="py-1 pr-2">
                  <select
                    value={r.itemType}
                    onChange={(e) => update(i, { itemType: e.target.value as Row["itemType"] })}
                    className={inputCls}
                  >
                    <option value="service">技術</option>
                    <option value="product">店販</option>
                  </select>
                </td>
                <td className="py-1 pr-2">
                  <input
                    value={r.name}
                    onChange={(e) => update(i, { name: e.target.value })}
                    placeholder="カット 等"
                    className={`${inputCls} w-36`}
                  />
                </td>
                <td className="py-1 pr-2">
                  <input
                    type="number"
                    min={0}
                    value={r.unitPrice}
                    onChange={(e) => update(i, { unitPrice: e.target.value })}
                    className={`${inputCls} w-24`}
                  />
                </td>
                <td className="py-1 pr-2">
                  <input
                    type="number"
                    min={1}
                    value={r.quantity}
                    onChange={(e) => update(i, { quantity: e.target.value })}
                    className={`${inputCls} w-16`}
                  />
                </td>
                <td className="py-1 pr-2">
                  <input
                    type="number"
                    min={0}
                    value={r.lineDiscount}
                    onChange={(e) => update(i, { lineDiscount: e.target.value })}
                    className={`${inputCls} w-20`}
                  />
                </td>
                <td className="py-1 pr-2 text-right text-zinc-700">{yen(amount(r))}</td>
                <td className="py-1">
                  <button
                    type="button"
                    onClick={() => removeRow(i)}
                    className="px-1 text-zinc-400 hover:text-red-600"
                    aria-label="明細を削除"
                  >
                    ×
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        type="button"
        onClick={addRow}
        className="rounded-md border border-zinc-300 px-3 py-1 text-xs text-zinc-600 hover:bg-zinc-100"
      >
        ＋ 明細を追加
      </button>

      <div className="flex flex-wrap items-end justify-between gap-4 border-t border-zinc-100 pt-3">
        <div className="flex gap-3">
          <label className="flex flex-col gap-1 text-xs text-zinc-600">
            伝票値引
            <input
              type="number"
              name="discountAmount"
              min={0}
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              className={`${inputCls} w-24`}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-600">
            消費税（任意・記録用）
            <input type="number" name="taxAmount" min={0} className={`${inputCls} w-24`} />
          </label>
        </div>
        <div className="text-right text-sm">
          <p className="text-xs text-zinc-500">
            技術 {yen(serviceTotal)} ／ 店販 {yen(retailTotal)}
          </p>
          <p className="mt-1 text-lg font-bold text-zinc-900">合計 {yen(total)}</p>
        </div>
      </div>

      {state.error ? (
        <p role="alert" className="text-xs text-red-600">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-60"
      >
        {pending ? "登録中…" : "会計を記録"}
      </button>
    </form>
  );
}
