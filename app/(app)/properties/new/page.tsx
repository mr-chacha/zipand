import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { createProperty } from "@/lib/actions/properties";
import { getSession } from "@/lib/auth";
import { getOfficeMembers } from "@/lib/queries";
import { PropertyForm } from "../property-form";

export const metadata: Metadata = { title: "매물 등록" };

export default async function NewPropertyPage() {
  const [{ profile }, members] = await Promise.all([getSession(), getOfficeMembers()]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="매물 등록"
        description="필수 정보만 먼저 입력하고, 상세 정보는 나중에 보완할 수 있어요."
        backHref="/properties"
        backLabel="매물 목록"
      />
      <PropertyForm action={createProperty} members={members} currentUserId={profile.id} cancelHref="/properties" />
    </div>
  );
}
