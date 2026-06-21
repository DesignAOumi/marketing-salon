"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { FormState } from "@/app/(app)/customers/actions";

type Staff = { id: string; name: string };

export type CustomerFormDefaults = {
  name?: string;
  nameKana?: string;
  gender?: string;
  birthday?: string;
  phone?: string;
  email?: string;
  hairType?: string;
  skinType?: string;
  allergies?: string;
  preferences?: string;
  notes?: string;
  preferredStaffId?: string;
  consentToContact?: boolean;
};

const GENDERS = [
  { v: "", l: "未選択" },
  { v: "female", l: "女性" },
  { v: "male", l: "男性" },
  { v: "other", l: "その他" },
  { v: "unknown", l: "不明" },
];

function Field({
  label,
  name,
  error,
  children,
  hint,
}: {
  label: string;
  name: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label data-field={name} className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-zinc-700">{label}</span>
      {children}
      {hint ? <span className="text-xs text-zinc-400">{hint}</span> : null}
      {error ? (
        <span role="alert" className="text-xs text-red-600">
          {error}
        </span>
      ) : null}
    </label>
  );
}

const inputCls =
  "rounded-md border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-500";

export function CustomerForm({
  action,
  staff,
  defaultValues = {},
  submitLabel = "保存",
  cancelHref,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  staff: Staff[];
  defaultValues?: CustomerFormDefaults;
  submitLabel?: string;
  cancelHref: string;
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, {});
  const fe = state.fieldErrors ?? {};
  const d = defaultValues;

  return (
    <form action={formAction} className="space-y-6">
      {state.error ? (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="氏名 *" name="name" error={fe.name}>
          <input name="name" required defaultValue={d.name} className={inputCls} />
        </Field>
        <Field label="フリガナ" name="nameKana" error={fe.nameKana}>
          <input name="nameKana" defaultValue={d.nameKana} className={inputCls} />
        </Field>
        <Field label="性別" name="gender" error={fe.gender}>
          <select name="gender" defaultValue={d.gender ?? ""} className={inputCls}>
            {GENDERS.map((g) => (
              <option key={g.v} value={g.v}>
                {g.l}
              </option>
            ))}
          </select>
        </Field>
        <Field label="生年月日" name="birthday" error={fe.birthday}>
          <input type="date" name="birthday" defaultValue={d.birthday} className={inputCls} />
        </Field>
        <Field label="電話番号" name="phone" error={fe.phone} hint="保存時に暗号化されます">
          <input name="phone" defaultValue={d.phone} className={inputCls} />
        </Field>
        <Field label="メールアドレス" name="email" error={fe.email} hint="保存時に暗号化されます">
          <input name="email" type="email" defaultValue={d.email} className={inputCls} />
        </Field>
        <Field label="担当スタッフ" name="preferredStaffId" error={fe.preferredStaffId}>
          <select name="preferredStaffId" defaultValue={d.preferredStaffId ?? ""} className={inputCls}>
            <option value="">未設定</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </Field>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="髪質" name="hairType" error={fe.hairType}>
          <input name="hairType" defaultValue={d.hairType} className={inputCls} />
        </Field>
        <Field label="肌質" name="skinType" error={fe.skinType}>
          <input name="skinType" defaultValue={d.skinType} className={inputCls} />
        </Field>
        <Field
          label="アレルギー・禁忌"
          name="allergies"
          error={fe.allergies}
          hint="カンマ・改行区切りで複数入力可。施術時に警告表示されます"
        >
          <textarea name="allergies" rows={2} defaultValue={d.allergies} className={inputCls} />
        </Field>
        <Field label="嗜好" name="preferences" error={fe.preferences}>
          <textarea name="preferences" rows={2} defaultValue={d.preferences} className={inputCls} />
        </Field>
      </section>

      <Field label="メモ" name="notes" error={fe.notes}>
        <textarea name="notes" rows={3} defaultValue={d.notes} className={inputCls} />
      </Field>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="consentToContact"
          defaultChecked={d.consentToContact}
          className="h-4 w-4"
        />
        <span className="text-zinc-700">
          連絡への同意あり（再来店提案・連絡文の対象に含める）
        </span>
      </label>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-60"
        >
          {pending ? "保存中…" : submitLabel}
        </button>
        <Link
          href={cancelHref}
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-100"
        >
          キャンセル
        </Link>
      </div>
    </form>
  );
}
