/**
 * メニュー区分（Category マスタ）管理。Node 専用。
 */
import "server-only";
import { prisma } from "@/lib/prisma";

export const DEFAULT_CATEGORIES = ["施術", "サロンケア物販", "ホームケア物販", "会費"];

export async function listCategories() {
  return prisma.category.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
}

export async function countCategories() {
  return prisma.category.count({ where: { isActive: true } });
}

/** 区分が一度も作られていなければ既定4種を投入（冪等・初回のみ）。 */
export async function ensureDefaultCategories() {
  const total = await prisma.category.count();
  if (total > 0) return;
  for (let i = 0; i < DEFAULT_CATEGORIES.length; i++) {
    await prisma.category.create({ data: { name: DEFAULT_CATEGORIES[i], sortOrder: i } });
  }
}

export async function createCategory(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return;
  const exists = await prisma.category.findUnique({ where: { name: trimmed } });
  if (exists) {
    if (!exists.isActive) await prisma.category.update({ where: { id: exists.id }, data: { isActive: true } });
    return;
  }
  const max = await prisma.category.aggregate({ _max: { sortOrder: true } });
  await prisma.category.create({ data: { name: trimmed, sortOrder: (max._max.sortOrder ?? 0) + 1 } });
}

export async function updateCategory(id: string, name: string) {
  return prisma.category.update({ where: { id }, data: { name: name.trim() } });
}

export async function deleteCategory(id: string) {
  return prisma.category.update({ where: { id }, data: { isActive: false } });
}
