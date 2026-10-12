import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { buttonVariants } from "@/components/ui/button";
import { getPropertyList } from "@/lib/queries";
import { PropertyList } from "./property-list";

export const metadata: Metadata = { title: "매물 관리" };

export default async function PropertiesPage({ searchParams }: PageProps<"/properties">) {
  const { q } = await searchParams;
  const query = typeof q === "string" ? q.trim() : "";
  const properties = await getPropertyList();

  return (
    <div className="space-y-6">
      <PageHeader
        title="매물 관리"
        description={`전체 ${properties.length}개 매물`}
        actions={
          <Link href="/properties/new" className={buttonVariants()}>
            <Plus data-icon="inline-start" />
            매물 등록
          </Link>
        }
      />
      <PropertyList key={query} properties={properties} initialQuery={query} />
    </div>
  );
}
