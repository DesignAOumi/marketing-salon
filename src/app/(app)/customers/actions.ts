"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import {
  createCustomer,
  updateCustomer,
  softDeleteCustomer,
  addVisit,
} from "@/lib/customers";
import { createSale, deleteSale } from "@/lib/sales";
import {
  customerInputSchema,
  visitInputSchema,
  saleInputSchema,
  formToObject,
} from "@/lib/validation";

export type FormState = { error?: string; fieldErrors?: Record<string, string> };

function collectErrors(issues: { path: (string | number)[]; message: string }[]) {
  const fieldErrors: Record<string, string> = {};
  for (const i of issues) {
    const key = String(i.path[0] ?? "_");
    if (!fieldErrors[key]) fieldErrors[key] = i.message;
  }
  return fieldErrors;
}

export async function createCustomerAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAuth();
  const parsed = customerInputSchema.safeParse(formToObject(formData));
  if (!parsed.success) {
    return { error: "入力内容を確認してください。", fieldErrors: collectErrors(parsed.error.issues) };
  }
  const c = await createCustomer(parsed.data);
  revalidatePath("/customers");
  redirect(`/customers/${c.id}`);
}

export async function updateCustomerAction(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAuth();
  const parsed = customerInputSchema.safeParse(formToObject(formData));
  if (!parsed.success) {
    return { error: "入力内容を確認してください。", fieldErrors: collectErrors(parsed.error.issues) };
  }
  await updateCustomer(id, parsed.data);
  revalidatePath(`/customers/${id}`);
  revalidatePath("/customers");
  redirect(`/customers/${id}`);
}

export async function deleteCustomerAction(id: string): Promise<void> {
  await requireAuth();
  await softDeleteCustomer(id);
  revalidatePath("/customers");
  redirect("/customers");
}

export async function addVisitAction(
  customerId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAuth();
  const parsed = visitInputSchema.safeParse(formToObject(formData));
  if (!parsed.success) {
    return { error: "来店情報を確認してください。", fieldErrors: collectErrors(parsed.error.issues) };
  }
  await addVisit(customerId, parsed.data);
  revalidatePath(`/customers/${customerId}`);
  revalidatePath("/customers");
  return {};
}

export async function createSaleAction(
  customerId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAuth();
  const parsed = saleInputSchema.safeParse(formToObject(formData));
  if (!parsed.success) {
    const fieldErrors = collectErrors(parsed.error.issues);
    return {
      error: fieldErrors.items ?? "会計内容を確認してください。",
      fieldErrors,
    };
  }
  await createSale(customerId, parsed.data);
  revalidatePath(`/customers/${customerId}`);
  revalidatePath("/customers");
  return {};
}

export async function deleteSaleAction(
  customerId: string,
  saleId: string,
): Promise<void> {
  await requireAuth();
  await deleteSale(customerId, saleId);
  revalidatePath(`/customers/${customerId}`);
  revalidatePath("/customers");
}
