"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { setSession } from "@/lib/auth";

export type LoginState = { error?: string };

/** ログイン Server Action（FR-M0-02）。資格情報を検証しセッションを発行する。 */
export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/dashboard") || "/dashboard";

  if (!email || !password) {
    return { error: "メールアドレスとパスワードを入力してください。" };
  }

  const staff = await prisma.staff.findUnique({ where: { email } });
  const ok =
    !!staff && staff.isActive && (await verifyPassword(password, staff.passwordHash));

  if (!ok || !staff) {
    // 列挙攻撃を避けるため、原因を区別しない一般化メッセージ
    return { error: "メールアドレスまたはパスワードが正しくありません。" };
  }

  await setSession({
    sub: staff.id,
    email: staff.email,
    role: staff.role,
    name: staff.name,
  });

  redirect(safeRedirectPath(next));
}

/**
 * オープンリダイレクト防止：アプリ内の相対パスのみ許可する。
 * URL 正規化により `//evil.com`・`/\evil.com`（バックスラッシュ）・スキーム付きを除外する。
 * 先頭1文字判定だけでは `/\evil.com` がブラウザ正規化で外部URLになり得るため不可。
 */
function safeRedirectPath(raw: string): string {
  try {
    const u = new URL(raw, "http://localhost");
    // 別ホストへ解決される入力（//host, /\host, https://host 等）は拒否
    if (u.host !== "localhost" || u.protocol !== "http:") return "/dashboard";
    const path = u.pathname + u.search;
    if (!path.startsWith("/") || path.startsWith("//")) return "/dashboard";
    return path;
  } catch {
    return "/dashboard";
  }
}
