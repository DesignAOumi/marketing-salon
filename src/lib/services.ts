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
  durationMin?: number | null;
  defaultCycleDays?: number | null;
}) {
  return prisma.service.create({
    data: {
      name: data.name,
      category: data.category ?? null,
      price: data.price,
      durationMin: data.durationMin ?? null,
      defaultCycleDays: data.defaultCycleDays ?? null,
      isActive: true,
    },
  });
}

export async function deleteService(id: string) {
  // 参照保護のため論理削除（非提供化）
  return prisma.service.update({ where: { id }, data: { isActive: false } });
}

const DEFAULT_MENUS = [
  { name: "カット", category: "cut", price: 4500, durationMin: 60, defaultCycleDays: 35 },
  { name: "カラー", category: "color", price: 7000, durationMin: 90, defaultCycleDays: 42 },
  { name: "パーマ", category: "perm", price: 9000, durationMin: 120, defaultCycleDays: 60 },
  { name: "トリートメント", category: "treatment", price: 3000, durationMin: 30, defaultCycleDays: 30 },
  { name: "ヘッドスパ", category: "spa", price: 4000, durationMin: 40, defaultCycleDays: 30 },
];

/** よくある標準メニューを一括追加（既存の同名はスキップ）。 */
export async function addDefaultServices() {
  for (const m of DEFAULT_MENUS) {
    const exists = await prisma.service.findFirst({ where: { name: m.name } });
    if (!exists) await prisma.service.create({ data: { ...m, isActive: true } });
  }
}
