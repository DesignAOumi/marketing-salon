import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { getM6Targets } from "@/lib/advice";
import { getSettings } from "@/lib/settings";
import { formatDate, toDateInputValue } from "@/lib/format";
import { CYCLE_STATE_LABEL } from "@/lib/cycle";
import { SuggestionMessage } from "@/components/SuggestionMessage";
import { createSuggestionReservationAction, regenerateSuggestionAction, toggleAiAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function SuggestionsPage() {
  await requireAuth();
  const [targets, settings] = await Promise.all([getM6Targets(), getSettings()]);
  const now = new Date();
  const today0 = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const apiReady = settings.aiMode === "connected" && !!settings.encryptedApiKey; // 連携済み（キー登録あり）
  const statusOk = settings.apiKeyStatus === "ok"; // 正常稼働中（残高あり）
  const aiActive = apiReady && statusOk && settings.aiEnabled; // 実際にAI生成を使う

  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">再来店サイクル提案</h1>
        <p className="mt-1 text-sm text-zinc-500">
          来店周期が近い／超過、かつ先の予約がなく、連絡同意のある顧客 {targets.length} 名。
          {aiActive ? "Claude（連携あり）で生成。" : "外部送信ゼロ（オフライン）で生成。"}
        </p>

        {/* AI連携の状態表示 + ON/OFF */}
        <div className="mt-3 flex flex-wrap items-center gap-3">
          {aiActive ? (
            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">🔗 AI連携：ON（Claudeで生成）</span>
          ) : apiReady && statusOk ? (
            <span className="rounded-full bg-zinc-200 px-3 py-1 text-xs font-medium text-zinc-600">AI連携：OFF（オフライン生成中）</span>
          ) : apiReady && !statusOk ? (
            <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
              {settings.apiKeyStatus === "credit" ? "残高不足により稼働不可（オフライン生成中）" : "APIキー稼働不可（オフライン生成中）"}
            </span>
          ) : (
            <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-500">オフライン生成（外部送信ゼロ）</span>
          )}
          {/* ON/OFF は「連携あり＋正常稼働中」のときのみ。 */}
          {apiReady && statusOk ? (
            <form action={toggleAiAction}>
              <button className="rounded-md border border-zinc-300 px-3 py-1 text-xs text-zinc-700 hover:bg-zinc-100">
                {settings.aiEnabled ? "AI連携をOFFにする" : "AI連携をONにする"}
              </button>
            </form>
          ) : (
            <Link href="/settings#ai" className="text-xs text-blue-600 hover:underline">
              {apiReady && !statusOk ? "残高/接続を確認する →" : "AI連携を設定する →"}
            </Link>
          )}
        </div>
      </header>

      {targets.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-10 text-center text-sm text-zinc-400">
          現在、提案対象の顧客はいません。来店・売上データを蓄積すると自動で抽出されます。
        </div>
      ) : (
        <ul className="space-y-4">
          {targets.map((t) => {
            const pred = t.nextPredictedVisitDate;
            const suggested = pred && pred >= today0 ? pred : new Date(now.getTime() + 7 * 86_400_000);
            const isoDate = toDateInputValue(suggested);
            const boundCreate = createSuggestionReservationAction.bind(null, t.id, isoDate);
            const tone = t.cycleState === "overdue" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-800";
            return (
              <li key={t.id} className="rounded-xl border border-zinc-200 bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <Link href={`/customers/${t.id}`} className="text-base font-semibold text-zinc-900 hover:underline">
                        {t.name}
                      </Link>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${tone}`}>
                        {CYCLE_STATE_LABEL[t.cycleState]}
                        {t.cycleOverdueRatio !== null ? `（${t.cycleOverdueRatio.toFixed(1)}倍）` : ""}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-zinc-500">
                      次回予測日 {formatDate(t.nextPredictedVisitDate)}
                      {t.lastService ? ` ・ 前回 ${t.lastService}` : ""}
                    </p>
                  </div>
                  <form action={boundCreate}>
                    <button className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700">
                      予約案を作成（{formatDate(suggested)}）
                    </button>
                  </form>
                </div>

                {t.topAdvice ? (
                  <div className="mt-3 space-y-2">
                    <p className="text-sm text-zinc-700">
                      <span className="mr-1 font-medium text-zinc-500">気づき:</span>
                      {t.topAdvice.insight}
                    </p>
                    {t.topAdvice.customerMessage ? (
                      <SuggestionMessage
                        initial={t.topAdvice.customerMessage}
                        regenerate={regenerateSuggestionAction.bind(null, t.id)}
                      />
                    ) : null}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
