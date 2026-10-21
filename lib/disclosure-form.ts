import { asStringRecord } from "@/lib/deal-forms";

/** 계약서 data에서 확인설명서로 옮길 필드 */
const COPY_KEYS = [
  "property_title",
  "property_address",
  "property_type",
  "deal_type",
  "building",
  "unit",
  "land_category",
  "land_area",
  "land_right_type",
  "land_right_ratio",
  "land_right_ratio_den",
  "land_right_ratio_num",
  "building_area",
  "building_structure",
  "building_use",
  "building_year",
  "lessor_name",
  "lessor_phone",
  "lessor_address",
  "lessor_id_type",
  "lessor_id_front",
  "lessor_id_back",
  "lessee_name",
  "lessee_phone",
  "lessee_address",
  "lessee_id_type",
  "lessee_id_front",
  "lessee_id_back",
  "office_name",
  "office_phone",
  "office_address",
  "office_representative",
  "office_registration_no",
  "agent_name",
  "agent_phone",
  "joint_office_name",
  "joint_office_phone",
  "joint_office_address",
  "joint_office_representative",
  "joint_office_registration_no",
  "joint_agent_name",
  "contract_date",
  "amount",
] as const;

function birthFromIdFront(front: string) {
  const d = front.replace(/\D/g, "").slice(0, 6);
  if (d.length !== 6) return "";
  const yy = Number(d.slice(0, 2));
  const century = yy >= 0 && yy <= 30 ? 2000 : 1900;
  return `${century + yy}-${d.slice(2, 4)}-${d.slice(4, 6)}`;
}

/**
 * 확인설명서 기본값에 계약서 값을 덮어쓴다.
 * 소재지·면적·인적사항·사무소·거래금액이 우선 반영된다.
 */
export function mergeContractIntoDisclosure(
  disclosureDefaults: Record<string, string>,
  contractData: Record<string, string> | null | undefined
): Record<string, string> {
  if (!contractData) return disclosureDefaults;
  const src = asStringRecord(contractData);
  const out = { ...disclosureDefaults };
  for (const key of COPY_KEYS) {
    const v = src[key]?.trim();
    if (v) out[key] = v;
  }
  if (!out.lessor_birth && src.lessor_id_front) out.lessor_birth = birthFromIdFront(src.lessor_id_front);
  if (!out.lessee_birth && src.lessee_id_front) out.lessee_birth = birthFromIdFront(src.lessee_id_front);
  if (out.property_type === "아파트") out.housing_type = "공동주택";
  else if (out.property_type && !out.housing_type) out.housing_type = "단독주택";
  if (out.deal_type === "매매") out.trade_type = "매매·교환";
  else if (out.deal_type) out.trade_type = "임대차";
  if (out.building_use === "" && out.property_type) out.building_use = out.property_type;

  const manwon = Number(String(src.amount ?? "").replace(/,/g, ""));
  if (Number.isFinite(manwon) && manwon > 0) {
    out.amount = String(Math.floor(manwon));
    out.deal_amount_won = String(Math.floor(manwon) * 10_000);
    if (!out.fee_base_won) out.fee_base_won = out.deal_amount_won;
  }
  return out;
}

/**
 * 매물 서류·건축HUB 등 패치를 확인설명서에 덮어쓴다.
 * doc_* 체크는 "0"/"1"을 유지하고, 그 외는 비어 있지 않은 값만 반영한다.
 */
export function mergeDisclosurePatch(
  base: Record<string, string>,
  patch: Record<string, string> | null | undefined
): Record<string, string> {
  if (!patch) return base;
  const out = { ...base };
  for (const [k, raw] of Object.entries(patch)) {
    if (typeof raw !== "string") continue;
    if (k.startsWith("doc_") && (raw === "0" || raw === "1" || raw === "")) {
      out[k] = raw;
      continue;
    }
    const v = raw.trim();
    if (v) out[k] = v;
  }
  return out;
}
