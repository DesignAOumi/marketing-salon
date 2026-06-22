"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import {
  updateSalonInfo,
  updateAiConnection,
  updatePrivacy,
  updateTheme,
  setApiKey,
  clearApiKey,
  SHAREABLE_FIELDS,
} from "@/lib/settings";
import { isThemeKey } from "@/lib/theme";
import { testConnection } from "@/lib/anthropic-advice";

export type SettingsState = { error?: string; ok?: string };

async function ensureOwner(): Promise<string | null> {
  const s = await requireAuth();
  return s.role === "owner" ? null : "この操作は管理者(owner)のみ可能です。";
}

export async function saveSalonInfoAction(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const err = await ensureOwner();
  if (err) return { error: err };
  const salonName = String(formData.get("salonName") ?? "").trim();
  if (!salonName) return { error: "サロン名は必須です。" };
  await updateSalonInfo({
    salonName,
    salonPhone: String(formData.get("salonPhone") ?? "").trim() || null,
    salonEmail: String(formData.get("salonEmail") ?? "").trim() || null,
    timezone: String(formData.get("timezone") ?? "Asia/Tokyo").trim() || "Asia/Tokyo",
    currency: String(formData.get("currency") ?? "JPY").trim() || "JPY",
  });
  // タイトルにサロン名を反映するためレイアウトも再検証。
  revalidatePath("/", "layout");
  return { ok: "サロン情報を保存しました。" };
}

export async function saveThemeAction(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const err = await ensureOwner();
  if (err) return { error: err };
  const theme = String(formData.get("themeColor") ?? "zinc");
  await updateTheme(isThemeKey(theme) ? theme : "zinc");
  revalidatePath("/", "layout");
  return { ok: "背景テーマを保存しました。" };
}

export async function saveAiSettingsAction(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const err = await ensureOwner();
  if (err) return { error: err };
  const aiEnabled = formData.get("aiEnabled") === "on";
  const aiMode = formData.get("aiMode") === "connected" ? "connected" : "offline";
  const aiModel = String(formData.get("aiModel") ?? "claude-opus-4-8").trim() || "claude-opus-4-8";
  await updateAiConnection({ aiEnabled, aiMode, aiModel });
  revalidatePath("/settings");
  return { ok: "AI連携設定を保存しました。" };
}

export async function savePrivacyAction(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const err = await ensureOwner();
  if (err) return { error: err };
  const anonymizeBeforeSend = formData.get("anonymizeBeforeSend") === "on";
  const aiSharedFields = SHAREABLE_FIELDS.map((f) => f.key).filter(
    (k) => formData.get(`field_${k}`) === "on",
  );
  const dataRetentionYears = Math.max(1, Math.min(20, Number(formData.get("dataRetentionYears")) || 3));
  const sessionIdleTimeoutMinutes = Math.max(
    5,
    Math.min(1440, Number(formData.get("sessionIdleTimeoutMinutes")) || 60),
  );
  await updatePrivacy({ anonymizeBeforeSend, aiSharedFields, dataRetentionYears, sessionIdleTimeoutMinutes });
  revalidatePath("/settings");
  return { ok: "プライバシー設定を保存しました。" };
}

export async function saveApiKeyAction(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const err = await ensureOwner();
  if (err) return { error: err };
  const key = String(formData.get("apiKey") ?? "").trim();
  if (!key) return { error: "APIキーを入力してください。" };
  await setApiKey(key);
  revalidatePath("/settings");
  return { ok: "APIキーを暗号化して保存しました。" };
}

export async function clearApiKeyAction(): Promise<void> {
  const err = await ensureOwner();
  if (err) return;
  await clearApiKey();
  revalidatePath("/settings");
}

export async function testConnectionAction(
  _prev: SettingsState,
  _formData: FormData,
): Promise<SettingsState> {
  const err = await ensureOwner();
  if (err) return { error: err };
  const result = await testConnection();
  return result.ok ? { ok: result.message } : { error: result.message };
}
