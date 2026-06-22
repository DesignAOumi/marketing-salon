"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { setSession, getSession } from "@/lib/auth";
import { advanceTo, completeSetup } from "@/lib/onboarding";
import { updateSalonInfo, setApiKey, DEFAULT_SHARED_FIELDS } from "@/lib/settings";
import { importSampleCustomers } from "@/lib/sample-data";
import { createService, addDefaultServices, countServices } from "@/lib/services";

export type WizState = { error?: string; ok?: string };

async function requireSetupSession() {
  const s = await getSession();
  if (!s) redirect("/login");
  return s;
}

// ── ① アカウント作成（初回・認証前に実行可）─────────────────
export async function createOwnerAction(_prev: WizState, formData: FormData): Promise<WizState> {
  const exists = await prisma.staff.count({ where: { role: "owner", isActive: true } });
  if (exists > 0) return { error: "管理者は既に存在します。ログインしてください。" };

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!name || !email || !password) return { error: "すべての項目を入力してください。" };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { error: "メールアドレスの形式が正しくありません。" };
  if (password.length < 8) return { error: "パスワードは8文字以上にしてください。" };
  const dup = await prisma.staff.findUnique({ where: { email } });
  if (dup) return { error: "そのメールアドレスは既に使われています。" };

  const passwordHash = await hashPassword(password);
  const owner = await prisma.staff.create({ data: { name, email, passwordHash, role: "owner", isActive: true } });
  await setSession({ sub: owner.id, email: owner.email, role: owner.role, name: owner.name });
  await advanceTo(1);
  redirect("/setup");
}

// ── ② サロン情報 ──────────────────────────────────────────
export async function saveSalonAction(_prev: WizState, formData: FormData): Promise<WizState> {
  await requireSetupSession();
  const salonName = String(formData.get("salonName") ?? "").trim();
  if (!salonName) return { error: "サロン名は必須です。" };
  await updateSalonInfo({
    salonName,
    salonPhone: String(formData.get("salonPhone") ?? "").trim() || null,
    salonEmail: String(formData.get("salonEmail") ?? "").trim() || null,
    timezone: String(formData.get("timezone") ?? "Asia/Tokyo").trim() || "Asia/Tokyo",
    currency: String(formData.get("currency") ?? "JPY").trim() || "JPY",
  });
  await advanceTo(2);
  redirect("/setup");
}

// ── ③ 顧客データ（サンプル取り込み / スキップ）──────────────
export async function importSampleAction(): Promise<void> {
  await requireSetupSession();
  await importSampleCustomers(100);
  revalidatePath("/setup");
}

export async function advanceCustomersAction(): Promise<void> {
  await requireSetupSession();
  await advanceTo(3);
  redirect("/setup");
}

// ── ④ メニュー登録 ────────────────────────────────────────
export async function addServiceAction(_prev: WizState, formData: FormData): Promise<WizState> {
  await requireSetupSession();
  const name = String(formData.get("name") ?? "").trim();
  const price = Number(formData.get("price"));
  if (!name) return { error: "メニュー名は必須です。" };
  if (!Number.isFinite(price) || price < 0) return { error: "価格は0以上で入力してください。" };
  await createService({
    name,
    price: Math.round(price),
    category: String(formData.get("category") ?? "").trim() || null,
    durationMin: Number(formData.get("durationMin")) || null,
    defaultCycleDays: Number(formData.get("defaultCycleDays")) || null,
  });
  revalidatePath("/setup");
  return { ok: "メニューを追加しました。" };
}

export async function addDefaultServicesAction(): Promise<void> {
  await requireSetupSession();
  await addDefaultServices();
  revalidatePath("/setup");
}

export async function advanceMenusAction(_prev: WizState, _formData: FormData): Promise<WizState> {
  await requireSetupSession();
  if ((await countServices()) < 1) return { error: "メニューを1つ以上登録してください。" };
  await advanceTo(4);
  redirect("/setup");
}

// ── ⑤ AI連携 → セットアップ完了 ───────────────────────────
export async function finishSetupAction(_prev: WizState, formData: FormData): Promise<WizState> {
  await requireSetupSession();
  const mode = formData.get("mode") === "connected" ? "connected" : "offline";
  if (mode === "connected") {
    const key = String(formData.get("apiKey") ?? "").trim();
    if (!key) return { error: "「連携あり」を選んだ場合は APIキーを入力してください。" };
    await setApiKey(key);
  }
  await prisma.settings.update({
    where: { id: "singleton" },
    data: {
      aiMode: mode,
      aiModel: String(formData.get("aiModel") ?? "claude-opus-4-8") || "claude-opus-4-8",
      anonymizeBeforeSend: true,
      aiSharedFields: JSON.stringify(DEFAULT_SHARED_FIELDS),
    },
  });
  await completeSetup();
  redirect("/dashboard");
}
