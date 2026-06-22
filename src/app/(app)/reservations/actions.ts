"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import {
  createReservation,
  getReservation,
  setReservationStatus,
  deleteReservation,
  type ReservationStatus,
} from "@/lib/reservations";
import { createSale } from "@/lib/sales";
import { createCustomer } from "@/lib/customers";
import { reservationInputSchema, saleInputSchema, customerInputSchema, formToObject } from "@/lib/validation";

export type ResFormState = { error?: string; fieldErrors?: Record<string, string> };
export type VisitState = { error?: string; ok?: boolean };
export type QuickCustomerState = { error?: string; created?: { id: string; name: string } };

type Menu = { serviceId?: string; name: string; price: number };

function parseMenus(raw: unknown): Menu[] {
  if (typeof raw !== "string" || !raw) return [];
  try {
    const a = JSON.parse(raw);
    return Array.isArray(a) ? a.filter((m) => m && typeof m.name === "string") : [];
  } catch {
    return [];
  }
}

export async function createReservationAction(
  _prev: ResFormState,
  formData: FormData,
): Promise<ResFormState> {
  await requireAuth();
  const parsed = reservationInputSchema.safeParse(formToObject(formData));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) {
      const k = String(i.path[0] ?? "_");
      if (!fieldErrors[k]) fieldErrors[k] = i.message;
    }
    return { error: "予約内容を確認してください。", fieldErrors };
  }
  const menus = parseMenus(formData.get("menusJson"));
  await createReservation({
    customerId: parsed.data.customerId,
    startAt: new Date(parsed.data.startAt),
    staffId: parsed.data.staffId,
    serviceId: menus[0]?.serviceId ?? null,
    menusJson: menus.length ? JSON.stringify(menus) : null,
    memo: menus.length ? menus.map((m) => m.name).join("・") : (parsed.data.memo ?? null),
  });
  revalidatePath("/reservations");
  revalidatePath("/dashboard");
  return {};
}

// 来店済み確認 → 売上を作成し、予約を done に。
export async function markVisitedAction(
  reservationId: string,
  _prev: VisitState,
  formData: FormData,
): Promise<VisitState> {
  await requireAuth();
  const res = await getReservation(reservationId);
  if (!res) return { error: "予約が見つかりません。" };
  if (res.status === "done") return { error: "すでに来店済みです。" };

  const parsed = saleInputSchema.safeParse({
    date: String(formData.get("date") ?? ""),
    paymentMethod: String(formData.get("paymentMethod") ?? ""),
    staffId: res.staffId ?? "",
    discountAmount: 0,
    items: String(formData.get("items") ?? "[]"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "明細を確認してください。" };
  }

  await createSale(res.customerId, parsed.data);
  await setReservationStatus(reservationId, "done");
  revalidatePath("/reservations");
  revalidatePath("/sales");
  revalidatePath("/dashboard");
  revalidatePath(`/customers/${res.customerId}`);
  return { ok: true };
}

// 予約取り消し（status=cancelled）。来店済みボタンとは別経路。
export async function setReservationStatusAction(
  id: string,
  status: ReservationStatus,
): Promise<void> {
  await requireAuth();
  await setReservationStatus(id, status);
  revalidatePath("/reservations");
}

// 予約自体を削除。
export async function deleteReservationAction(id: string): Promise<void> {
  await requireAuth();
  await deleteReservation(id);
  revalidatePath("/reservations");
}

// 予約追加エリアの「新規登録」ポップアップから顧客を作成。
export async function quickCreateCustomerAction(
  _prev: QuickCustomerState,
  formData: FormData,
): Promise<QuickCustomerState> {
  await requireAuth();
  const parsed = customerInputSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    nameKana: String(formData.get("nameKana") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    consentToContact: "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "氏名を確認してください。" };
  }
  const c = await createCustomer(parsed.data);
  revalidatePath("/reservations");
  return { created: { id: c.id, name: c.name } };
}
