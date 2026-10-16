import { DatePicker } from "@/components/form/date-picker";
import { NativeSelect } from "@/components/form/native-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { DealFormKind } from "@/lib/deal-forms";

function Field({
  label,
  htmlFor,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className ?? "space-y-1.5"}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

function TextInput({ id, name, data, ...props }: { id: string; name: string; data: Record<string, string> } & React.ComponentProps<typeof Input>) {
  return <Input id={id} name={name} defaultValue={data[name] ?? ""} {...props} />;
}

/** 종류별 입력 필드. 값은 FormData 키로 저장된다 */
export function DealFormFields({ kind, data, readOnly }: { kind: DealFormKind; data: Record<string, string>; readOnly?: boolean }) {
  const disabled = readOnly;

  if (kind === "contract") {
    return (
      <div className="space-y-6">
        <section className="space-y-3">
          <h3 className="text-sm font-semibold">물건</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="거래 유형" htmlFor="deal_type">
              <NativeSelect id="deal_type" name="deal_type" disabled={disabled} defaultValue={data.deal_type || "매매"} options={["매매", "전세", "월세", "단기임대"]} />
            </Field>
            <Field label="물건 종류" htmlFor="property_type">
              <TextInput id="property_type" name="property_type" data={data} disabled={disabled} />
            </Field>
            <Field label="물건명" htmlFor="property_title" className="space-y-1.5 sm:col-span-2">
              <TextInput id="property_title" name="property_title" data={data} disabled={disabled} />
            </Field>
            <Field label="소재지" htmlFor="property_address" className="space-y-1.5 sm:col-span-2">
              <TextInput id="property_address" name="property_address" data={data} disabled={disabled} />
            </Field>
            <Field label="동" htmlFor="building">
              <TextInput id="building" name="building" data={data} disabled={disabled} />
            </Field>
            <Field label="호" htmlFor="unit">
              <TextInput id="unit" name="unit" data={data} disabled={disabled} />
            </Field>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold">당사자</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="임대인(매도인) 성명" htmlFor="lessor_name">
              <TextInput id="lessor_name" name="lessor_name" data={data} disabled={disabled} />
            </Field>
            <Field label="임대인 연락처" htmlFor="lessor_phone">
              <TextInput id="lessor_phone" name="lessor_phone" data={data} disabled={disabled} />
            </Field>
            <Field label="임대인 계좌" htmlFor="lessor_account" className="space-y-1.5 sm:col-span-2">
              <TextInput id="lessor_account" name="lessor_account" data={data} disabled={disabled} placeholder="은행 계좌번호 예금주" />
            </Field>
            <Field label="임차인(매수인) 성명" htmlFor="lessee_name">
              <TextInput id="lessee_name" name="lessee_name" data={data} disabled={disabled} />
            </Field>
            <Field label="임차인 연락처" htmlFor="lessee_phone">
              <TextInput id="lessee_phone" name="lessee_phone" data={data} disabled={disabled} />
            </Field>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold">금액·일정</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="거래대금·보증금 (만원)" htmlFor="amount">
              <TextInput id="amount" name="amount" data={data} disabled={disabled} inputMode="numeric" />
            </Field>
            <Field label="월세 (만원)" htmlFor="monthly_rent">
              <TextInput id="monthly_rent" name="monthly_rent" data={data} disabled={disabled} inputMode="numeric" />
            </Field>
            <Field label="계약금 (만원)" htmlFor="down_payment">
              <TextInput id="down_payment" name="down_payment" data={data} disabled={disabled} inputMode="numeric" />
            </Field>
            <Field label="중도금1 (만원)" htmlFor="interim_payment_1">
              <TextInput id="interim_payment_1" name="interim_payment_1" data={data} disabled={disabled} inputMode="numeric" />
            </Field>
            <Field label="중도금2 (만원)" htmlFor="interim_payment_2">
              <TextInput id="interim_payment_2" name="interim_payment_2" data={data} disabled={disabled} inputMode="numeric" />
            </Field>
            <Field label="계약일" htmlFor="contract_date">
              <DatePicker id="contract_date" name="contract_date" defaultValue={data.contract_date ?? ""} disabled={disabled} />
            </Field>
            <Field label="만기일" htmlFor="expiry_date">
              <DatePicker id="expiry_date" name="expiry_date" defaultValue={data.expiry_date ?? ""} disabled={disabled} />
            </Field>
            <Field label="잔금일" htmlFor="balance_date">
              <DatePicker id="balance_date" name="balance_date" defaultValue={data.balance_date ?? ""} disabled={disabled} />
            </Field>
            <Field label="입주·인도일" htmlFor="move_in_date">
              <DatePicker id="move_in_date" name="move_in_date" defaultValue={data.move_in_date ?? ""} disabled={disabled} />
            </Field>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold">관리·메모</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="메모" htmlFor="memo" className="space-y-1.5 sm:col-span-2">
              <TextInput id="memo" name="memo" data={data} disabled={disabled} />
            </Field>
            <Field label="완료" htmlFor="completed">
              <NativeSelect id="completed" name="completed" disabled={disabled} defaultValue={data.completed || ""} options={["완료"]} placeholder="미완료" />
            </Field>
            <Field label="계약서번호" htmlFor="contract_no">
              <TextInput id="contract_no" name="contract_no" data={data} disabled={disabled} />
            </Field>
            <Field label="전송상호" htmlFor="sender_name">
              <TextInput id="sender_name" name="sender_name" data={data} disabled={disabled} />
            </Field>
            <Field label="수신상호" htmlFor="receiver_name">
              <TextInput id="receiver_name" name="receiver_name" data={data} disabled={disabled} />
            </Field>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold">특약·기타</h3>
          <Field label="계약 조건 메모" htmlFor="terms_note">
            <Textarea id="terms_note" name="terms_note" rows={3} defaultValue={data.terms_note ?? ""} disabled={disabled} />
          </Field>
          <Field label="특약 사항" htmlFor="special_terms">
            <Textarea id="special_terms" name="special_terms" rows={6} defaultValue={data.special_terms ?? ""} disabled={disabled} />
          </Field>
          <Field label="추가 기재" htmlFor="extra_note">
            <Textarea id="extra_note" name="extra_note" rows={3} defaultValue={data.extra_note ?? ""} disabled={disabled} />
          </Field>
        </section>

        <OfficeFields data={data} disabled={disabled} />
      </div>
    );
  }

  if (kind === "disclosure") {
    return (
      <div className="space-y-6">
        <section className="space-y-3">
          <h3 className="text-sm font-semibold">중개대상물</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="물건명" htmlFor="property_title" className="space-y-1.5 sm:col-span-2">
              <TextInput id="property_title" name="property_title" data={data} disabled={disabled} />
            </Field>
            <Field label="소재지" htmlFor="property_address" className="space-y-1.5 sm:col-span-2">
              <TextInput id="property_address" name="property_address" data={data} disabled={disabled} />
            </Field>
            <Field label="거래 유형" htmlFor="deal_type">
              <TextInput id="deal_type" name="deal_type" data={data} disabled={disabled} />
            </Field>
            <Field label="물건 종류" htmlFor="property_type">
              <TextInput id="property_type" name="property_type" data={data} disabled={disabled} />
            </Field>
            <Field label="임대인(매도인)" htmlFor="lessor_name">
              <TextInput id="lessor_name" name="lessor_name" data={data} disabled={disabled} />
            </Field>
            <Field label="임차인(매수인)" htmlFor="lessee_name">
              <TextInput id="lessee_name" name="lessee_name" data={data} disabled={disabled} />
            </Field>
            <Field label="설명일" htmlFor="contract_date">
              <DatePicker id="contract_date" name="contract_date" defaultValue={data.contract_date ?? ""} disabled={disabled} />
            </Field>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold">확인·설명 내용</h3>
          <Field label="소유권·등기 관계" htmlFor="ownership_note">
            <Textarea id="ownership_note" name="ownership_note" rows={3} defaultValue={data.ownership_note ?? ""} disabled={disabled} placeholder="소유자, 갑구·을구 주요 내용" />
          </Field>
          <Field label="권리관계(근저당·가압류 등)" htmlFor="rights_note">
            <Textarea id="rights_note" name="rights_note" rows={3} defaultValue={data.rights_note ?? ""} disabled={disabled} />
          </Field>
          <Field label="건축물·토지 이용" htmlFor="building_note">
            <Textarea id="building_note" name="building_note" rows={3} defaultValue={data.building_note ?? ""} disabled={disabled} placeholder="위반건축물, 용도지역 등" />
          </Field>
          <Field label="토지이용계획·기타" htmlFor="land_use_note">
            <Textarea id="land_use_note" name="land_use_note" rows={3} defaultValue={data.land_use_note ?? ""} disabled={disabled} />
          </Field>
          <Field label="중개사 설명 요지" htmlFor="explanation_note">
            <Textarea id="explanation_note" name="explanation_note" rows={4} defaultValue={data.explanation_note ?? ""} disabled={disabled} />
          </Field>
          <Field label="확인 문구" htmlFor="confirmation_note">
            <Textarea id="confirmation_note" name="confirmation_note" rows={2} defaultValue={data.confirmation_note ?? ""} disabled={disabled} />
          </Field>
        </section>

        <OfficeFields data={data} disabled={disabled} />
      </div>
    );
  }

  if (kind === "receipt") {
    return (
      <div className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="영수증 종류" htmlFor="receipt_type">
            <NativeSelect
              id="receipt_type"
              name="receipt_type"
              disabled={disabled}
              defaultValue={data.receipt_type || "계약금"}
              options={["계약금", "중도금", "잔금", "중개수수료", "기타"]}
            />
          </Field>
          <Field label="수령일" htmlFor="paid_at">
            <DatePicker id="paid_at" name="paid_at" defaultValue={data.paid_at ?? ""} disabled={disabled} />
          </Field>
          <Field label="납부자" htmlFor="payer_name">
            <TextInput id="payer_name" name="payer_name" data={data} disabled={disabled} />
          </Field>
          <Field label="수령자" htmlFor="payee_name">
            <TextInput id="payee_name" name="payee_name" data={data} disabled={disabled} />
          </Field>
          <Field label="금액 (만원)" htmlFor="amount">
            <TextInput id="amount" name="amount" data={data} disabled={disabled} inputMode="numeric" />
          </Field>
          <Field label="지급 방법" htmlFor="payment_method">
            <TextInput id="payment_method" name="payment_method" data={data} disabled={disabled} />
          </Field>
          <Field label="입금 계좌" htmlFor="account" className="space-y-1.5 sm:col-span-2">
            <TextInput id="account" name="account" data={data} disabled={disabled} />
          </Field>
          <Field label="관련 물건" htmlFor="property_title" className="space-y-1.5 sm:col-span-2">
            <TextInput id="property_title" name="property_title" data={data} disabled={disabled} />
          </Field>
          <Field label="용도·적요" htmlFor="purpose" className="space-y-1.5 sm:col-span-2">
            <TextInput id="purpose" name="purpose" data={data} disabled={disabled} />
          </Field>
          <Field label="비고" htmlFor="note" className="space-y-1.5 sm:col-span-2">
            <Textarea id="note" name="note" rows={3} defaultValue={data.note ?? ""} disabled={disabled} />
          </Field>
        </div>
        {/* 숨김 필드로 나머지 키 유지 */}
        {["property_address", "property_type", "deal_type", "office_name", "office_phone", "office_address", "agent_name", "agent_phone"].map(
          (name) => (
            <input key={name} type="hidden" name={name} defaultValue={data[name] ?? ""} />
          )
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Field label="본문" htmlFor="body">
        <Textarea id="body" name="body" rows={12} defaultValue={data.body ?? ""} disabled={disabled} placeholder="서식 내용을 입력하세요" />
      </Field>
      <Field label="비고" htmlFor="note">
        <Textarea id="note" name="note" rows={3} defaultValue={data.note ?? ""} disabled={disabled} />
      </Field>
      {["property_title", "property_address", "property_type", "deal_type", "office_name", "office_phone", "office_address", "agent_name", "agent_phone"].map(
        (name) => (
          <input key={name} type="hidden" name={name} defaultValue={data[name] ?? ""} />
        )
      )}
    </div>
  );
}

function OfficeFields({ data, disabled }: { data: Record<string, string>; disabled?: boolean }) {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold">중개사무소</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="사무소명" htmlFor="office_name">
          <TextInput id="office_name" name="office_name" data={data} disabled={disabled} />
        </Field>
        <Field label="사무소 전화" htmlFor="office_phone">
          <TextInput id="office_phone" name="office_phone" data={data} disabled={disabled} />
        </Field>
        <Field label="사무소 주소" htmlFor="office_address" className="space-y-1.5 sm:col-span-2">
          <TextInput id="office_address" name="office_address" data={data} disabled={disabled} />
        </Field>
        <Field label="담당 중개사" htmlFor="agent_name">
          <TextInput id="agent_name" name="agent_name" data={data} disabled={disabled} />
        </Field>
        <Field label="담당자 연락처" htmlFor="agent_phone">
          <TextInput id="agent_phone" name="agent_phone" data={data} disabled={disabled} />
        </Field>
      </div>
    </section>
  );
}
