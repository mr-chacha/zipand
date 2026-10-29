import type { WriteDealOption, WritePropertyOption } from "@/components/deal-forms/contract-write-dialog";
import type { RelatedFormsOfficeDefaults } from "@/components/deal-forms/related-forms-dialog";
import { asStringRecord } from "@/lib/deal-forms";
import { mergeDocFormExtras } from "@/lib/doc-extract/form-extras";
import { getSession } from "@/lib/auth";

/** 계약서 작성 창에 필요한 매물·거래·사무소 옵션 */
export async function loadContractWriteOptions() {
  const { supabase, profile, office } = await getSession();

  const [{ data: forms }, { data: deals }, { data: propertyRows }] = await Promise.all([
    supabase
      .from("deal_forms")
      .select("id, deal_id, kind, title, status, data, created_at")
      .eq("kind", "contract")
      .order("created_at", { ascending: false }),
    supabase
      .from("deals")
      .select(
        "id, property_id, stage, amount, monthly_rent, down_payment, balance_date, contract_date, move_in_date, lessor_name, lessor_phone, lessor_account, lessee_name, lessee_phone, terms_note, property:properties(id, title, address, property_type, deal_type, area_m2, building, unit, structure, main_use), customer:customers(name)"
      )
      .neq("stage", "취소")
      .order("updated_at", { ascending: false }),
    supabase
      .from("properties")
      .select(
        "id, title, address, property_type, deal_type, area_m2, price, monthly_rent, building, unit, structure, main_use"
      )
      .order("updated_at", { ascending: false })
      .limit(200),
  ]);

  const propertyIds = (propertyRows ?? []).map((p) => p.id);
  const { data: propertyDocs } =
    propertyIds.length > 0
      ? await supabase
          .from("documents")
          .select("property_id, doc_type, created_at, document_fields(label, value)")
          .in("property_id", propertyIds)
          .order("created_at", { ascending: false })
      : {
          data: [] as {
            property_id: string;
            doc_type: string;
            created_at: string;
            document_fields: { label: string; value: string }[] | null;
          }[],
        };

  const extrasByProperty = new Map<string, ReturnType<typeof mergeDocFormExtras>>();
  for (const pid of propertyIds) {
    const docs = (propertyDocs ?? []).filter((d) => d.property_id === pid);
    extrasByProperty.set(pid, mergeDocFormExtras(docs));
  }

  const contractByDeal = new Map<string, Record<string, string>>();
  for (const f of forms ?? []) {
    if (!f.deal_id || contractByDeal.has(f.deal_id)) continue;
    contractByDeal.set(f.deal_id, asStringRecord(f.data));
  }

  const officeDefaults: RelatedFormsOfficeDefaults = {
    officeName: office.name,
    officePhone: office.phone,
    officeAddress: office.address,
    officeRepresentative: office.representative,
    officeRegistrationNo: office.registration_no,
    agentName: profile.name,
    agentPhone: profile.phone,
  };

  const dealsOptions: WriteDealOption[] = (deals ?? []).map((deal) => {
    const property = Array.isArray(deal.property) ? deal.property[0] : deal.property;
    const customer = Array.isArray(deal.customer) ? deal.customer[0] : deal.customer;
    const label = [property?.title, customer?.name, property?.deal_type, deal.stage]
      .filter(Boolean)
      .join(" · ");
    const pid = deal.property_id ?? property?.id ?? "";
    const extras = pid ? extrasByProperty.get(pid) : undefined;
    const areaFromProp = property?.area_m2 != null ? String(property.area_m2) : null;
    return {
      value: deal.id,
      label: label || deal.id.slice(0, 8),
      propertyType: property?.property_type ?? "",
      dealType: property?.deal_type ?? "",
      propertyId: deal.property_id ?? property?.id,
      contractData: contractByDeal.get(deal.id),
      prefill: {
        dealType: property?.deal_type ?? "",
        propertyTitle: property?.title ?? "",
        propertyAddress: property?.address ?? "",
        propertyType: property?.property_type ?? "",
        building: property?.building ?? null,
        unit: property?.unit ?? null,
        buildingArea: extras?.buildingArea ?? areaFromProp,
        buildingStructure: extras?.buildingStructure ?? property?.structure ?? null,
        buildingUse: extras?.buildingUse ?? property?.main_use ?? null,
        landArea: extras?.landArea ?? null,
        landCategory: extras?.landCategory ?? null,
        landPricePerM2: extras?.landPricePerM2 ?? null,
        buildingCoverage: extras?.buildingCoverage ?? null,
        floorAreaRatio: extras?.floorAreaRatio ?? null,
        archArea: extras?.archArea ?? null,
        totalFloorArea: extras?.totalFloorArea ?? null,
        amount: deal.amount,
        monthlyRent: deal.monthly_rent,
        downPayment: deal.down_payment,
        balanceDate: deal.balance_date,
        contractDate: deal.contract_date,
        moveInDate: deal.move_in_date,
        lessorName: deal.lessor_name,
        lessorPhone: deal.lessor_phone,
        lessorAccount: deal.lessor_account,
        lesseeName: deal.lessee_name,
        lesseePhone: deal.lessee_phone,
        termsNote: deal.terms_note,
        clauses: [],
        officeName: office.name,
        officePhone: office.phone,
        officeAddress: office.address,
        officeRepresentative: office.representative,
        officeRegistrationNo: office.registration_no,
        agentName: profile.name,
        agentPhone: profile.phone,
      },
    };
  });

  const properties: WritePropertyOption[] = (propertyRows ?? []).map((p) => {
    const extras = extrasByProperty.get(p.id);
    const areaFromProp = p.area_m2 != null ? String(p.area_m2) : null;
    return {
      value: p.id,
      label:
        [
          p.title,
          [p.address, p.building?.trim() && `${p.building.trim()}동`, p.unit?.trim() && `${p.unit.trim()}호`]
            .filter(Boolean)
            .join(" "),
        ]
          .filter(Boolean)
          .join(" · ") || p.id.slice(0, 8),
      propertyType: p.property_type ?? "",
      dealType: p.deal_type ?? "",
      prefill: {
        dealType: p.deal_type ?? "",
        propertyTitle: p.title ?? "",
        propertyAddress: p.address ?? "",
        propertyType: p.property_type ?? "",
        building: p.building,
        unit: p.unit,
        buildingArea: extras?.buildingArea ?? areaFromProp,
        buildingStructure: extras?.buildingStructure ?? p.structure ?? null,
        buildingUse: extras?.buildingUse ?? p.main_use ?? null,
        landArea: extras?.landArea ?? null,
        landCategory: extras?.landCategory ?? null,
        landPricePerM2: extras?.landPricePerM2 ?? null,
        buildingCoverage: extras?.buildingCoverage ?? null,
        floorAreaRatio: extras?.floorAreaRatio ?? null,
        archArea: extras?.archArea ?? null,
        totalFloorArea: extras?.totalFloorArea ?? null,
        amount: p.price,
        monthlyRent: p.monthly_rent,
        downPayment: null,
        balanceDate: null,
        contractDate: null,
        moveInDate: null,
        lessorName: null,
        lessorPhone: null,
        lessorAccount: null,
        lesseeName: null,
        lesseePhone: null,
        termsNote: null,
        clauses: [],
        officeName: office.name,
        officePhone: office.phone,
        officeAddress: office.address,
        officeRepresentative: office.representative,
        officeRegistrationNo: office.registration_no,
        agentName: profile.name,
        agentPhone: profile.phone,
      },
    };
  });

  return { forms: forms ?? [], deals: dealsOptions, properties, office: officeDefaults };
}
