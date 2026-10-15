import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { getSession } from "@/lib/auth";
import { isPast } from "@/lib/format";
import { gateFor } from "@/lib/office-gate";
import { getPropertyList } from "@/lib/queries";
import { ListBuilder } from "./list-builder";

export const metadata: Metadata = { title: "매물 리스트 공유" };

export default async function PropertyShareListPage({ searchParams }: PageProps<"/properties/share">) {
  const { customer } = await searchParams;
  const { supabase } = await getSession();

  const [properties, customers, lists, gate] = await Promise.all([
    getPropertyList(),
    supabase
      .from("customers")
      .select("id, name, deal_type, regions, budget_min, budget_max")
      .order("updated_at", { ascending: false }),
    supabase
      .from("property_lists")
      .select("id, title, token, expires_at, view_count, created_at, customer:customers(name), property_list_items(count)")
      .order("created_at", { ascending: false })
      .limit(30),
    gateFor("briefing"),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="매물 리스트 공유"
        description="고객 조건에 맞는 매물을 골라 리스트를 만들고, 링크 하나로 보내요. 상세 주소·내부 메모·연락처는 포함되지 않아요."
        backHref="/properties"
        backLabel="매물 관리"
      />
      <ListBuilder
        properties={properties}
        customers={customers.data ?? []}
        defaultCustomerId={typeof customer === "string" ? customer : null}
        lists={(lists.data ?? []).map(({ customer: c, property_list_items, ...l }) => ({
          ...l,
          customerName: c?.name ?? null,
          count: property_list_items[0]?.count ?? 0,
          expired: isPast(l.expires_at),
        }))}
        siteUrl={process.env.NEXT_PUBLIC_SITE_URL ?? ""}
        gate={gate}
      />
    </div>
  );
}
