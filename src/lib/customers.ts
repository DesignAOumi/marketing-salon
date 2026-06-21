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
  sort?: "recent" | "name" | "registered";
  page?: number;
  pageSize?: number;
};

export async function listCustomers(params: CustomerListParams = {}) {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20));
  const where: Prisma.CustomerWhereInput = { deletedAt: null };

  if (params.q && params.q.trim()) {
    const q = params.q.trim();
    where.OR = [{ name: { contains: q } }, { nameKana: { contains: q } }];
  }
  if (params.status) where.status = params.status;

  // SQLite は orderBy の nulls 指定を未サポート。DESC では NULL（未来店）が末尾に来るため既定で意図どおり。
  const orderBy: Prisma.CustomerOrderByWithRelationInput =
    params.sort === "name"
      ? { nameKana: "asc" }
      : params.sort === "registered"
        ? { registeredAt: "desc" }
        : { lastVisitDate: "desc" };

  const [rows, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
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
    }),
    prisma.customer.count({ where }),
  ]);

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
    hairType: input.hairType ?? null,
    skinType: input.skinType ?? null,
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
    const agg = await tx.visit.aggregate({
      where: { customerId },
      _count: { _all: true },
      _min: { date: true },
      _max: { date: true },
    });
    const visitCount = agg._count._all;
    const lastVisitDate = agg._max.date ?? null;
    const firstVisitDate = agg._min.date ?? null;
    const status = computePersistentStatus({ visitCount, lastVisitDate });
    return tx.customer.update({
      where: { id: customerId },
      data: { visitCount, lastVisitDate, firstVisitDate, status },
    });
  });
}
