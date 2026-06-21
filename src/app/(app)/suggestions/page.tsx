import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { getM6Targets } from "@/lib/advice";
import { formatDate, toDateInputValue } from "@/lib/format";
import { CYCLE_STATE_LABEL } from "@/lib/cycle";
import { CopyButton } from "@/components/CopyButton";
import { createSuggestionReservationAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function SuggestionsPage() {
  await requireAuth();
  const targets = await getM6Targets();
  const now = new Date();
  const today0 = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">再来店サイクル提案（M6）</h1>
        <p className="mt-1 text-sm text-zinc-500">
          来店周期が近い／超過、かつ先の予約がなく、連絡同意のある顧客 {targets.length} 名。
          外部送信ゼロ（オフライン）で生成。
        </p>
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
                      <div className="rounded-lg bg-zinc-50 p-3">
                        <p className="whitespace-pre-wrap text-sm text-zinc-800">
                          {t.topAdvice.customerMessage}
                        </p>
                        <div className="mt-2">
                          <CopyButton text={t.topAdvice.customerMessage} />
                        </div>
                      </div>
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
