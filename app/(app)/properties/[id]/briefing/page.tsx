import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { BriefingData } from "@/components/briefing-view";
import { PageHeader } from "@/components/page-header";
import { getSession } from "@/lib/auth";
import { isPast } from "@/lib/format";
import { signedUrls } from "@/lib/storage";
import { BriefingBuilder } from "./briefing-builder";

export const metadata: Metadata = { title: "고객 브리핑" };

export default async function BriefingPage({ params }: PageProps<"/properties/[id]/briefing">) {
  const { id } = await params;
  const { supabase, profile, office } = await getSession();

  const { data: property } = await supabase
    .from("properties")
    .select("*, manager:profiles!properties_manager_id_fkey(name, phone)")
    .eq("id", id)
    .maybeSingle();
  if (!property) notFound();

  const [photos, latestVisit, briefings] = await Promise.all([
    supabase.from("property_photos").select("storage_path").eq("property_id", id).order("sort_order").order("created_at"),
    supabase.from("property_visits").select("follow_ups").eq("property_id", id).order("visited_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("briefings").select("id, token, expires_at, view_count, created_at").eq("property_id", id).order("created_at", { ascending: false }),
  ]);

  const paths = (photos.data ?? []).map((p) => p.storage_path);
  const urls = await signedUrls(supabase, "property-photos", paths);

  const data: BriefingData = {
    property: { ...property, area_m2: property.area_m2 === null ? null : Number(property.area_m2) },
    photoUrls: paths.map((p) => urls[p]).filter(Boolean),
    followUps: latestVisit.data?.follow_ups ?? [],
    office: { name: office.name, phone: office.phone, address: office.address },
    agent: {
      name: property.manager?.name ?? profile.name,
      phone: property.manager?.phone ?? profile.phone,
    },
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="고객 브리핑"
        description="고객에게 보낼 매물 소개 자료를 만들어요. 내부 메모와 개인정보는 포함되지 않아요."
        backHref={`/properties/${id}`}
        backLabel="매물 상세"
      />
      <BriefingBuilder
        propertyId={id}
        data={data}
        defaultComment={property.description ?? ""}
        links={(briefings.data ?? []).map((b) => ({ ...b, expired: isPast(b.expires_at) }))}
        siteUrl={process.env.NEXT_PUBLIC_SITE_URL ?? ""}
      />
    </div>
  );
}
