import { DEAL_FORM_KIND_LABELS, type DealFormKind } from "@/lib/deal-forms";

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="grid grid-cols-[7rem_minmax(0,1fr)] gap-2 border-b py-2 text-sm last:border-b-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="whitespace-pre-wrap break-words">{value}</dd>
    </div>
  );
}

/** 인쇄·공개 공유용 서식 보기 */
export function DealFormDocumentView({
  kind,
  title,
  data,
  office,
  property,
}: {
  kind: DealFormKind;
  title: string;
  data: Record<string, string>;
  office?: { name?: string | null; phone?: string | null; address?: string | null } | null;
  property?: { title?: string | null; address?: string | null; deal_type?: string | null } | null;
}) {
  return (
    <article className="rounded-xl border bg-white p-6 shadow-sm print:rounded-none print:border-0 print:shadow-none">
      <header className="mb-6 space-y-1 border-b pb-4">
        <p className="text-xs text-muted-foreground">{DEAL_FORM_KIND_LABELS[kind]}</p>
        <h1 className="text-xl font-bold tracking-tight">{title}</h1>
        {(property?.title || data.property_title) && (
          <p className="text-sm text-muted-foreground">{property?.title ?? data.property_title}</p>
        )}
      </header>

      <dl>
        {kind === "contract" && (
          <>
            <Row label="거래 유형" value={data.deal_type} />
            <Row label="물건 종류" value={data.property_type} />
            <Row label="소재지" value={data.property_address || property?.address} />
            <Row label="임대인(매도인)" value={data.lessor_name} />
            <Row label="임차인(매수인)" value={data.lessee_name} />
            <Row label="거래대금·보증금" value={data.amount ? `${data.amount}만원` : null} />
            <Row label="월세" value={data.monthly_rent ? `${data.monthly_rent}만원` : null} />
            <Row label="계약금" value={data.down_payment ? `${data.down_payment}만원` : null} />
            <Row label="중도금1" value={data.interim_payment_1 ? `${data.interim_payment_1}만원` : null} />
            <Row label="중도금2" value={data.interim_payment_2 ? `${data.interim_payment_2}만원` : null} />
            <Row label="계약일" value={data.contract_date} />
            <Row label="만기일" value={data.expiry_date} />
            <Row label="잔금일" value={data.balance_date} />
            <Row label="입주·인도일" value={data.move_in_date} />
            <Row label="동/호" value={[data.building, data.unit].filter(Boolean).join(" ") || null} />
            <Row label="입금 계좌" value={data.lessor_account} />
            <Row label="메모" value={data.memo} />
            <Row label="계약서번호" value={data.contract_no} />
            <Row label="조건 메모" value={data.terms_note} />
            <Row label="특약" value={data.special_terms} />
            <Row label="추가 기재" value={data.extra_note} />
          </>
        )}
        {kind === "disclosure" && (
          <>
            <Row label="소재지" value={data.property_address || property?.address} />
            <Row label="거래 유형" value={data.deal_type || property?.deal_type} />
            <Row label="임대인(매도인)" value={data.lessor_name} />
            <Row label="임차인(매수인)" value={data.lessee_name} />
            <Row label="설명일" value={data.contract_date} />
            <Row label="소유권·등기" value={data.ownership_note} />
            <Row label="권리관계" value={data.rights_note} />
            <Row label="건축물·토지" value={data.building_note} />
            <Row label="토지이용·기타" value={data.land_use_note} />
            <Row label="설명 요지" value={data.explanation_note} />
            <Row label="확인" value={data.confirmation_note} />
          </>
        )}
        {kind === "receipt" && (
          <>
            <Row label="종류" value={data.receipt_type} />
            <Row label="수령일" value={data.paid_at} />
            <Row label="납부자" value={data.payer_name} />
            <Row label="수령자" value={data.payee_name} />
            <Row label="금액" value={data.amount ? `${data.amount}만원` : null} />
            <Row label="지급 방법" value={data.payment_method} />
            <Row label="계좌" value={data.account} />
            <Row label="용도" value={data.purpose} />
            <Row label="비고" value={data.note} />
          </>
        )}
        {kind === "other" && (
          <>
            <Row label="내용" value={data.body} />
            <Row label="비고" value={data.note} />
          </>
        )}
      </dl>

      <footer className="mt-8 space-y-1 border-t pt-4 text-sm text-muted-foreground">
        <p>{data.office_name || office?.name}</p>
        {(data.office_address || office?.address) && <p>{data.office_address || office?.address}</p>}
        {(data.office_phone || office?.phone) && <p>전화 {data.office_phone || office?.phone}</p>}
        {data.agent_name && <p>담당 {data.agent_name}{data.agent_phone ? ` · ${data.agent_phone}` : ""}</p>}
      </footer>
    </article>
  );
}
