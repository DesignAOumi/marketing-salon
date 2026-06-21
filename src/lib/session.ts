/**
 * セッショントークン（署名付き JWT, HS256）。
 * jose を使用し Node / Edge(middleware) の両ランタイムで動作する。
 * ※ ここには next/headers（Cookie API）を import しない。Cookie 操作は auth.ts（Node専用）側に置く。
 */
import { SignJWT, jwtVerify, type JWTPayload } from "jose";

export const SESSION_COOKIE = "salon_session";
const DEFAULT_MAX_AGE_SEC = 60 * 60 * 8; // 8時間

export type SessionPayload = {
  sub: string; // Staff.id
  email: string | null;
  role: string; // owner / staff
  name: string;
};

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "AUTH_SECRET が未設定または短すぎます。`openssl rand -base64 48` で生成して .env に設定してください。",
    );
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(
  payload: SessionPayload,
  maxAgeSec: number = DEFAULT_MAX_AGE_SEC,
): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${maxAgeSec}s`)
    .sign(getSecret());
}

export async function verifySessionToken(
  token: string | undefined | null,
): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    const p = payload as JWTPayload & Partial<SessionPayload>;
    if (!p.sub || typeof p.role !== "string") return null;
    return {
      sub: p.sub,
      email: p.email ?? null,
      role: p.role,
      name: p.name ?? "",
    };
  } catch {
    return null;
  }
}

export const SESSION_MAX_AGE_SEC = DEFAULT_MAX_AGE_SEC;
