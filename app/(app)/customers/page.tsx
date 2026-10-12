import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { buttonVariants } from "@/components/ui/button";
import { getSession } from "@/lib/auth";
import { CustomerList } from "./customer-list";

export const metadata: Metadata = { title: "고객 및 상담" };

export default async function CustomersPage() {
  const { supabase } = await getSession();
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
          <Link href="/customers/new" className={buttonVariants()}>
            <Plus data-icon="inline-start" />
            고객 등록
          </Link>
        }
      />
      <CustomerList customers={customers} />
    </div>
  );
}
