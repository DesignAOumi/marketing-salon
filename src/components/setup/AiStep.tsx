"use client";

import { useActionState, useState } from "react";
import { finishSetupAction, type WizState } from "@/app/setup/actions";

const input = "rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500";
const MODELS = ["claude-opus-4-8", "claude-sonnet-4-6", "claude-haiku-4-5"];

export function AiStep() {
  const [state, action, pending] = useActionState<WizState, FormData>(finishSetupAction, {});
  const [mode, setMode] = useState<"offline" | "connected">("offline");

  return (
    <form action={action} className="space-y-4">
      <p className="text-sm text-zinc-500">
        AIアドバイスの動作モードを選びます。既定は外部送信ゼロのオフラインです（後から設定で変更可）。
      </p>

      <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-zinc-200 p-3">
        <input type="radio" name="mode" value="offline" checked={mode === "offline"} onChange={() => setMode("offline")} className="mt-1" />
        <span>
          <span className="text-sm font-medium text-zinc-800">オフラインで始める（推奨・既定）</span>
          <span className="block text-xs text-zinc-500">110件の定型アドバイスをローカル照合。外部送信ゼロ・API課金なし。</span>
        </span>
      </label>

      <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-zinc-200 p-3">
        <input type="radio" name="mode" value="connected" checked={mode === "connected"} onChange={() => setMode("connected")} className="mt-1" />
        <span>
          <span className="text-sm font-medium text-zinc-800">連携あり（Claude APIキー）</span>
          <span className="block text-xs text-zinc-500">自分のClaude APIキーで個別化された連絡文を生成（PII最小化・匿名化）。</span>
        </span>
      </label>

      {mode === "connected" ? (
        <div className="grid grid-cols-1 gap-3 rounded-lg bg-zinc-50 p-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-xs text-zinc-600">
            Claude APIキー
            <input name="apiKey" type="password" placeholder="sk-ant-..." className={input} />
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-600">
            モデル
            <select name="aiModel" defaultValue="claude-opus-4-8" className={input}>
              {MODELS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </label>
        </div>
      ) : null}

      {state.error ? <p role="alert" className="text-sm text-red-600">{state.error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-60"
      >
        {pending ? "完了処理中…" : "セットアップを完了してダッシュボードへ"}
      </button>
    </form>
  );
}
