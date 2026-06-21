/**
 * 予約ドメインサービス（M3 / FR-M3-01〜06）。Node 専用。
 * v1 はアプリ内予約のCRUDと、来店サイクル系で使う先の予約有無の判定を提供する。
 */
import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type ReservationInput = {
  customerId: string;
  startAt: Date;
  endAt?: Date | null;
  serviceId?: string | null;
  staffId?: string | null;
  memo?: string | null;
};

export type ReservationStatus = "booked" | "done" | "cancelled" | "noshow";

export async function createReservation(
  input: ReservationInput,
  source: "manual" | "m6_suggestion" | "import" = "manual",
) {
  return prisma.reservation.create({
    data: {
      customerId: input.customerId,
      startAt: input.startAt,
      endAt: input.endAt ?? null,
      serviceId: input.serviceId || null,
      staffId: input.staffId || null,
      memo: input.memo ?? null,
      status: "booked",
      source,
    },
  });
}

export async function setReservationStatus(id: string, status: ReservationStatus) {
  return prisma.reservation.update({ where: { id }, data: { status } });
}

export async function deleteReservation(id: string) {
  return prisma.reservation.delete({ where: { id } });
}

export async function listReservations(opts: { upcomingOnly?: boolean; now?: Date } = {}) {
  const now = opts.now ?? new Date();
  const where: Prisma.ReservationWhereInput = {};
  if (opts.upcomingOnly) {
    where.startAt = { gte: now };
    where.status = "booked";
  }
  return prisma.reservation.findMany({
    where,
    orderBy: { startAt: opts.upcomingOnly ? "asc" : "desc" },
    take: 200,
    include: {
      customer: { select: { id: true, name: true } },
      staff: { select: { name: true } },
    },
  });
}

/** 先の予約有無 / 次回予約日（hasUpcomingReservation / nextReservationDate）。M6 抽出で使用。 */
export async function customerUpcoming(customerId: string, now: Date = new Date()) {
  const r = await prisma.reservation.findFirst({
    where: { customerId, status: "booked", startAt: { gte: now } },
    orderBy: { startAt: "asc" },
    select: { startAt: true },
  });
  return { hasUpcomingReservation: !!r, nextReservationDate: r?.startAt ?? null };
}
