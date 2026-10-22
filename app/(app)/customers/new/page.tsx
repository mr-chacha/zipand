import type { Metadata } from "next";
import { OfficeRequiredNotice } from "@/components/office-gate";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { hasAiAccess } from "@/lib/ai/access";
import { getSession } from "@/lib/auth";
import { getOfficeGate } from "@/lib/office-gate";
import { getOfficeMembers } from "@/lib/queries";
import { NewCustomerClient } from "./new-customer-client";

export const metadata: Metadata = { title: "고객 등록" };

export default async function NewCustomerPage() {
  const [{ profile, office }, members, gate] = await Promise.all([getSession(), getOfficeMembers(), getOfficeGate()]);
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="고객 등록" backHref="/customers" backLabel="고객 및 상담" />
      {gate.blocked.customer ? (
        <Card>
          <OfficeRequiredNotice kind="customer" isOwner={gate.isOwner} next="/customers/new" />
        </Card>
      ) : (
        <NewCustomerClient
          officeId={office.id}
          members={members}
          currentUserId={profile.id}
          aiAvailable={hasAiAccess(office)}
        />
      )}
    </div>
  );
}
