import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { getCustomerById, listActiveStaff } from "@/lib/customers";
import { CustomerForm, type CustomerFormDefaults } from "@/components/CustomerForm";
import { toDateInputValue } from "@/lib/format";
import { updateCustomerAction } from "../../actions";

export const dynamic = "force-dynamic";

export default async function EditCustomerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAuth();
  const { id } = await params;
  const [customer, staff] = await Promise.all([getCustomerById(id), listActiveStaff()]);
  if (!customer) notFound();

  const defaults: CustomerFormDefaults = {
    name: customer.name,
    nameKana: customer.nameKana ?? undefined,
    gender: customer.gender ?? undefined,
    birthday: toDateInputValue(customer.birthday),
    phone: customer.phone ?? undefined,
    email: customer.email ?? undefined,
    hairType: customer.hairType ?? undefined,
    skinType: customer.skinType ?? undefined,
    allergies: customer.allergiesList.join(", "),
    preferences: customer.preferences ?? undefined,
    notes: customer.notes ?? undefined,
    preferredStaffId: customer.preferredStaffId ?? undefined,
    consentToContact: customer.consentToContact,
  };

  const boundUpdate = updateCustomerAction.bind(null, id);

  return (
    <div className="mx-auto max-w-3xl">
      <nav className="mb-4 text-sm text-zinc-500">
        <Link href="/customers" className="hover:underline">
          顧客カルテ
        </Link>
        <span className="mx-1">/</span>
        <Link href={`/customers/${id}`} className="hover:underline">
          {customer.name}
        </Link>
        <span className="mx-1">/</span>編集
      </nav>
      <h1 className="mb-6 text-2xl font-bold text-zinc-900">顧客情報の編集</h1>
      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <CustomerForm
          action={boundUpdate}
          staff={staff}
          defaultValues={defaults}
          submitLabel="更新"
          cancelHref={`/customers/${id}`}
        />
      </div>
    </div>
  );
}
