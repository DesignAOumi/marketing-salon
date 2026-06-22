"use client";

import { useActionState } from "react";
import type { SettingsState } from "@/app/(app)/settings/actions";
import { THEMES } from "@/lib/theme";

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
  themeColor: string;
  hasApiKey: boolean;
};
type Field = { key: string; label: string; pii: boolean };

const input = "rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500";
const card = "rounded-xl border border-zinc-200 bg-white p-5";
const MODELS = ["claude-opus-4-8", "claude-sonnet-4-6", "claude-haiku-4-5"];

function Msg({ s }: { s: SettingsState }) {
  if (s.error) return <p role="alert" className="text-sm text-red-600">{s.error}</p>;
  if (s.ok) return <p className="text-sm text-emerald-600">{s.ok}</p>;
  return null;
}

// 折りたたみトグル（details/summary）。
function Section({
  title,
  desc,
  open,
  children,
}: {
  title: string;
  desc?: string;
  open?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details className={card} open={open}>
      <summary className="flex cursor-pointer select-none items-center justify-between text-sm font-semibold text-zinc-800 [&::-webkit-details-marker]:hidden">
        <span>{title}</span>
        <span className="text-zinc-400 transition-transform">▾</span>
      </summary>
      {desc ? <p className="mt-1 text-xs text-zinc-400">{desc}</p> : null}
      <div className="mt-4">{children}</div>
    </details>
  );
}

export function SettingsForm({
  view,
  fields,
  saveSalonInfo,
  saveAiSettings,
  saveTheme,
  saveApiKey,
  clearApiKey,
  testConnection,
}: {
  view: View;
  fields: Field[];
  saveSalonInfo: Action;
  saveAiSettings: Action;
  saveTheme: Action;
  saveApiKey: Action;
  clearApiKey: () => Promise<void>;
  testConnection: Action;
}) {
  const [salonState, salonAction, salonPending] = useActionState<SettingsState, FormData>(saveSalonInfo, {});
  const [aiState, aiAction, aiPending] = useActionState<SettingsState, FormData>(saveAiSettings, {});
  const [themeState, themeAction, themePending] = useActionState<SettingsState, FormData>(saveTheme, {});
  const [keyState, keyAction, keyPending] = useActionState<SettingsState, FormData>(saveApiKey, {});
  const [testState, testAction, testPending] = useActionState<SettingsState, FormData>(testConnection, {});

  return (
    <div className="space-y-4">
      {/* サロン情報 */}
      <Section title="サロン情報" open>
        <form action={salonAction}>
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
          <p className="mt-2 text-xs text-zinc-400">※ サロン名はアプリのタイトルにも反映されます。</p>
        </form>
      </Section>

      {/* 背景テーマカラー */}
      <Section title="背景テーマカラー" desc="アプリの背景色を選べます。">
        <form action={themeAction}>
          <div className="flex flex-wrap gap-4">
            {THEMES.map((t) => (
              <label key={t.key} className="flex cursor-pointer flex-col items-center gap-1">
                <input type="radio" name="themeColor" value={t.key} defaultChecked={view.themeColor === t.key} className="peer sr-only" />
                <span className={`h-9 w-9 rounded-full border-2 border-zinc-200 ${t.swatch} peer-checked:border-zinc-900`} />
                <span className="text-[11px] text-zinc-600">{t.label}</span>
              </label>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-3">
            <button disabled={themePending} className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-60">
              {themePending ? "保存中…" : "保存"}
            </button>
            <Msg s={themeState} />
          </div>
        </form>
      </Section>

      {/* AI連携・プライバシー */}
      <Section title="AI連携・プライバシー" desc="既定は「連携なし（オフライン・外部送信ゼロ）」。連携ありは明示オプトイン。">
        <form action={aiAction}>
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
                  <input type="checkbox" name={`field_${f.key}`} defaultChecked={view.aiSharedFields.includes(f.key)} className="h-4 w-4" />
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
      </Section>

      {/* APIキー */}
      <Section title="Claude APIキー（BYO）" desc="保存時に AES-256-GCM で暗号化されます。">
        <p className="mb-3 text-xs text-zinc-400">
          状態: {view.hasApiKey ? <span className="text-emerald-600">登録済み</span> : <span className="text-zinc-500">未登録</span>}
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
              <button className="rounded-md border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50">キーを削除</button>
            </form>
          ) : null}
        </div>
        <div className="mt-2 space-y-1">
          <Msg s={keyState} />
          <Msg s={testState} />
        </div>
      </Section>
    </div>
  );
}
