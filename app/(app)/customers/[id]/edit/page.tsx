import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { updateCustomer } from "@/lib/actions/customers";
import { getSession } from "@/lib/auth";
import { getOfficeMembers } from "@/lib/queries";
import { CustomerForm } from "../../customer-form";

export const metadata: Metadata = { title: "고객 수정" };

export default async function EditCustomerPage({ params }: PageProps<"/customers/[id]/edit">) {
  const { id } = await params;
  const { supabase, profile } = await getSession();
  const [{ data: customer }, members] = await Promise.all([
    supabase.from("customers").select("*").eq("id", id).maybeSingle(),
    getOfficeMembers(),
  ]);
  if (!customer) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="고객 수정" backHref={`/customers/${id}`} backLabel={customer.name} />
      <CustomerForm
        action={updateCustomer.bind(null, id)}
        members={members}
        defaultValues={customer}
        currentUserId={profile.id}
        cancelHref={`/customers/${id}`}
      />
    </div>
  );
}
