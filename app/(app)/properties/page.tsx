import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { GatedLink } from "@/components/office-gate";
import { PageHeader } from "@/components/page-header";
import { buttonVariants } from "@/components/ui/button";
import { getOfficeGate } from "@/lib/office-gate";
import { getPropertyList } from "@/lib/queries";
import { PropertyList } from "./property-list";

export const metadata: Metadata = { title: "매물 관리" };

export default async function PropertiesPage({ searchParams }: PageProps<"/properties">) {
  const { q } = await searchParams;
  const query = typeof q === "string" ? q.trim() : "";
  const [properties, gate] = await Promise.all([getPropertyList(), getOfficeGate()]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="매물 관리"
        description={`전체 ${properties.length}개 매물`}
        actions={
          <GatedLink href="/properties/new" kind="property" blocked={gate.blocked.property} isOwner={gate.isOwner} className={buttonVariants()}>
            <Plus data-icon="inline-start" />
            매물 등록
          </GatedLink>
        }
      />
      <PropertyList key={query} properties={properties} initialQuery={query} />
    </div>
  );
}
