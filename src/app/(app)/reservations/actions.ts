"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import {
  createReservation,
  setReservationStatus,
  deleteReservation,
  type ReservationStatus,
} from "@/lib/reservations";
import { reservationInputSchema, formToObject } from "@/lib/validation";

export type ResFormState = { error?: string; fieldErrors?: Record<string, string> };

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
  await createReservation({
    customerId: parsed.data.customerId,
    startAt: new Date(parsed.data.startAt),
    staffId: parsed.data.staffId,
    memo: parsed.data.memo,
  });
  revalidatePath("/reservations");
  revalidatePath("/dashboard");
  return {};
}

export async function setReservationStatusAction(
  id: string,
  status: ReservationStatus,
): Promise<void> {
  await requireAuth();
  await setReservationStatus(id, status);
  revalidatePath("/reservations");
}

export async function deleteReservationAction(id: string): Promise<void> {
  await requireAuth();
  await deleteReservation(id);
  revalidatePath("/reservations");
}
