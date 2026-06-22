"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { createReservation } from "@/lib/reservations";
import { regenerateRevisitMessage } from "@/lib/advice";
import { generateConnectedAdvice } from "@/lib/anthropic-advice";
import { getSettings, updateAiConnection } from "@/lib/settings";

/** M6 ワンクリック予約案作成（source=m6_suggestion）。FR-M6-04。 */
export async function createSuggestionReservationAction(
  customerId: string,
  isoDate: string,
): Promise<void> {
  await requireAuth();
  const startAt = new Date(`${isoDate}T10:00:00`); // 予測日の10:00を既定案とする
  await createReservation({ customerId, startAt, memo: "再来店サイクル提案" }, "m6_suggestion");
  revalidatePath("/suggestions");
  revalidatePath("/reservations");
  redirect("/reservations");
}

/** 再提案：連携ありはAIで再生成、連携なしは別バリエーションを生成。 */
export async function regenerateSuggestionAction(
  customerId: string,
): Promise<{ message: string | null; error?: string }> {
  await requireAuth();
  const settings = await getSettings();
  const connected =
    settings.aiEnabled &&
    settings.aiMode === "connected" &&
    !!settings.encryptedApiKey &&
    settings.apiKeyStatus === "ok";
  if (connected) {
    const r = await generateConnectedAdvice(customerId);
    if (r?.customerMessage) return { message: r.customerMessage };
    return { message: null, error: "AI生成に失敗しました（クレジット残高・接続をご確認ください）。" };
  }
  const seed = Math.floor(Math.random() * 1_000_000_000);
  return { message: await regenerateRevisitMessage(customerId, seed) };
}

/** 提案画面の AI連携 ON/OFF トグル。ONは正常稼働中のみ許可。 */
export async function toggleAiAction(): Promise<void> {
  await requireAuth();
  const s = await getSettings();
  const turningOn = !s.aiEnabled;
  if (turningOn && s.apiKeyStatus !== "ok") {
    revalidatePath("/suggestions");
    return; // 正常稼働中でなければONにしない
  }
  await updateAiConnection({
    aiEnabled: !s.aiEnabled,
    aiMode: s.aiMode,
    aiModel: s.aiModel ?? "claude-opus-4-8",
  });
  revalidatePath("/suggestions");
}
