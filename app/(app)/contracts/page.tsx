import type { Metadata } from "next";
import { Suspense } from "react";
import type { WriteDealOption } from "@/components/deal-forms/contract-write-dialog";
import { DocumentsTable, type DocumentRow } from "@/components/deal-forms/documents-table";
import { PageHeader } from "@/components/page-header";
import { isAppRequest } from "@/lib/app-mode";
import { getSession } from "@/lib/auth";
import { asStringRecord, type DealFormKind } from "@/lib/deal-forms";
import { signedUrls } from "@/lib/storage";

export const metadata: Metadata = { title: "계약관리" };

export default async function ContractsPage() {
  const [{ supabase, profile, office }, isApp] = await Promise.all([getSession(), isAppRequest()]);

  const [{ data: forms }, { data: deals }, guaranteeUrls] = await Promise.all([
    supabase
      .from("deal_forms")
      .select("id, deal_id, kind, title, status, data, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("deals")
      .select(
        "id, stage, amount, monthly_rent, down_payment, balance_date, contract_date, move_in_date, lessor_name, lessor_phone, lessor_account, lessee_name, lessee_phone, terms_note, property:properties(title, address, property_type, deal_type), customer:customers(name)"
      )
      .neq("stage", "취소")
      .order("updated_at", { ascending: false }),
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
    return {
      value: deal.id,
      label: label || deal.id.slice(0, 8),
      propertyType: property?.property_type ?? "",
      dealType: property?.deal_type ?? "",
      contractData: contractByDeal.get(deal.id),
      prefill: {
        dealType: property?.deal_type ?? "",
        propertyTitle: property?.title ?? "",
        propertyAddress: property?.address ?? "",
        propertyType: property?.property_type ?? "",
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
        />
      </Suspense>
    </div>
  );
}
