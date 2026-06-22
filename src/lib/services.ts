/**
 * メニュー（Service マスタ）管理。Node 専用。
 */
import "server-only";
import { prisma } from "@/lib/prisma";

export async function listServices() {
  return prisma.service.findMany({ where: { isActive: true }, orderBy: { createdAt: "asc" } });
}

export async function countServices() {
  return prisma.service.count({ where: { isActive: true } });
}

export async function createService(data: {
  name: string;
  category?: string | null;
  price: number;
  memberPrice?: number | null;
  durationMin?: number | null;
  defaultCycleDays?: number | null;
}) {
  return prisma.service.create({
    data: {
      name: data.name,
      category: data.category ?? null,
      price: data.price,
      memberPrice: data.memberPrice ?? null,
      durationMin: data.durationMin ?? null,
      defaultCycleDays: data.defaultCycleDays ?? null,
      isActive: true,
    },
  });
}

export async function updateService(
  id: string,
  data: {
    name: string;
    category?: string | null;
    price: number;
    memberPrice?: number | null;
    durationMin?: number | null;
    defaultCycleDays?: number | null;
  },
) {
  return prisma.service.update({
    where: { id },
    data: {
      name: data.name,
      category: data.category ?? null,
      price: data.price,
      memberPrice: data.memberPrice ?? null,
      durationMin: data.durationMin ?? null,
      defaultCycleDays: data.defaultCycleDays ?? null,
    },
  });
}

export async function deleteService(id: string) {
  // 参照保護のため論理削除（非提供化）
  return prisma.service.update({ where: { id }, data: { isActive: false } });
}
