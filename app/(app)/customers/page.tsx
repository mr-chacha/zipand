import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { GatedLink } from "@/components/office-gate";
import { PageHeader } from "@/components/page-header";
import { buttonVariants } from "@/components/ui/button";
import { getSession } from "@/lib/auth";
import { getOfficeGate } from "@/lib/office-gate";
import { CustomerList } from "./customer-list";

export const metadata: Metadata = { title: "고객 및 상담" };

export default async function CustomersPage({ searchParams }: PageProps<"/customers">) {
  const { q } = await searchParams;
  const query = typeof q === "string" ? q.trim() : "";
  const { supabase } = await getSession();
  const gate = await getOfficeGate();
  const { data } = await supabase
    .from("customers")
    .select(
      "id, name, phone, deal_type, regions, budget_min, budget_max, move_in_date, status, updated_at, manager:profiles!customers_manager_id_fkey(name), customer_properties(count), consultations(count)"
    )
    .order("updated_at", { ascending: false });

  const customers = (data ?? []).map(({ manager, customer_properties, consultations, ...c }) => ({
    ...c,
    managerName: manager?.name ?? null,
    propertyCount: customer_properties[0]?.count ?? 0,
    consultationCount: consultations[0]?.count ?? 0,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="고객 및 상담"
        description="고객 조건과 상담 이력을 기록하고, 후속 연락과 추천 매물을 관리해요."
        actions={
          <GatedLink href="/customers/new" kind="customer" blocked={gate.blocked.customer} isOwner={gate.isOwner} className={buttonVariants()}>
            <Plus data-icon="inline-start" />
            고객 등록
          </GatedLink>
        }
      />
      <CustomerList key={query} customers={customers} initialQuery={query} />
    </div>
  );
}
