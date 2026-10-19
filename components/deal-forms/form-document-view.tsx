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
        {kind === "receipt" && data.form_template === "broker_fee_receipt" && (
          <>
            <Row label="종류" value="중개보수 영수증" />
            <Row label="수령인" value={data.recipient_name} />
            <Row label="대상물" value={data.property_label || data.property_address} />
            <Row label="거래액" value={data.deal_amount_won ? `${Number(data.deal_amount_won).toLocaleString("ko-KR")}원` : null} />
            <Row label="중개보수" value={data.fee_amount_won ? `${Number(data.fee_amount_won).toLocaleString("ko-KR")}원` : null} />
            <Row label="발행일" value={data.issued_at || data.paid_at} />
          </>
        )}
        {kind === "receipt" && data.form_template !== "broker_fee_receipt" && (
          <>
            <Row label="종류" value={data.receipt_doc_kind || data.receipt_type} />
            <Row label="수령인" value={data.recipient_name || data.payer_name} />
            <Row label="금액" value={data.amount_won ? `${Number(data.amount_won).toLocaleString("ko-KR")}원` : data.amount ? `${data.amount}만원` : null} />
            <Row label="부동산" value={data.property_label || data.property_address} />
            <Row label="용도" value={data.purpose_line1 || data.purpose} />
            <Row label="발행일" value={data.issued_at || data.paid_at} />
            <Row label="발행인" value={data.issuer_name || data.payee_name} />
          </>
        )}
        {kind === "other" && data.form_template === "privacy_consent" && (
          <>
            <Row label="제공자1" value={[data.provider1_name, data.provider1_consent].filter(Boolean).join(" · ")} />
            <Row label="제공자2" value={[data.provider2_name, data.provider2_consent].filter(Boolean).join(" · ")} />
            <Row label="수집일시" value={data.collected_at} />
            <Row label="수집자" value={[data.office_name, data.collector_name].filter(Boolean).join(" · ")} />
          </>
        )}
        {kind === "other" && data.form_template === "utility_settlement" && (
          <>
            <Row label="물건소재지" value={data.property_label || data.property_address} />
            <Row label="정산총액" value={data.total_amount ? `${Number(data.total_amount).toLocaleString("ko-KR")}원` : null} />
            <Row label="발행일" value={data.issued_at} />
            <Row label="비고" value={data.remarks || data.note} />
          </>
        )}
        {kind === "other" && data.form_template === "power_of_attorney" && (
          <>
            <Row label="위임대상물" value={data.subject_label} />
            <Row label="위임인" value={data.principal_name} />
            <Row label="수임인" value={data.agent_name_poa} />
            <Row label="위임사항" value={data.mandate_body} />
            <Row label="작성일" value={data.issued_at} />
          </>
        )}
        {kind === "other" && data.form_template === "balance_settlement" && (
          <>
            <Row label="물건소재지" value={data.property_label || data.property_address} />
            <Row label="잔금정산액" value={data.total_amount ? `${Number(data.total_amount).toLocaleString("ko-KR")}원` : null} />
            <Row label="발행일" value={data.issued_at} />
            <Row label="비고" value={data.remarks || data.note} />
          </>
        )}
        {kind === "other" &&
          data.form_template !== "privacy_consent" &&
          data.form_template !== "utility_settlement" &&
          data.form_template !== "power_of_attorney" &&
          data.form_template !== "balance_settlement" && (
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
