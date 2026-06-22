/**
 * 顧客データの CSV/JSON 入出力（FR-M0-11/12）。Node 専用。
 *  - エクスポートは PII を復号して出力（開示・ポータビリティ用途）。
 *  - インポートは createCustomer/updateCustomer 経由で再暗号化（往復で整合：AC-M0-6）。
 *  - 行単位でバリデーションし、エラー行を報告（AC-M0-7）。
 */
import "server-only";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/crypto";
import { createCustomer, updateCustomer } from "@/lib/customers";
import { customerInputSchema } from "@/lib/validation";
import { toCsv } from "@/lib/csv";
import { toDateInputValue } from "@/lib/format";

export const CUSTOMER_COLUMNS = [
  "id",
  "name",
  "nameKana",
  "gender",
  "birthday",
  "phone",
  "email",
  "hairType",
  "skinType",
  "allergies",
  "preferences",
  "notes",
  "consentToContact",
] as const;

function dec(v: string | null): string {
  if (!v) return "";
  if (v.startsWith("v1:")) {
    try {
      return decrypt(v);
    } catch {
      return "";
    }
  }
  return v;
}

function parseAllergies(v: string | null): string[] {
  if (!v) return [];
  try {
    const arr = JSON.parse(v);
    return Array.isArray(arr) ? arr.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

type ExportRow = {
  id: string;
  name: string;
  nameKana: string;
  gender: string;
  birthday: string;
  phone: string;
  email: string;
  hairType: string[];
  skinType: string[];
  allergies: string[];
  preferences: string;
  notes: string;
  consentToContact: string;
};

async function getExportRows(): Promise<ExportRow[]> {
  const customers = await prisma.customer.findMany({
    where: { deletedAt: null },
    orderBy: { registeredAt: "asc" },
  });
  return customers.map((c) => ({
    id: c.id,
    name: c.name,
    nameKana: c.nameKana ?? "",
    gender: c.gender ?? "",
    birthday: c.birthday ? toDateInputValue(c.birthday) : "",
    phone: dec(c.phone),
    email: dec(c.email),
    hairType: parseAllergies(c.hairType),
    skinType: parseAllergies(c.skinType),
    allergies: parseAllergies(c.allergies),
    preferences: c.preferences ?? "",
    notes: c.notes ?? "",
    consentToContact: c.consentToContact ? "true" : "false",
  }));
}

/** JSON エクスポート（allergies は配列）。 */
export async function exportCustomersJson(): Promise<string> {
  const rows = await getExportRows();
  return JSON.stringify(rows, null, 2);
}

/** CSV エクスポート（複数値項目は ";" 区切り、UTF-8 BOM 付与で Excel 互換）。 */
export async function exportCustomersCsv(): Promise<string> {
  const rows = await getExportRows();
  const flat = rows.map((r) => ({
    ...r,
    hairType: r.hairType.join(";"),
    skinType: r.skinType.join(";"),
    allergies: r.allergies.join(";"),
  }));
  return "﻿" + toCsv([...CUSTOMER_COLUMNS], flat);
}

export type ImportResult = {
  created: number;
  updated: number;
  errors: { row: number; message: string }[];
};

/** レコード配列を取り込み（id 一致は更新、無ければ作成）。 */
export async function importCustomerRecords(
  records: Record<string, unknown>[],
): Promise<ImportResult> {
  const result: ImportResult = { created: 0, updated: 0, errors: [] };

  for (let i = 0; i < records.length; i++) {
    const rec = records[i];
    const rawId = rec.id;
    const id = typeof rawId === "string" && rawId.trim() ? rawId.trim() : undefined;
    const parsed = customerInputSchema.safeParse(rec);
    if (!parsed.success) {
      result.errors.push({
        row: i + 1,
        message: parsed.error.issues
          .map((iss) => `${iss.path.join(".") || "_"}: ${iss.message}`)
          .join("; "),
      });
      continue;
    }
    try {
      if (id) {
        const exists = await prisma.customer.findUnique({ where: { id }, select: { id: true } });
        if (exists) {
          await updateCustomer(id, parsed.data);
          result.updated++;
          continue;
        }
      }
      await createCustomer(parsed.data);
      result.created++;
    } catch (e) {
      result.errors.push({ row: i + 1, message: e instanceof Error ? e.message : String(e) });
    }
  }
  return result;
}
