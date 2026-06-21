/**
 * 売上・購買ドメインサービス（M2）。Node 専用。
 *  - 合計は常にサーバー側で算出（クライアント値を信用しない / FR-M2-03）。
 *    amount = unitPrice*quantity − lineDiscount（0未満は0）
 *    totalAmount = Σ amount − discountAmount（0未満は0、税込）
 *  - 会計確定/削除時に Customer のキャッシュ列（totalSales/lastSaleAmount/retailPurchaseCount）を再計算。
 *  - 派生指標（客単価/LTV/店販比率）は spec-appendix §E / data-model §4.2 に準拠して算出。
 */
import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { SaleInput } from "@/lib/validation";

type Tx = Prisma.TransactionClient;

/** 顧客の売上系キャッシュ列を実データから再計算する。 */
async function recomputeCustomerSalesCache(tx: Tx, customerId: string) {
  const sales = await tx.sale.findMany({
    where: { customerId },
    select: { totalAmount: true, date: true },
    orderBy: { date: "desc" },
  });
  const totalSales = sales.reduce((a, s) => a + s.totalAmount, 0);
  const lastSaleAmount = sales[0]?.totalAmount ?? null;
  const retailPurchaseCount = await tx.saleItem.count({
    where: { itemType: "product", sale: { customerId } },
  });
  await tx.customer.update({
    where: { id: customerId },
    data: { totalSales, lastSaleAmount, retailPurchaseCount },
  });
}

export async function createSale(customerId: string, input: SaleInput) {
  const items = input.items.map((it) => ({
    itemType: it.itemType,
    name: it.name,
    unitPrice: it.unitPrice,
    quantity: it.quantity,
    lineDiscount: it.lineDiscount,
    amount: Math.max(0, it.unitPrice * it.quantity - it.lineDiscount),
  }));
  const itemsTotal = items.reduce((a, i) => a + i.amount, 0);
  const totalAmount = Math.max(0, itemsTotal - input.discountAmount);

  return prisma.$transaction(async (tx) => {
    const sale = await tx.sale.create({
      data: {
        customerId,
        date: new Date(input.date + "T00:00:00Z"),
        totalAmount,
        discountAmount: input.discountAmount,
        taxAmount: input.taxAmount ?? null,
        paymentMethod: input.paymentMethod ?? null,
        staffId: input.staffId || null,
        items: { create: items },
      },
    });
    await recomputeCustomerSalesCache(tx, customerId);
    return sale;
  });
}

export async function deleteSale(customerId: string, saleId: string) {
  return prisma.$transaction(async (tx) => {
    await tx.sale.delete({ where: { id: saleId } }); // SaleItem は onDelete: Cascade
    await recomputeCustomerSalesCache(tx, customerId);
  });
}

export async function listSalesByCustomer(customerId: string) {
  return prisma.sale.findMany({
    where: { customerId },
    orderBy: { date: "desc" },
    include: {
      items: true,
      staff: { select: { name: true } },
    },
  });
}

/** 客単価・LTV・店販比率など派生指標（§E / §4.2）。 */
export async function getCustomerSalesMetrics(customerId: string) {
  const [customer, retailAgg] = await Promise.all([
    prisma.customer.findUnique({
      where: { id: customerId },
      select: { totalSales: true, visitCount: true },
    }),
    prisma.saleItem.aggregate({
      where: { itemType: "product", sale: { customerId } },
      _sum: { amount: true },
    }),
  ]);
  const totalSales = customer?.totalSales ?? 0;
  const visitCount = customer?.visitCount ?? 0;
  const retailSales = retailAgg._sum.amount ?? 0;
  return {
    totalSales,
    avgSpend: visitCount > 0 ? Math.round(totalSales / visitCount) : null, // 客単価（来店回数ベース）
    ltv: totalSales, // 実績LTV（既定）
    retailRatio: totalSales > 0 ? retailSales / totalSales : null, // 店販比率
    retailSales,
  };
}

/** ダッシュボード用：当月の店舗全体売上合計。 */
export async function getCurrentMonthSales(now: Date = new Date()) {
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const agg = await prisma.sale.aggregate({
    where: { date: { gte: start, lt: end } },
    _sum: { totalAmount: true },
  });
  return agg._sum.totalAmount ?? 0;
}
