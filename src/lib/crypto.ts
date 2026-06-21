/**
 * 機微フィールド保存時暗号化ユーティリティ（AES-256-GCM）。
 *
 *  - 用途: Settings.encryptedApiKey（BYO Claude APIキー）, OAuthトークン, 連絡先等の
 *    保存時暗号化（要件定義書 §9.2 / data-model §6.2）。
 *  - 鍵は環境変数 ENCRYPTION_KEY（32バイト）から導出。リポジトリには格納しない。
 *  - Node ランタイム専用（node:crypto を使用）。Edge/Client から import しないこと。
 *
 * 保存形式: "v1:<ivB64>:<tagB64>:<cipherB64>"（バージョンタグ付きで将来の鍵ローテーションに対応）。
 */
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from "node:crypto";

const ALGO = "aes-256-gcm";
const IV_LEN = 12; // GCM 推奨 96bit
const VERSION = "v1";

/** ENCRYPTION_KEY を 32 バイト鍵として解釈する（hex64 または base64）。 */
function getKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) {
    throw new Error(
      "ENCRYPTION_KEY が未設定です。`openssl rand -hex 32` で生成して .env に設定してください。",
    );
  }
  let key: Buffer;
  if (/^[0-9a-fA-F]{64}$/.test(raw)) {
    key = Buffer.from(raw, "hex");
  } else {
    key = Buffer.from(raw, "base64");
  }
  if (key.length !== 32) {
    throw new Error(
      `ENCRYPTION_KEY は32バイトである必要があります（現在 ${key.length} バイト）。hex64桁 または base64 で32バイトを指定してください。`,
    );
  }
  return key;
}

/** 平文を暗号化して保存用文字列を返す。 */
export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [
    VERSION,
    iv.toString("base64"),
    tag.toString("base64"),
    enc.toString("base64"),
  ].join(":");
}

/** encrypt() で生成した文字列を復号する。改竄/鍵不一致時は例外。 */
export function decrypt(payload: string): string {
  const parts = payload.split(":");
  if (parts.length !== 4 || parts[0] !== VERSION) {
    throw new Error("暗号文の形式が不正です（想定: v1:iv:tag:cipher）。");
  }
  const [, ivB64, tagB64, cipherB64] = parts;
  const key = getKey();
  const decipher = createDecipheriv(ALGO, key, Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  const dec = Buffer.concat([
    decipher.update(Buffer.from(cipherB64, "base64")),
    decipher.final(),
  ]);
  return dec.toString("utf8");
}

/** UI 表示用マスキング（例: APIキーの末尾4桁のみ表示）。 */
export function maskSecret(value: string, visible = 4): string {
  if (!value) return "";
  if (value.length <= visible) return "•".repeat(value.length);
  return "•".repeat(Math.max(4, value.length - visible)) + value.slice(-visible);
}
