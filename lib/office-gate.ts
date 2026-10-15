import "server-only";
import { cache } from "react";
import { getSession } from "@/lib/auth";

export type GateKind = "property" | "customer" | "document" | "deal" | "invite" | "briefing" | "consultation" | "link";

export interface OfficeGate {
  registered: boolean;
  isOwner: boolean;
  blocked: Record<GateKind, boolean>;
}

/**
 * 사무소 등록 전 제한: 매물·고객 1건까지, 문서·계약·구성원 초대·브리핑 공유·상담 기록·고객-매물 연결은 불가.
 * DB 트리거(enforce_office_registration)와 같은 규칙
 */
/** 클라이언트 컴포넌트에 넘길 기능별 제한 정보 */
export async function gateFor(kind: GateKind) {
  const gate = await getOfficeGate();
  return { blocked: gate.blocked[kind], isOwner: gate.isOwner };
}

export const getOfficeGate = cache(async (): Promise<OfficeGate> => {
  const { supabase, profile, office } = await getSession();
  const registered = office.registered_at !== null;
  const isOwner = profile.role === "owner";
  if (registered) {
    return {
      registered,
      isOwner,
      blocked: {
        property: false,
        customer: false,
        document: false,
        deal: false,
        invite: false,
        briefing: false,
        consultation: false,
        link: false,
      },
    };
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
      invite: true,
      briefing: true,
      consultation: true,
      link: true,
    },
  };
});
