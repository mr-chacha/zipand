import "server-only";
import { cache } from "react";
import { getSession } from "@/lib/auth";

export type GateKind = "property" | "customer" | "document" | "deal";

export interface OfficeGate {
  registered: boolean;
  isOwner: boolean;
  blocked: Record<GateKind, boolean>;
}

/** 사무소 등록 전 제한: 매물·고객 1건까지, 문서·계약은 불가. DB 트리거(enforce_office_registration)와 같은 규칙 */
export const getOfficeGate = cache(async (): Promise<OfficeGate> => {
  const { supabase, profile, office } = await getSession();
  const registered = office.registered_at !== null;
  const isOwner = profile.role === "owner";
  if (registered) {
    return { registered, isOwner, blocked: { property: false, customer: false, document: false, deal: false } };
  }
  const [properties, customers] = await Promise.all([
    supabase.from("properties").select("id", { count: "exact", head: true }),
    supabase.from("customers").select("id", { count: "exact", head: true }),
  ]);
  return {
    registered,
    isOwner,
    blocked: {
      property: (properties.count ?? 0) >= 1,
      customer: (customers.count ?? 0) >= 1,
      document: true,
      deal: true,
    },
  };
});
