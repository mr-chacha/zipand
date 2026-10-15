import type { Metadata } from "next";
import { OfficeRequiredNotice } from "@/components/office-gate";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { createProperty } from "@/lib/actions/properties";
import { getSession } from "@/lib/auth";
import { getOfficeGate } from "@/lib/office-gate";
import { getOfficeMembers } from "@/lib/queries";
import { PropertyForm } from "../property-form";

export const metadata: Metadata = { title: "매물 등록" };

export default async function NewPropertyPage() {
  const [{ profile, office }, members, gate] = await Promise.all([getSession(), getOfficeMembers(), getOfficeGate()]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="매물 등록"
        description="필수 정보만 먼저 입력하고, 상세 정보는 나중에 보완할 수 있어요."
        backHref="/properties"
        backLabel="매물 목록"
      />
      {gate.blocked.property ? (
        <Card>
          <OfficeRequiredNotice kind="property" isOwner={gate.isOwner} next="/properties/new" />
        </Card>
      ) : (
        <PropertyForm
          action={createProperty}
          members={members}
          currentUserId={profile.id}
          officeId={office.id}
          cancelHref="/properties"
        />
      )}
    </div>
  );
}
