/**
 * サロン設定・AI連携設定（M0 / FR-M0-05〜09）。Node 専用。
 * APIキーは crypto.ts で AES-256-GCM 暗号化して encryptedApiKey に保存（平文・apiKeyIv不要：v1:iv:tag:cipher 形式）。
 */
import "server-only";
import { prisma } from "@/lib/prisma";
import { encrypt, decrypt } from "@/lib/crypto";

// AI連携あり時に送信可能なフィールド（PII 既定OFF / FR-AI-03）。
export const SHAREABLE_FIELDS = [
  { key: "status", label: "顧客ステータス", pii: false },
  { key: "cycleOverdueRatio", label: "周期超過率", pii: false },
  { key: "avgVisitIntervalDays", label: "平均来店間隔", pii: false },
  { key: "daysSinceLastVisit", label: "最終来店からの日数", pii: false },
  { key: "lastService", label: "前回メニュー", pii: false },
  { key: "visitCount", label: "来店回数", pii: false },
  { key: "avgSpend", label: "客単価", pii: false },
  { key: "retailRatio", label: "店販比率", pii: false },
  { key: "rfmSegment", label: "RFMセグメント", pii: false },
  { key: "daysToBirthday", label: "誕生日までの日数", pii: false },
  { key: "hairType", label: "髪質", pii: true },
  { key: "skinType", label: "肌質", pii: true },
  { key: "preferences", label: "嗜好（自由記述）", pii: true },
  { key: "allergies", label: "アレルギー", pii: true },
] as const;

export const DEFAULT_SHARED_FIELDS = SHAREABLE_FIELDS.filter((f) => !f.pii).map((f) => f.key);

export async function getSettings() {
  const existing = await prisma.settings.findUnique({ where: { id: "singleton" } });
  if (existing) return existing;
  return prisma.settings.create({ data: { id: "singleton", salonName: "My Salon" } });
}

/** 画面表示用（APIキーはマスク、送信フィールドは配列に展開）。 */
export async function getSettingsView() {
  const s = await getSettings();
  return {
    salonName: s.salonName,
    salonPhone: s.salonPhone,
    salonEmail: s.salonEmail,
    timezone: s.timezone,
    currency: s.currency,
    aiMode: s.aiMode,
    aiModel: s.aiModel ?? "claude-opus-4-8",
    anonymizeBeforeSend: s.anonymizeBeforeSend,
    dataRetentionYears: s.dataRetentionYears,
    sessionIdleTimeoutMinutes: s.sessionIdleTimeoutMinutes,
    aiSharedFields: s.aiSharedFields ? (JSON.parse(s.aiSharedFields) as string[]) : DEFAULT_SHARED_FIELDS,
    themeColor: s.themeColor,
    hasApiKey: !!s.encryptedApiKey,
  };
}

export async function updateTheme(themeColor: string) {
  await getSettings();
  return prisma.settings.update({ where: { id: "singleton" }, data: { themeColor } });
}

export async function updateSalonInfo(data: {
  salonName: string;
  salonPhone?: string | null;
  salonEmail?: string | null;
  timezone: string;
  currency: string;
}) {
  await getSettings();
  return prisma.settings.update({ where: { id: "singleton" }, data });
}

export async function updateAiSettings(data: {
  aiMode: "offline" | "connected";
  aiModel: string;
  anonymizeBeforeSend: boolean;
  aiSharedFields: string[];
  dataRetentionYears: number;
  sessionIdleTimeoutMinutes: number;
}) {
  await getSettings();
  return prisma.settings.update({
    where: { id: "singleton" },
    data: {
      aiMode: data.aiMode,
      aiModel: data.aiModel,
      anonymizeBeforeSend: data.anonymizeBeforeSend,
      aiSharedFields: JSON.stringify(data.aiSharedFields),
      dataRetentionYears: data.dataRetentionYears,
      sessionIdleTimeoutMinutes: data.sessionIdleTimeoutMinutes,
    },
  });
}

export async function setApiKey(plain: string) {
  await getSettings();
  return prisma.settings.update({
    where: { id: "singleton" },
    data: { encryptedApiKey: encrypt(plain), apiKeyIv: null },
  });
}

export async function clearApiKey() {
  await getSettings();
  return prisma.settings.update({
    where: { id: "singleton" },
    data: { encryptedApiKey: null, apiKeyIv: null },
  });
}

/** サーバー内部でのみ使用（APIキー復号）。UI へは絶対に返さない。 */
export async function getDecryptedApiKey(): Promise<string | null> {
  const s = await getSettings();
  if (!s.encryptedApiKey) return null;
  try {
    return decrypt(s.encryptedApiKey);
  } catch {
    return null;
  }
}
