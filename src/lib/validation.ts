import { z } from "zod";

// 顧客フォームの入力スキーマ（M1）。空文字は未入力(undefined)へ正規化する。
const emptyToUndef = (v: unknown) =>
  typeof v === "string" && v.trim() === "" ? undefined : v;

const optionalStr = z.preprocess(emptyToUndef, z.string().trim().optional());

export const genderValues = ["male", "female", "other", "unknown"] as const;

export const customerInputSchema = z.object({
  name: z.string().trim().min(1, "氏名は必須です").max(100),
  nameKana: optionalStr,
  gender: z.preprocess(
    emptyToUndef,
    z.enum(genderValues).optional(),
  ),
  birthday: z.preprocess(
    emptyToUndef,
    z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "生年月日は YYYY-MM-DD 形式で入力してください")
      .optional(),
  ),
  phone: z.preprocess(
    emptyToUndef,
    z.string().trim().max(30).optional(),
  ),
  email: z.preprocess(
    emptyToUndef,
    z.string().trim().email("メールアドレスの形式が正しくありません").optional(),
  ),
  hairType: optionalStr,
  skinType: optionalStr,
  // カンマ/改行区切りの入力を配列へ。空要素は除去。
  allergies: z.preprocess((v) => {
    if (Array.isArray(v)) return v;
    if (typeof v !== "string") return v;
    const arr = v
      .split(/[,;\n、]/)
      .map((s) => s.trim())
      .filter(Boolean);
    return arr.length ? arr : undefined;
  }, z.array(z.string().max(100)).max(50).optional()),
  preferences: optionalStr,
  notes: optionalStr,
  preferredStaffId: optionalStr,
  consentToContact: z.preprocess(
    (v) => v === "on" || v === "true" || v === true,
    z.boolean(),
  ),
});

export type CustomerInput = z.infer<typeof customerInputSchema>;

// 施術履歴（来店）入力スキーマ（M1 / FR-M1-07）。
export const visitInputSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "来店日は YYYY-MM-DD 形式で入力してください"),
  menu: optionalStr,
  staffId: optionalStr,
  memo: optionalStr,
});

export type VisitInput = z.infer<typeof visitInputSchema>;

// 会計（売上）入力スキーマ（M2 / FR-M2-01〜03）。
export const paymentMethods = ["cash", "card", "emoney", "other"] as const;
export const itemTypes = ["service", "product"] as const;

export const saleItemSchema = z.object({
  itemType: z.enum(itemTypes),
  name: z.string().trim().min(1, "品目名は必須です").max(100),
  unitPrice: z.coerce.number().int().min(0, "単価は0以上"),
  quantity: z.coerce.number().int().min(1, "数量は1以上").default(1),
  lineDiscount: z.coerce.number().int().min(0).default(0),
});

export const saleInputSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "会計日は YYYY-MM-DD 形式で入力してください"),
  paymentMethod: z.preprocess(emptyToUndef, z.enum(paymentMethods).optional()),
  staffId: optionalStr,
  discountAmount: z.coerce.number().int().min(0).default(0),
  taxAmount: z.preprocess(emptyToUndef, z.coerce.number().int().min(0).optional()),
  // クライアントから JSON 文字列で渡る明細配列をパースして検証する。
  items: z.preprocess((v) => {
    if (typeof v === "string") {
      try {
        return JSON.parse(v);
      } catch {
        return v;
      }
    }
    return v;
  }, z.array(saleItemSchema).min(1, "明細を1件以上入力してください").max(50)),
});

export type SaleInput = z.infer<typeof saleInputSchema>;

/** FormData → プレーンオブジェクト（チェックボックス未送信は false 既定で補完）。 */
export function formToObject(formData: FormData): Record<string, unknown> {
  const obj: Record<string, unknown> = {};
  for (const [k, v] of formData.entries()) {
    if (k.startsWith("$")) continue; // Next.js のアクション内部フィールドを除外
    obj[k] = v;
  }
  return obj;
}
