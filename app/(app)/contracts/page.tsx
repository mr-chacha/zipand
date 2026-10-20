import type { Metadata } from "next";
import { Suspense } from "react";
import type { WriteDealOption, WritePropertyOption } from "@/components/deal-forms/contract-write-dialog";
import { DocumentsTable, type DocumentRow } from "@/components/deal-forms/documents-table";
import { PageHeader } from "@/components/page-header";
import { isAppRequest } from "@/lib/app-mode";
import { getSession } from "@/lib/auth";
import { asStringRecord, type DealFormKind } from "@/lib/deal-forms";
import { mergeDocFormExtras } from "@/lib/doc-extract/form-extras";
import { signedUrls } from "@/lib/storage";

export const metadata: Metadata = { title: "계약관리" };

export default async function ContractsPage() {
  const [{ supabase, profile, office }, isApp] = await Promise.all([getSession(), isAppRequest()]);

  const [{ data: forms }, { data: deals }, { data: propertyRows }, guaranteeUrls] = await Promise.all([
    supabase
      .from("deal_forms")
      .select("id, deal_id, kind, title, status, data, created_at")
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
      .select("id, title, address, property_type, deal_type, area_m2, price, monthly_rent, building, unit, structure, main_use")
      .order("updated_at", { ascending: false })
      .limit(200),
    office.guarantee_certificate_path
      ? signedUrls(supabase, "office-docs", [office.guarantee_certificate_path])
      : Promise.resolve({} as Record<string, string>),
  ]);

  const guaranteeUrl = office.guarantee_certificate_path
    ? (guaranteeUrls[office.guarantee_certificate_path] ?? null)
    : null;
  const guaranteeCertificate =
    guaranteeUrl && office.guarantee_certificate_path
      ? { url: guaranteeUrl, fileName: office.guarantee_certificate_name || "공제증서.pdf" }
      : null;

  const propertyIds = (propertyRows ?? []).map((p) => p.id);
  const { data: propertyDocs } =
    propertyIds.length > 0
      ? await supabase
          .from("documents")
          .select("property_id, doc_type, created_at, document_fields(label, value)")
          .in("property_id", propertyIds)
          .order("created_at", { ascending: false })
      : { data: [] as { property_id: string; doc_type: string; created_at: string; document_fields: { label: string; value: string }[] | null }[] };

  const extrasByProperty = new Map<string, ReturnType<typeof mergeDocFormExtras>>();
  for (const pid of propertyIds) {
    const docs = (propertyDocs ?? []).filter((d) => d.property_id === pid);
    extrasByProperty.set(pid, mergeDocFormExtras(docs));
  }

  const list = (forms ?? []).filter((f) => (isApp ? f.status === "finalized" : true));

  const rows: DocumentRow[] = list.map((f) => {
    const d = asStringRecord(f.data);
    return {
      id: f.id,
      dealId: f.deal_id ?? null,
      kind: f.kind as DealFormKind,
      title: f.title,
      status: f.status as "draft" | "finalized",
      contractDate: d.contract_date || d.paid_at || "",
      expiryDate: d.expiry_date || "",
      interim1: d.interim_payment_1 || "",
      interim2: d.interim_payment_2 || "",
      balanceDate: d.balance_date || "",
      amount: d.amount || "",
      monthlyRent: d.monthly_rent || "",
      dealType: d.deal_type || "",
      propertyType: d.property_type || "",
      lessorName: d.lessor_name || d.payee_name || "",
      lessorPhone: d.lessor_phone || "",
      lesseeName: d.lessee_name || d.payer_name || "",
      lesseePhone: d.lessee_phone || "",
      memo: d.memo || d.note || "",
      address: d.property_address || "",
      building: d.building || "",
      unit: d.unit || "",
      completed: d.completed || (f.status === "finalized" ? "완료" : ""),
      senderName: d.sender_name || "",
      receiverName: d.receiver_name || "",
      contractNo: d.contract_no || f.id.replace(/-/g, "").slice(0, 8),
    };
  });

  /** 거래별 최신 계약서 data (확인설명서 작성 시 소재지·면적·인적사항) */
  const contractByDeal = new Map<string, Record<string, string>>();
  for (const f of forms ?? []) {
    if (f.kind !== "contract" || !f.deal_id || contractByDeal.has(f.deal_id)) continue;
    contractByDeal.set(f.deal_id, asStringRecord(f.data));
  }

  const dealOptions: WriteDealOption[] = (deals ?? []).map((deal) => {
    const property = Array.isArray(deal.property) ? deal.property[0] : deal.property;
    const customer = Array.isArray(deal.customer) ? deal.customer[0] : deal.customer;
    const label = [property?.title, customer?.name, property?.deal_type, deal.stage].filter(Boolean).join(" · ");
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

  const writePropertyOptions: WritePropertyOption[] = (propertyRows ?? []).map((p) => {
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="계약관리"
        description={
          isApp
            ? "확정된 계약서를 확인하고 임대인·임차인에게 공유해요."
            : "계약서 작성으로 초안을 만들고, 아래 목록에서 조회·인쇄·삭제할 수 있어요."
        }
      />

      <Suspense fallback={null}>
        <DocumentsTable
          rows={rows}
          deals={dealOptions}
          office={{
            officeName: office.name,
            officePhone: office.phone,
            officeAddress: office.address,
            officeRepresentative: office.representative,
            officeRegistrationNo: office.registration_no,
            agentName: profile.name,
            agentPhone: profile.phone,
          }}
          guaranteeCertificate={guaranteeCertificate}
          properties={(propertyRows ?? []).map((p) => ({
            value: p.id,
            label: [p.title, p.address].filter(Boolean).join(" · ") || p.id.slice(0, 8),
            address: p.address ?? "",
          }))}
          writeProperties={writePropertyOptions}
        />
      </Suspense>
    </div>
  );
}
