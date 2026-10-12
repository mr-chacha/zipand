import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { createCustomer } from "@/lib/actions/customers";
import { getSession } from "@/lib/auth";
import { getOfficeMembers } from "@/lib/queries";
import { CustomerForm } from "../customer-form";

export const metadata: Metadata = { title: "고객 등록" };

export default async function NewCustomerPage() {
  const [{ profile }, members] = await Promise.all([getSession(), getOfficeMembers()]);
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="고객 등록" backHref="/customers" backLabel="고객 및 상담" />
      <CustomerForm action={createCustomer} members={members} currentUserId={profile.id} cancelHref="/customers" />
    </div>
  );
}
