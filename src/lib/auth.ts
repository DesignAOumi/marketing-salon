/**
 * サーバー側の認証ヘルパー（Node 専用：next/headers Cookie API を使用）。
 * Server Components / Server Actions / Route Handlers から利用する。
 * middleware（Edge）からは使わない（middleware は session.ts の verify を直接使う）。
 */
import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SEC,
  createSessionToken,
  verifySessionToken,
  type SessionPayload,
} from "@/lib/session";

/**
 * Secure 属性は配布URL（APP_URL）のスキームから判定する。
 * NODE_ENV ではなく https かどうかで決めることで、HTTP の LAN セルフホスト
 * （例 http://192.168.x.x:3000）で Secure Cookie がサイレント破棄されログイン
 * できなくなる問題を防ぐ。公開設置時は APP_URL を https:// にして Secure を有効化する。
 */
function secureCookieEnabled(): boolean {
  return (process.env.APP_URL ?? "").startsWith("https:");
}

/** セッション Cookie を発行する（ログイン成功時）。 */
export async function setSession(payload: SessionPayload): Promise<void> {
  const token = await createSessionToken(payload);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: secureCookieEnabled(),
    path: "/",
    maxAge: SESSION_MAX_AGE_SEC,
  });
}

/** セッション Cookie を破棄する（ログアウト時）。 */
export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

/** 現在のセッションを返す（未ログインなら null）。 */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  return verifySessionToken(token);
}

/** ログイン必須。未ログインなら /login へリダイレクト。 */
export async function requireAuth(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}
