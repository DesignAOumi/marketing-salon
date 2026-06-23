"use client";

import { useActionState } from "react";
import type { ConnectedState } from "@/app/(app)/customers/actions";
import { CopyButton } from "@/components/CopyButton";

export function ConnectedAdvicePanel({
  action,
}: {
  action: (prev: ConnectedState, formData: FormData) => Promise<ConnectedState>;
}) {
  const [state, formAction, pending] = useActionState<ConnectedState, FormData>(action, {});
  const a = state.advice;

  return (
    <div className="mb-4 rounded-xl border border-indigo-200 bg-indigo-50/40 p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-800">AIで個別化（連携あり / Claude）</h2>
        <form action={formAction}>
          <button
            disabled={pending}
            className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
          >
            {pending ? "生成中…" : "AIで連絡文を生成"}
          </button>
        </form>
      </div>
      <p className="mt-1 text-xs text-zinc-500">カルテの「メモ・嗜好」を踏まえてパーソナライズします（送信フィールドで制御可）。</p>

      {state.error ? (
        <p role="alert" className="mt-2 text-xs text-amber-700">{state.error}</p>
      ) : null}

      {a ? (
        <div className="mt-3 space-y-2">
          <p className="text-sm text-zinc-700">
            <span className="mr-1 font-medium text-zinc-500">気づき:</span>
            {a.insight}
          </p>
          <p className="text-xs text-zinc-500">
            <span className="font-medium">推奨アクション:</span> {a.recommendedAction}
          </p>
          {a.customerMessage ? (
            <div className="rounded-lg bg-white p-3">
              <p className="whitespace-pre-wrap text-sm text-zinc-800">{a.customerMessage}</p>
              <div className="mt-2">
                <CopyButton text={a.customerMessage} />
              </div>
            </div>
          ) : null}
          <p className="text-[11px] text-zinc-400">
            モデル: {a.model} ／ 送信フィールド: {a.sentFields.join(", ")}
          </p>
        </div>
      ) : null}
    </div>
  );
}
