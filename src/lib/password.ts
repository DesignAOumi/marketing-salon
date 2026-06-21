/**
 * パスワードハッシュ（bcrypt）。Node ランタイム専用。
 * 要件: 平文保存禁止（FR-M0-02 / §9.2）。Edge（middleware）からは import しないこと。
 */
import bcrypt from "bcryptjs";

const ROUNDS = 12;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, ROUNDS);
}

export async function verifyPassword(
  plain: string,
  hash: string | null | undefined,
): Promise<boolean> {
  if (!hash) return false;
  return bcrypt.compare(plain, hash);
}
