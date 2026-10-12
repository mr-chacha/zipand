import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { updateProperty } from "@/lib/actions/properties";
import { getSession } from "@/lib/auth";
import { getOfficeMembers } from "@/lib/queries";
import { PropertyForm } from "../../property-form";

export const metadata: Metadata = { title: "매물 수정" };

export default async function EditPropertyPage({ params }: PageProps<"/properties/[id]/edit">) {
  const { id } = await params;
  const { supabase, profile } = await getSession();
  const [{ data: property }, members] = await Promise.all([
    supabase.from("properties").select("*").eq("id", id).maybeSingle(),
    getOfficeMembers(),
  ]);
  if (!property) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="매물 수정" description={property.title} backHref={`/properties/${id}`} backLabel="매물 상세" />
      <PropertyForm
        action={updateProperty.bind(null, id)}
        members={members}
        defaultValues={property}
        currentUserId={profile.id}
        cancelHref={`/properties/${id}`}
      />
    </div>
  );
}
