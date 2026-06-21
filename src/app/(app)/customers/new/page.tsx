import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { listActiveStaff } from "@/lib/customers";
import { CustomerForm } from "@/components/CustomerForm";
import { createCustomerAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewCustomerPage() {
  await requireAuth();
  const staff = await listActiveStaff();

  return (
    <div className="mx-auto max-w-3xl">
      <nav className="mb-4 text-sm text-zinc-500">
        <Link href="/customers" className="hover:underline">
          顧客カルテ
        </Link>
        <span className="mx-1">/</span>新規登録
      </nav>
      <h1 className="mb-6 text-2xl font-bold text-zinc-900">新規顧客登録</h1>
      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <CustomerForm
          action={createCustomerAction}
          staff={staff}
          submitLabel="登録"
          cancelHref="/customers"
        />
      </div>
    </div>
  );
}
