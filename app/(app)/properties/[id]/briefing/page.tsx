import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { currentUser } from "@/lib/mock/dashboard";
import { getProperty, getVisitByProperty, properties } from "@/lib/mock/properties";
import { BriefingBuilder } from "./briefing-builder";

export function generateStaticParams() {
  return properties.map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: PageProps<"/properties/[id]/briefing">) {
  const { id } = await params;
  return { title: `고객 브리핑 - ${getProperty(id)?.title ?? ""}` };
}

export default async function BriefingPage({ params }: PageProps<"/properties/[id]/briefing">) {
  const { id } = await params;
  const property = getProperty(id);
  if (!property) notFound();

  const followUps = getVisitByProperty(id)?.followUps ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="고객 브리핑"
        description="고객에게 보낼 매물 소개 자료를 만들어요. 내부 메모와 개인정보는 포함되지 않아요."
        backHref={`/properties/${id}`}
        backLabel="매물 상세"
      />
      <BriefingBuilder
        property={property}
        followUps={followUps}
        broker={{ name: currentUser.name, office: currentUser.office, phone: "02-000-0000" }}
      />
    </div>
  );
}
