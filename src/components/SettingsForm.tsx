"use client";

import { useActionState } from "react";
import type { SettingsState } from "@/app/(app)/settings/actions";

type Action = (prev: SettingsState, formData: FormData) => Promise<SettingsState>;
type View = {
  salonName: string;
  salonPhone: string | null;
  salonEmail: string | null;
  timezone: string;
  currency: string;
  aiMode: string;
  aiModel: string;
  anonymizeBeforeSend: boolean;
  dataRetentionYears: number;
  sessionIdleTimeoutMinutes: number;
  aiSharedFields: string[];
  hasApiKey: boolean;
};
type Field = { key: string; label: string; pii: boolean };

const input = "rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500";
const card = "rounded-xl border border-zinc-200 bg-white p-6";
const MODELS = ["claude-opus-4-8", "claude-sonnet-4-6", "claude-haiku-4-5"];

function Msg({ s }: { s: SettingsState }) {
  if (s.error) return <p role="alert" className="text-sm text-red-600">{s.error}</p>;
  if (s.ok) return <p className="text-sm text-emerald-600">{s.ok}</p>;
  return null;
}

export function SettingsForm({
  view,
  fields,
  saveSalonInfo,
  saveAiSettings,
  saveApiKey,
  clearApiKey,
  testConnection,
}: {
  view: View;
  fields: Field[];
  saveSalonInfo: Action;
  saveAiSettings: Action;
  saveApiKey: Action;
  clearApiKey: () => Promise<void>;
  testConnection: Action;
}) {
  const [salonState, salonAction, salonPending] = useActionState<SettingsState, FormData>(saveSalonInfo, {});
  const [aiState, aiAction, aiPending] = useActionState<SettingsState, FormData>(saveAiSettings, {});
  const [keyState, keyAction, keyPending] = useActionState<SettingsState, FormData>(saveApiKey, {});
  const [testState, testAction, testPending] = useActionState<SettingsState, FormData>(testConnection, {});

  return (
    <div className="space-y-6">
      {/* サロン情報 */}
      <form action={salonAction} className={card}>
        <h2 className="mb-4 text-sm font-semibold text-zinc-800">サロン情報</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-zinc-700">サロン名 *</span>
            <input name="salonName" required defaultValue={view.salonName} className={input} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-zinc-700">電話</span>
            <input name="salonPhone" defaultValue={view.salonPhone ?? ""} className={input} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-zinc-700">メール</span>
            <input name="salonEmail" defaultValue={view.salonEmail ?? ""} className={input} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-zinc-700">タイムゾーン</span>
            <input name="timezone" defaultValue={view.timezone} className={input} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-zinc-700">通貨</span>
            <input name="currency" defaultValue={view.currency} className={input} />
          </label>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button disabled={salonPending} className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-60">
            {salonPending ? "保存中…" : "保存"}
          </button>
          <Msg s={salonState} />
        </div>
      </form>

      {/* AI連携・プライバシー */}
      <form action={aiAction} className={card}>
        <h2 className="mb-1 text-sm font-semibold text-zinc-800">AI連携・プライバシー</h2>
        <p className="mb-4 text-xs text-zinc-400">既定は「連携なし（オフライン・外部送信ゼロ）」。連携ありは明示オプトイン。</p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-zinc-700">AIモード</span>
            <select name="aiMode" defaultValue={view.aiMode} className={input}>
              <option value="offline">連携なし（オフライン）</option>
              <option value="connected">連携あり（Claude BYO）</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-zinc-700">モデル</span>
            <select name="aiModel" defaultValue={view.aiModel} className={input}>
              {MODELS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-zinc-700">データ保持年数</span>
            <input type="number" name="dataRetentionYears" min={1} max={20} defaultValue={view.dataRetentionYears} className={input} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-zinc-700">無操作ログアウト（分）</span>
            <input type="number" name="sessionIdleTimeoutMinutes" min={5} max={1440} defaultValue={view.sessionIdleTimeoutMinutes} className={input} />
          </label>
        </div>

        <label className="mt-4 flex items-center gap-2 text-sm">
          <input type="checkbox" name="anonymizeBeforeSend" defaultChecked={view.anonymizeBeforeSend} className="h-4 w-4" />
          <span className="text-zinc-700">送信前に氏名を匿名化（既定ON・推奨）</span>
        </label>

        <fieldset className="mt-4">
          <legend className="text-xs font-medium text-zinc-500">AI送信を許可するフィールド（PIIは既定OFF）</legend>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {fields.map((f) => (
              <label key={f.key} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name={`field_${f.key}`}
                  defaultChecked={view.aiSharedFields.includes(f.key)}
                  className="h-4 w-4"
                />
                <span className={f.pii ? "text-amber-700" : "text-zinc-700"}>
                  {f.label}{f.pii ? " ⚠PII" : ""}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="mt-4 flex items-center gap-3">
          <button disabled={aiPending} className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-60">
            {aiPending ? "保存中…" : "保存"}
          </button>
          <Msg s={aiState} />
        </div>
      </form>

      {/* APIキー */}
      <div className={card}>
        <h2 className="mb-1 text-sm font-semibold text-zinc-800">Claude APIキー（BYO）</h2>
        <p className="mb-4 text-xs text-zinc-400">
          保存時に AES-256-GCM で暗号化されます。状態:{" "}
          {view.hasApiKey ? <span className="text-emerald-600">登録済み</span> : <span className="text-zinc-500">未登録</span>}
        </p>
        <form action={keyAction} className="flex flex-wrap items-end gap-3">
          <label className="flex flex-1 flex-col gap-1 text-sm">
            <span className="font-medium text-zinc-700">APIキー</span>
            <input name="apiKey" type="password" placeholder="sk-ant-..." className={`${input} min-w-64`} />
          </label>
          <button disabled={keyPending} className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-60">
            {keyPending ? "保存中…" : "保存"}
          </button>
        </form>
        <div className="mt-3 flex items-center gap-3">
          <form action={testAction}>
            <button disabled={testPending} className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 disabled:opacity-60">
              {testPending ? "テスト中…" : "接続テスト"}
            </button>
          </form>
          {view.hasApiKey ? (
            <form action={clearApiKey}>
              <button className="rounded-md border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50">
                キーを削除
              </button>
            </form>
          ) : null}
        </div>
        <div className="mt-2 space-y-1">
          <Msg s={keyState} />
          <Msg s={testState} />
        </div>
      </div>
    </div>
  );
}
