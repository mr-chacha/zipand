import type { Metadata } from "next";
import { OfficeRequiredNotice } from "@/components/office-gate";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { createCustomer } from "@/lib/actions/customers";
import { getSession } from "@/lib/auth";
import { getOfficeGate } from "@/lib/office-gate";
import { getOfficeMembers } from "@/lib/queries";
import { CustomerForm } from "../customer-form";

export const metadata: Metadata = { title: "고객 등록" };

export default async function NewCustomerPage() {
  const [{ profile }, members, gate] = await Promise.all([getSession(), getOfficeMembers(), getOfficeGate()]);
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="고객 등록" backHref="/customers" backLabel="고객 및 상담" />
      {gate.blocked.customer ? (
        <Card>
          <OfficeRequiredNotice kind="customer" isOwner={gate.isOwner} next="/customers/new" />
        </Card>
      ) : (
        <CustomerForm action={createCustomer} members={members} currentUserId={profile.id} cancelHref="/customers" />
      )}
    </div>
  );
}
