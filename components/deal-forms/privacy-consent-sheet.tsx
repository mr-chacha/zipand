"use client";

import { DatePicker } from "@/components/form/date-picker";
import { NativeSelect } from "@/components/form/native-select";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const fieldBorder =
  "rounded-md border-2 border-foreground/35 bg-background shadow-none focus-visible:border-foreground/60 focus-visible:ring-1";

const CONSENT_OPTIONS = [
  { value: "동의", label: "동의" },
  { value: "동의거부", label: "동의거부" },
] as const;

function CellInput({
  name,
  data,
  className,
  ...props
}: { name: string; data: Record<string, string> } & React.ComponentProps<typeof Input>) {
  return (
    <Input
      name={name}
      defaultValue={data[name] ?? ""}
      className={cn("h-8 bg-background px-1.5", fieldBorder, className)}
      {...props}
    />
  );
}

/** 한국공인중개사협회 양식 기준 개인정보 수집·이용 동의서 */
export function PrivacyConsentSheet({
  data,
  id = "contract-print-root",
  className,
}: {
  data: Record<string, string>;
  id?: string;
  className?: string;
}) {
  const officeName = data.office_name || "개업공인중개사사무소";

  return (
    <div
      id={id}
      className={cn("space-y-4 bg-white text-[13px] leading-relaxed text-foreground print:space-y-3 print:text-[11px]", className)}
    >
      <header className="text-center">
        <h2 className="text-xl font-bold tracking-tight print:text-[18px]">개인정보 수집 및 이용 동의서</h2>
      </header>

      <section className="space-y-3 rounded-md border px-3 py-3 print:border-foreground/50">
        <h3 className="text-center font-semibold">[ 개인정보 수집 및 이용 동의 ]</h3>

        <div className="space-y-2 text-justify">
          <p>
            <strong>1. 개인정보의 수집 및 이용목적</strong>
          </p>
          <ul className="list-none space-y-0.5 pl-1">
            <li>- 부동산 거래를 위한 매물 관리 및 계약서 작성</li>
            <li>- 지속가능한 서비스 제공을 위한 고객관리</li>
            <li>- 협회 부동산 거래정보망 운영규정 준수를 위한 업무</li>
          </ul>
          <p className="text-[12px] text-muted-foreground print:text-[10px] print:text-foreground">
            단, 고유식별번호(주민등록번호)는 공인중개사법 제26조(거래계약서의 작성 등) 및 부동산거래신고에 관한 법률
            제3조(부동산거래의 신고)의 목적 이외에는 사용되지 않습니다.
          </p>
        </div>

        <div className="space-y-1 text-justify">
          <p>
            <strong>2. 수집하는 개인정보의 항목</strong>
          </p>
          <p>수집항목 : 이름, 주소, 휴대폰번호, 전화번호, 생년월일, 성별, 계약정보</p>
        </div>

        <div className="space-y-1 text-justify">
          <p>
            <strong>3. 개인정보 수집방법</strong>
          </p>
          <p>
            한국공인중개사협회 한방부동산거래정보망 시스템 사용이 허가된 개업공인중개사의 직접 입력을 통한 시스템 등록
          </p>
        </div>

        <div className="space-y-1 text-justify">
          <p>
            <strong>4. 개인정보의 보유 및 이용기간</strong>
          </p>
          <p>
            저장된 개인정보는 이용목적이 달성되면 지체 없이 파기합니다. 단, 공인중개사법 및 공인중개사법 시행령에 따라
            계약서는 <strong>5년</strong>간 보존합니다.
          </p>
        </div>

        <div className="space-y-2 text-justify">
          <p>
            <strong>5. 개인정보의 제3자 제공</strong>
          </p>
          <p>
            <strong>{officeName}</strong> 는(은) 다음과 같이 위에서 수집한 개인정보를 제3자에게 제공하고 있습니다.
          </p>
          <ul className="list-none space-y-1 pl-1">
            <li>- 제공받는자 : 한국공인중개사협회</li>
            <li>
              - 이용목적 및 업무내용 :
              <ul className="mt-1 list-none space-y-1 pl-3">
                <li>
                  가. 한방부동산거래정보망 서비스 제공
                  <br />
                  <span className="pl-3">- 매물등록, 고객등록, 계약서 작성 등에 필요한 개인정보 저장시스템의 관리업무</span>
                </li>
                <li>
                  나. 협회 부동산 거래정보망 운영규정 제4조(업무의 범위)에 따른 업무처리
                  <ul className="pl-3">
                    <li>- 부동산 관련 정보의 수집ㆍ가공ㆍ판매ㆍ대여 및 대행 업무</li>
                    <li>- 부동산 관련 홍보 및 출간물의 발간ㆍ판매 업무</li>
                    <li>- 부동산 관련 프로그램의 개발ㆍ판매 및 대행 업무</li>
                    <li>
                      - 계약금 등의 반환, 채무이행의 보장(에스크로제) 등 협회 부동산거래정보망 운영규정 제3조의 효율적인
                      운영을 위하여 필요한 업무
                    </li>
                  </ul>
                </li>
                <li>
                  다. 개인정보보호법 제28조의 2(가명정보의 처리 등)에 의거하여 각종 부동산 통계작성을 위해 가명정보를
                  활용합니다.
                </li>
              </ul>
            </li>
            <li>- 보유 및 이용기간 : 공인중개사의 한방부동산거래정보망 계약서 데이터 삭제 처리 시 까지</li>
          </ul>
        </div>
      </section>

      <p className="text-[12px] text-justify text-muted-foreground print:text-[10px] print:text-foreground">
        정보 제공시 개인정보보호의 안전을 기하기 위하여 개인정보보호 관련 법규의 준수 및 사고시의 책임부담 등을 명확히
        규정하고 당해 계약 내용을 서면으로 보관하고 있습니다.
        <br />※ 동의를 거부할 수 있으며, 동의 거부 시 제공되는 중개서비스가 제한될 수 있으나 그에 대한 불이익은
        없습니다.
      </p>

      <section className="space-y-3 border-t pt-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <ProviderRow index={1} data={data} />
          <ProviderRow index={2} data={data} />
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t pt-3">
          <span className="shrink-0 font-medium">수집일시 :</span>
          <DatePicker name="collected_at" defaultValue={data.collected_at ?? ""} className="w-48" inputClassName="h-8" />
        </div>

        <div className="flex flex-wrap items-end gap-2">
          <span className="shrink-0 font-medium">개인정보 수집자 :</span>
          <CellInput name="office_name" data={data} className="min-w-[10rem] flex-1" placeholder="사무소명" />
          <span className="shrink-0">성 명</span>
          <CellInput name="collector_name" data={data} className="w-28" placeholder="성명" />
          <span className="shrink-0 text-muted-foreground">(서 명)</span>
          <span className="inline-block min-w-20 border-b border-foreground/40 px-2 pb-0.5 text-center text-[11px] text-muted-foreground/70">
            &nbsp;
          </span>
        </div>
      </section>

      <p className="text-[11px] text-muted-foreground print:text-[9px] print:text-foreground">
        ※ 한방부동산거래정보망에 고객의 정보를 등록할 경우 개인정보 수집 및 이용 동의를 받아야 합니다.
      </p>

      <input type="hidden" name="form_template" value="privacy_consent" />
      <input type="hidden" name="property_title" defaultValue={data.property_title ?? ""} />
      <input type="hidden" name="property_address" defaultValue={data.property_address ?? ""} />
      <input type="hidden" name="property_type" defaultValue={data.property_type ?? ""} />
      <input type="hidden" name="deal_type" defaultValue={data.deal_type ?? ""} />
      <input type="hidden" name="office_phone" defaultValue={data.office_phone ?? ""} />
      <input type="hidden" name="office_address" defaultValue={data.office_address ?? ""} />
      <input type="hidden" name="agent_name" defaultValue={data.agent_name ?? ""} />
      <input type="hidden" name="agent_phone" defaultValue={data.agent_phone ?? ""} />
      <input type="hidden" name="note" defaultValue={data.note ?? ""} />
    </div>
  );
}

function ProviderRow({ index, data }: { index: 1 | 2; data: Record<string, string> }) {
  const nameKey = `provider${index}_name`;
  const consentKey = `provider${index}_consent`;
  return (
    <div className="flex flex-wrap items-end gap-2 rounded-md border px-2 py-2 print:border-foreground/40">
      <span className="shrink-0 font-medium">{index === 1 ? "①" : "②"}개인정보 제공자 :</span>
      <span className="shrink-0 text-muted-foreground">성 명</span>
      <CellInput name={nameKey} data={data} className="min-w-[6rem] flex-1" placeholder="성명" />
      <span className="shrink-0 text-muted-foreground">(서 명)</span>
      <span className="inline-block min-w-16 border-b border-foreground/40 px-2 pb-0.5">&nbsp;</span>
      <NativeSelect
        name={consentKey}
        defaultValue={data[consentKey] || "동의"}
        options={[...CONSENT_OPTIONS]}
        className="w-28"
        selectClassName={cn("h-8", fieldBorder, "app:h-8")}
      />
    </div>
  );
}
