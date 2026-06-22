/**
 * 顧客ドメインサービス（M1）。Node 専用（暗号化に node:crypto を使用）。
 *  - phone / email は保存時暗号化（FR-M1-02 / AC-M1-5）。一覧では復号しない（詳細でのみ復号）。
 *  - allergies は JSON 文字列配列で保持（SQLite）。
 */
import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { encrypt, decrypt } from "@/lib/crypto";
import { computePersistentStatus } from "@/lib/customer-status";
import { computeCycle } from "@/lib/cycle";
import type { CustomerInput } from "@/lib/validation";

function encField(v: string | undefined | null): string | null {
  if (v === undefined || v === null || v === "") return null;
  return encrypt(v);
}

/** 暗号文（v1:…）なら復号、平文ならそのまま返す（移行耐性）。 */
function decField(v: string | null): string | null {
  if (!v) return null;
  if (v.startsWith("v1:")) {
    try {
      return decrypt(v);
    } catch {
      return null; // 鍵不一致/破損時は表示しない（例外を投げない）
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

export type CustomerListParams = {
  q?: string;
  status?: "new" | "repeat" | "dormant";
  sort?: string;
  visitMin?: number;
  visitMax?: number;
  lastFrom?: Date;
  lastTo?: Date;
  salesMin?: number;
  salesMax?: number;
  avgMin?: number;
  avgMax?: number;
  consent?: "yes" | "no";
  page?: number;
  pageSize?: number;
};

export async function listCustomers(params: CustomerListParams = {}) {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20));

  // DB で絞れる条件（状態・検索・来店回数・最終来店・累計売上・連絡同意）。
  const where: Prisma.CustomerWhereInput = { deletedAt: null };
  if (params.q && params.q.trim()) {
    const q = params.q.trim();
    where.OR = [{ name: { contains: q } }, { nameKana: { contains: q } }];
  }
  if (params.status) where.status = params.status;
  if (params.consent === "yes") where.consentToContact = true;
  else if (params.consent === "no") where.consentToContact = false;
  if (params.visitMin != null || params.visitMax != null) {
    where.visitCount = {
      ...(params.visitMin != null ? { gte: params.visitMin } : {}),
      ...(params.visitMax != null ? { lte: params.visitMax } : {}),
    };
  }
  if (params.salesMin != null || params.salesMax != null) {
    where.totalSales = {
      ...(params.salesMin != null ? { gte: params.salesMin } : {}),
      ...(params.salesMax != null ? { lte: params.salesMax } : {}),
    };
  }
  if (params.lastFrom || params.lastTo) {
    where.lastVisitDate = {
      ...(params.lastFrom ? { gte: params.lastFrom } : {}),
      ...(params.lastTo ? { lte: params.lastTo } : {}),
    };
  }

  // 平均売上単価は計算列のため、絞り込み後の全件を取得して in-memory で評価/整列/分頁する。
  const all = await prisma.customer.findMany({
    where,
    select: {
      id: true,
      name: true,
      nameKana: true,
      status: true,
      visitCount: true,
      lastVisitDate: true,
      avgVisitIntervalDays: true,
      totalSales: true,
      consentToContact: true,
    },
  });

  let list = all.map((c) => ({
    ...c,
    avgSpend: c.visitCount > 0 ? Math.round(c.totalSales / c.visitCount) : 0,
  }));
  if (params.avgMin != null) list = list.filter((c) => c.avgSpend >= params.avgMin!);
  if (params.avgMax != null) list = list.filter((c) => c.avgSpend <= params.avgMax!);

  const cmpDate = (a: Date | null, b: Date | null, dir: 1 | -1) => {
    const av = a ? a.getTime() : null;
    const bv = b ? b.getTime() : null;
    if (av === null && bv === null) return 0;
    if (av === null) return 1; // 未来店は常に末尾
    if (bv === null) return -1;
    return (av - bv) * dir;
  };
  const sort = params.sort ?? "last_desc";
  list.sort((a, b) => {
    switch (sort) {
      case "kana":
        return (a.nameKana ?? a.name).localeCompare(b.nameKana ?? b.name, "ja");
      case "visit_asc":
        return a.visitCount - b.visitCount;
      case "visit_desc":
        return b.visitCount - a.visitCount;
      case "last_asc":
        return cmpDate(a.lastVisitDate, b.lastVisitDate, 1);
      case "sales_asc":
        return a.totalSales - b.totalSales;
      case "sales_desc":
        return b.totalSales - a.totalSales;
      case "avg_asc":
        return a.avgSpend - b.avgSpend;
      case "avg_desc":
        return b.avgSpend - a.avgSpend;
      case "last_desc":
      default:
        return cmpDate(a.lastVisitDate, b.lastVisitDate, -1);
    }
  });

  const total = list.length;
  const rows = list.slice((page - 1) * pageSize, page * pageSize);
  return { rows, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function getCustomerById(id: string) {
  const c = await prisma.customer.findFirst({
    where: { id, deletedAt: null },
    include: {
      preferredStaff: { select: { id: true, name: true } },
      visits: {
        orderBy: { date: "desc" },
        take: 50,
        include: { staff: { select: { name: true } } },
      },
    },
  });
  if (!c) return null;
  return {
    ...c,
    phone: decField(c.phone),
    email: decField(c.email),
    allergiesList: parseAllergies(c.allergies),
    hairTypeList: parseAllergies(c.hairType),
    skinTypeList: parseAllergies(c.skinType),
  };
}

/** フォーム入力 → DB 列（暗号化・JSON化）。visitCount 等のキャッシュ列はここでは扱わない。 */
function toData(input: CustomerInput) {
  return {
    name: input.name,
    nameKana: input.nameKana ?? null,
    gender: input.gender ?? null,
    birthday: input.birthday ? new Date(input.birthday + "T00:00:00Z") : null,
    phone: encField(input.phone),
    email: encField(input.email),
    hairType: input.hairType && input.hairType.length ? JSON.stringify(input.hairType) : null,
    skinType: input.skinType && input.skinType.length ? JSON.stringify(input.skinType) : null,
    allergies: input.allergies && input.allergies.length ? JSON.stringify(input.allergies) : null,
    preferences: input.preferences ?? null,
    notes: input.notes ?? null,
    preferredStaffId: input.preferredStaffId ?? null,
    consentToContact: input.consentToContact,
  };
}

export async function createCustomer(input: CustomerInput) {
  return prisma.customer.create({
    data: {
      ...toData(input),
      consentUpdatedAt: input.consentToContact ? new Date() : null,
    },
  });
}

export async function updateCustomer(id: string, input: CustomerInput) {
  const prev = await prisma.customer.findUnique({
    where: { id },
    select: { consentToContact: true },
  });
  const consentChanged = prev && prev.consentToContact !== input.consentToContact;
  return prisma.customer.update({
    where: { id },
    data: {
      ...toData(input),
      ...(consentChanged ? { consentUpdatedAt: new Date() } : {}),
    },
  });
}

export async function softDeleteCustomer(id: string) {
  return prisma.customer.update({ where: { id }, data: { deletedAt: new Date() } });
}

export async function listActiveStaff() {
  return prisma.staff.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
}

/** 予約フォーム等で使う顧客の選択肢（全件・軽量）。 */
export async function listCustomerOptions() {
  return prisma.customer.findMany({
    where: { deletedAt: null },
    orderBy: [{ nameKana: "asc" }, { name: "asc" }],
    select: { id: true, name: true },
  });
}

/** 来店（施術履歴）を追加し、顧客のキャッシュ列（来店回数・最終来店日等）を更新する（FR-M1-07/AC-M1-3）。 */
export async function addVisit(
  customerId: string,
  input: { date: string; menu?: string | null; staffId?: string | null; memo?: string | null },
) {
  const date = new Date(input.date + "T00:00:00Z");
  return prisma.$transaction(async (tx) => {
    await tx.visit.create({
      data: {
        customerId,
        date,
        menu: input.menu ?? null,
        staffId: input.staffId || null,
        memo: input.memo ?? null,
      },
    });
    const visits = await tx.visit.findMany({
      where: { customerId },
      select: { date: true },
      orderBy: { date: "asc" },
    });
    const dates = visits.map((v) => v.date);
    const visitCount = dates.length;
    const lastVisitDate = dates[visitCount - 1] ?? null;
    const firstVisitDate = dates[0] ?? null;
    const cyc = computeCycle(dates, new Date());
    const status = computePersistentStatus({
      visitCount,
      lastVisitDate,
      avgVisitIntervalDays: cyc.avgVisitIntervalDays,
    });
    return tx.customer.update({
      where: { id: customerId },
      data: {
        visitCount,
        lastVisitDate,
        firstVisitDate,
        avgVisitIntervalDays: cyc.avgVisitIntervalDays,
        nextPredictedVisitDate: cyc.nextPredictedVisitDate,
        status,
      },
    });
  });
}
