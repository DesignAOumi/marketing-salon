import { requireAuth } from "@/lib/auth";
import { getSettingsView, SHAREABLE_FIELDS } from "@/lib/settings";
import { SettingsForm } from "@/components/SettingsForm";
import { SetupChecklist } from "@/components/SetupChecklist";
import {
  saveSalonInfoAction,
  saveAiSettingsAction,
  saveThemeAction,
  saveApiKeyAction,
  clearApiKeyAction,
  testConnectionAction,
} from "./actions";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await requireAuth();
  const view = await getSettingsView();
  const isOwner = session.role === "owner";

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">設定</h1>
        <p className="mt-1 text-sm text-zinc-500">サロン情報・AI連携・プライバシー（管理者のみ編集可）</p>
      </header>

      {!isOwner ? (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
          設定の編集は管理者(owner)のみ可能です。閲覧のみ表示しています。
        </div>
      ) : null}

      <SettingsForm
        view={view}
        fields={SHAREABLE_FIELDS.map((f) => ({ key: f.key, label: f.label, pii: f.pii }))}
        saveSalonInfo={saveSalonInfoAction}
        saveAiSettings={saveAiSettingsAction}
        saveTheme={saveThemeAction}
        saveApiKey={saveApiKeyAction}
        clearApiKey={clearApiKeyAction}
        testConnection={testConnectionAction}
      />

      <details className="mt-4 rounded-xl border border-zinc-200 bg-white p-5">
        <summary className="cursor-pointer select-none text-sm font-semibold text-zinc-800 [&::-webkit-details-marker]:hidden">
          導入チェックリスト
        </summary>
        <div className="mt-4">
          <SetupChecklist />
        </div>
      </details>
    </div>
  );
}
