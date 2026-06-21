"use server";

import { redirect } from "next/navigation";
import { clearSession } from "@/lib/auth";

/** ログアウト Server Action（FR-M0-02）。 */
export async function logout(): Promise<void> {
  await clearSession();
  redirect("/login");
}
