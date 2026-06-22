/**
 * 初回セットアップ・ウィザードの進行管理（FR-M0-01）。Node 専用。
 * 各ステップを順にクリアし、全完了で setupCompletedAt を立てる（→ ダッシュボード解放）。
 */
import "server-only";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";

export const ONBOARDING_STEPS = [
  { key: "account", title: "アカウント作成", desc: "管理者アカウントを作成します。" },
  { key: "salon", title: "サロン情報", desc: "サロン名・連絡先・通貨などを登録します。" },
  { key: "customers", title: "顧客データ", desc: "サンプル取り込み、またはCSVで顧客を登録します。" },
  { key: "menus", title: "区分・メニュー登録", desc: "区分とメニューを登録します。" },
  { key: "confirm", title: "登録内容の確認", desc: "区分・メニューの登録内容を確認します。" },
  { key: "ai", title: "AI連携", desc: "Claude APIキー登録（任意・既定はオフライン）。" },
] as const;

export const TOTAL_STEPS = ONBOARDING_STEPS.length; // 6

export type OnboardingState = {
  step: number; // 現在取り組むステップ index（0..TOTAL_STEPS）
  completed: boolean;
  ownerExists: boolean;
};

export async function getOnboarding(): Promise<OnboardingState> {
  const settings = await getSettings();
  const ownerExists = (await prisma.staff.count({ where: { role: "owner", isActive: true } })) > 0;
  let step = settings.onboardingStep;
  // owner が既に居れば account ステップは完了扱い
  if (step === 0 && ownerExists) step = 1;
  return { step, completed: !!settings.setupCompletedAt, ownerExists };
}

/** ステップ index を最低 n まで進める（後退はしない）。 */
export async function advanceTo(n: number) {
  const s = await getSettings();
  if (s.onboardingStep < n) {
    await prisma.settings.update({ where: { id: "singleton" }, data: { onboardingStep: n } });
  }
}

export async function completeSetup() {
  await getSettings();
  await prisma.settings.update({
    where: { id: "singleton" },
    data: { onboardingStep: TOTAL_STEPS, setupCompletedAt: new Date() },
  });
}
