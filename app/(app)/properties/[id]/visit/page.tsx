import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { getProperty, getVisitByProperty, properties } from "@/lib/mock/properties";
import { VisitWorkspace } from "./visit-workspace";

export function generateStaticParams() {
  return properties.map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: PageProps<"/properties/[id]/visit">) {
  const { id } = await params;
  return { title: `임장장 - ${getProperty(id)?.title ?? ""}` };
}

export default async function VisitPage({ params }: PageProps<"/properties/[id]/visit">) {
  const { id } = await params;
  const property = getProperty(id);
  if (!property) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title="스마트 임장장"
        description={`${property.title} · ${property.address}`}
        backHref={`/properties/${id}`}
        backLabel="매물 상세"
      />
      <VisitWorkspace propertyId={id} visit={getVisitByProperty(id)} />
    </div>
  );
}
