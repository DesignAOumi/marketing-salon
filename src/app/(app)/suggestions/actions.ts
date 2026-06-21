"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { createReservation } from "@/lib/reservations";

/** M6 ワンクリック予約案作成（source=m6_suggestion）。FR-M6-04。 */
export async function createSuggestionReservationAction(
  customerId: string,
  isoDate: string,
): Promise<void> {
  await requireAuth();
  const startAt = new Date(`${isoDate}T10:00:00`); // 予測日の10:00を既定案とする
  await createReservation(
    { customerId, startAt, memo: "再来店サイクル提案（M6）" },
    "m6_suggestion",
  );
  revalidatePath("/suggestions");
  revalidatePath("/reservations");
  redirect("/reservations");
}
