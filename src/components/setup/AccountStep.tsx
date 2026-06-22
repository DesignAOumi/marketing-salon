"use client";

import { useActionState } from "react";
import { createOwnerAction, type WizState } from "@/app/setup/actions";

const input = "rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500";

export function AccountStep() {
  const [state, action, pending] = useActionState<WizState, FormData>(createOwnerAction, {});
  return (
    <form action={action} className="space-y-4">
      <p className="text-sm text-zinc-500">最初に、ログインに使う管理者アカウントを作成します。</p>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-zinc-700">お名前</span>
        <input name="name" required autoComplete="name" className={input} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-zinc-700">メールアドレス</span>
        <input name="email" type="email" required autoComplete="username" className={input} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-zinc-700">パスワード（8文字以上）</span>
        <input name="password" type="password" required minLength={8} autoComplete="new-password" className={input} />
      </label>
      {state.error ? <p role="alert" className="text-sm text-red-600">{state.error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-60"
      >
        {pending ? "作成中…" : "アカウントを作成して次へ"}
      </button>
    </form>
  );
}
