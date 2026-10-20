"use client";

import { useState } from "react";
import { DatePicker } from "@/components/form/date-picker";
import { NativeSelect } from "@/components/form/native-select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export type StandardLeasePageNo = 1 | 2 | 3 | 4 | 5 | 6;

export const STANDARD_LEASE_PAGES: { no: StandardLeasePageNo; label: string }[] = [
  { no: 1, label: "1페이지" },
  { no: 2, label: "2페이지" },
  { no: 3, label: "3페이지" },
  { no: 4, label: "4페이지" },
  { no: 5, label: "5페이지" },
  { no: 6, label: "6페이지" },
];

const fieldBorder =
  "rounded-none border border-foreground/40 bg-background shadow-none focus-visible:border-foreground/70 focus-visible:ring-0";

function Cell({
  name,
  data,
  className,
  ...props
}: { name: string; data: Record<string, string> } & React.ComponentProps<typeof Input>) {
  return (
    <Input
      name={name}
      defaultValue={data[name] ?? ""}
      className={cn("h-7 bg-background px-1.5 text-[12px]", fieldBorder, className)}
      {...props}
    />
  );
}

function Area({
  name,
  data,
  rows = 3,
  className,
}: {
  name: string;
  data: Record<string, string>;
  rows?: number;
  className?: string;
}) {
  return (
    <Textarea
      name={name}
      rows={rows}
      defaultValue={data[name] ?? ""}
      className={cn("min-h-0 resize-y bg-background text-[12px]", fieldBorder, className)}
    />
  );
}

export function StandardLeasePageTabs({
  page,
  onPageChange,
  className,
}: {
  page: StandardLeasePageNo;
  onPageChange: (page: StandardLeasePageNo) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap gap-1 bg-muted px-4 py-2 print:hidden", className)}>
      {STANDARD_LEASE_PAGES.map((p) => (
        <button
          key={p.no}
          type="button"
          onClick={() => onPageChange(p.no)}
          className={cn(
            "min-w-[4.25rem] rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors",
            page === p.no ? "bg-foreground text-background" : "bg-background text-foreground hover:bg-background/80"
          )}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}

function Page({
  no,
  active,
  children,
}: {
  no: StandardLeasePageNo;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "form-print-page disclosure-page space-y-3 border border-foreground/30 bg-white p-3 print:break-after-page print:border-0 print:p-0",
        no === 6 && "print:break-after-auto",
        active ? "block" : "hidden print:block"
      )}
    >
      <p className="text-right text-[11px] text-muted-foreground print:text-foreground">(6쪽 중 {no}쪽)</p>
      {children}
    </section>
  );
}

function Th({ children, className, rowSpan, colSpan }: { children: React.ReactNode; className?: string; rowSpan?: number; colSpan?: number }) {
  return (
    <th
      rowSpan={rowSpan}
      colSpan={colSpan}
      className={cn(
        "border border-foreground/50 bg-muted/40 px-1.5 py-1 text-center text-[11px] font-semibold leading-snug",
        className
      )}
    >
      {children}
    </th>
  );
}

function Td({ children, className, colSpan, rowSpan }: { children?: React.ReactNode; className?: string; colSpan?: number; rowSpan?: number }) {
  return (
    <td colSpan={colSpan} rowSpan={rowSpan} className={cn("border border-foreground/50 px-1.5 py-1 align-middle text-[11px]", className)}>
      {children}
    </td>
  );
}

/** 민간임대주택 표준임대차계약서 — 6쪽 */
export function StandardLeaseFormSheet({
  title,
  data,
  page: pageProp,
  onPageChange,
  showPageTabs = true,
}: {
  title: string;
  data: Record<string, string>;
  page?: StandardLeasePageNo;
  onPageChange?: (page: StandardLeasePageNo) => void;
  showPageTabs?: boolean;
}) {
  const [pageState, setPageState] = useState<StandardLeasePageNo>(1);
  const page = pageProp ?? pageState;
  const setPage = onPageChange ?? setPageState;

  return (
    <div
      id="standard-lease-print-root"
      className="space-y-4 bg-white text-[12px] text-foreground print:space-y-0 print:text-[10.5px]"
    >
      <input type="hidden" name="form_template" value="standard_lease" />
      <input type="hidden" name="template_title" value={title} />
      <input type="hidden" name="template_id" defaultValue={data.template_id ?? ""} />
      <input type="hidden" name="property_type" defaultValue={data.property_type ?? ""} />
      <input type="hidden" name="deal_type" defaultValue={data.deal_type ?? ""} />
      <input type="hidden" name="property_title" defaultValue={data.property_title ?? ""} />
      <input type="hidden" name="contract_no" defaultValue={data.contract_no ?? ""} />
      <input type="hidden" name="agent_phone" defaultValue={data.agent_phone ?? ""} />
      <input type="hidden" name="expiry_date" defaultValue={data.expiry_date || data.lease_end || ""} />
      <input type="hidden" name="move_in_date" defaultValue={data.move_in_date || data.lease_start || ""} />
      <input type="hidden" name="lessor_account" defaultValue={data.lessor_account || data.bank_account || ""} />
      <input type="hidden" name="memo" defaultValue={data.memo ?? ""} />
      <input type="hidden" name="completed" defaultValue={data.completed ?? ""} />
      <input type="hidden" name="sender_name" defaultValue={data.sender_name ?? ""} />
      <input type="hidden" name="receiver_name" defaultValue={data.receiver_name ?? ""} />
      <input type="hidden" name="terms_note" defaultValue={data.terms_note ?? ""} />
      <input type="hidden" name="extra_note" defaultValue={data.extra_note ?? ""} />

      {showPageTabs ? (
        <StandardLeasePageTabs page={page} onPageChange={setPage} className="rounded-md border border-foreground/20 px-1.5" />
      ) : null}

      {/* ─── 1쪽: 표지·당사자·중개사·특별법 고지 (참고 PDF 1쪽 분량) ─── */}
      <Page no={1} active={page === 1}>
        <p className="text-[10px] text-muted-foreground print:text-foreground">
          ■ 민간임대주택에 관한 특별법 시행규칙 [별지 제24호서식]
        </p>
        <header className="bg-foreground px-2 py-1.5 text-center text-background">
          <h2 className="text-[16px] font-bold tracking-tight">표준임대차계약서</h2>
        </header>

        <p className="text-[11px] leading-relaxed">
          아래 임대사업자(이하 &quot;갑&quot;이라 한다)과 임차인(이하 &quot;을&quot;이라 한다)은 아래와 같이 임대차계약을 체결한다.
        </p>
        <div className="flex flex-wrap items-center justify-end gap-2 text-[12px]">
          <span className="font-medium">계약일</span>
          <DatePicker name="contract_date" defaultValue={data.contract_date ?? ""} className="w-40" />
        </div>

        <h3 className="text-[12px] font-bold">1. 계약 당사자</h3>
        <table className="w-full border-collapse">
          <tbody>
            <tr>
              <Th rowSpan={3} className="w-[4.5rem] whitespace-pre-wrap leading-tight">
                임대사업자
                <br />
                (임대인)
              </Th>
              <Th className="w-14">성명</Th>
              <Td className="w-[30%]">
                <Cell name="lessor_name" data={data} />
              </Td>
              <Th className="w-[4.5rem]">주민등록번호</Th>
              <Td>
                <div className="flex items-center gap-0.5">
                  <Cell name="lessor_id_front" data={data} className="w-20" inputMode="numeric" />
                  <span>-</span>
                  <Cell name="lessor_id_back" data={data} className="w-24" inputMode="numeric" />
                </div>
              </Td>
              <Td rowSpan={3} className="w-20 text-center text-[10px] text-muted-foreground">
                (서명 또는
                <br />
                날인)
              </Td>
            </tr>
            <tr>
              <Th>주소</Th>
              <Td colSpan={3}>
                <Cell name="lessor_address" data={data} />
              </Td>
            </tr>
            <tr>
              <Th>전화번호</Th>
              <Td>
                <Cell name="lessor_phone" data={data} />
              </Td>
              <Th>등록번호</Th>
              <Td>
                <Cell name="lessor_biz_no" data={data} placeholder="임대사업자 등록번호" />
              </Td>
            </tr>
            <tr>
              <Th rowSpan={3} className="whitespace-pre-wrap leading-tight">
                임차인
              </Th>
              <Th>성명</Th>
              <Td>
                <Cell name="lessee_name" data={data} />
              </Td>
              <Th>주민등록번호</Th>
              <Td>
                <div className="flex items-center gap-0.5">
                  <Cell name="lessee_id_front" data={data} className="w-20" inputMode="numeric" />
                  <span>-</span>
                  <Cell name="lessee_id_back" data={data} className="w-24" inputMode="numeric" />
                </div>
              </Td>
              <Td rowSpan={3} className="text-center text-[10px] text-muted-foreground">
                (서명 또는
                <br />
                날인)
              </Td>
            </tr>
            <tr>
              <Th>주소</Th>
              <Td colSpan={3}>
                <Cell name="lessee_address" data={data} />
              </Td>
            </tr>
            <tr>
              <Th>전화번호</Th>
              <Td colSpan={3}>
                <Cell name="lessee_phone" data={data} className="w-40" />
              </Td>
            </tr>
          </tbody>
        </table>

        <p className="text-[10.5px] text-sky-700 print:text-foreground">
          ※ 공동개업중개사 추가 시 화면 하단(별지)에서 입력하고, 더 추가할 경우 별지 작성을 이용하세요.
        </p>

        <h3 className="text-[12px] font-bold">2. 공인중개사(개업공인중개사가 계약서를 작성하는 경우 해당)</h3>
        <table className="w-full border-collapse">
          <tbody>
            <tr>
              <Th rowSpan={5} className="w-[4.5rem] whitespace-pre-wrap leading-tight">
                개업
                <br />
                공인중개사
              </Th>
              <Th className="w-24">사무소 명칭</Th>
              <Td colSpan={3}>
                <Cell name="office_name" data={data} />
              </Td>
            </tr>
            <tr>
              <Th>대표자 성명</Th>
              <Td colSpan={3}>
                <div className="flex items-center gap-2">
                  <Cell name="office_representative" data={data} className="max-w-xs flex-1" />
                  <span className="shrink-0 text-[10px] text-muted-foreground">(서명 및 날인)</span>
                </div>
              </Td>
            </tr>
            <tr>
              <Th>사무소 소재지</Th>
              <Td colSpan={3}>
                <Cell name="office_address" data={data} />
              </Td>
            </tr>
            <tr>
              <Th>등록번호</Th>
              <Td>
                <Cell name="office_registration_no" data={data} />
              </Td>
              <Th className="w-20">전화번호</Th>
              <Td>
                <Cell name="office_phone" data={data} />
              </Td>
            </tr>
            <tr>
              <Th>소속공인중개사</Th>
              <Td colSpan={3}>
                <div className="flex items-center gap-2">
                  <Cell name="agent_name" data={data} className="max-w-xs flex-1" />
                  <span className="shrink-0 text-[10px] text-muted-foreground">(서명 및 날인)</span>
                </div>
              </Td>
            </tr>
          </tbody>
        </table>

        <div className="space-y-1.5 border border-foreground/50 bg-muted/20 px-2.5 py-2 text-[10px] leading-snug">
          <p>
            ◆ 해당 주택은 「민간임대주택에 관한 특별법」(이하 &quot;법&quot;이라 한다)에 따라 임대사업자가 시장·군수·구청장에게
            등록한 민간임대주택으로서 다음과 같은 사항이 적용됩니다.
          </p>
          <p className="font-semibold">○ 임대의무기간 중 민간임대주택 양도 제한(법 제43조)</p>
          <p className="pl-2">
            - 임대사업자는 「민간임대주택에 관한 특별법 시행령」 제34조제1항에 따른 시점부터 법 제2조제4호 또는 제5호에
            따른 기간 동안 해당 민간임대주택을 계속 임대해야 하며, 그 기간 동안에는 양도가 제한됩니다.
          </p>
          <p className="font-semibold">○ 임대료 증액 제한(법 제44조)</p>
          <p className="pl-2">
            - 임대사업자는 해당 민간임대주택에 대한 임대료의 증액을 청구하는 경우 임대료의 5퍼센트의 범위에서 주거비
            물가지수, 인근 지역의 임대료 변동률, 임대주택 세대수 등을 고려하여 「민간임대주택에 관한 특별법 시행령」
            제34조의2에 따른 증액비율을 초과하여 청구할 수 없습니다. 또한, 임대차계약 또는 임대료 증액이 있은 후 1년
            이내에는 그 임대료를 증액할 수 없습니다.
          </p>
          <p className="font-semibold">○ 임대차계약의 해제·해지 등 제한(법 제45조)</p>
          <p className="pl-2">
            - 임대사업자는 임차인이 의무를 위반하거나 임대차를 계속하기 어려운 경우 등의 사유가 발생한 때를 제외하고는
            임대사업자로 등록되어 있는 기간 동안 임대차계약을 해제 또는 해지하거나 재계약을 거절할 수 없습니다.
          </p>
          <p className="pl-2">
            - 임차인은 시장·군수·구청장이 임대주택에 거주하기 곤란한 정도의 중대한 하자가 있다고 인정하는 경우 등에
            해당하면 임대의무기간 동안에도 임대차계약을 해제·해지할 수 있습니다.
          </p>
        </div>
      </Page>

      {/* ─── 2쪽: 물건·계약조건 ─── */}
      <Page no={2} active={page === 2}>
        <h3 className="text-[13px] font-bold">3. 임대주택의 표시</h3>
        <table className="w-full border-collapse">
          <tbody>
            <tr>
              <Th className="w-24">소재지</Th>
              <Td colSpan={3}>
                <div className="flex flex-wrap items-center gap-1">
                  <Cell name="property_address" data={data} className="min-w-[12rem] flex-1" />
                  <Cell name="building" data={data} className="w-14" placeholder="동" />
                  <span>동</span>
                  <Cell name="unit" data={data} className="w-14" placeholder="호" />
                  <span>호</span>
                </div>
              </Td>
            </tr>
            <tr>
              <Th>주택유형</Th>
              <Td>
                <Cell name="housing_type" data={data} />
              </Td>
              <Th className="w-24">민간임대등록</Th>
              <Td>
                <NativeSelect
                  name="rental_reg_type"
                  defaultValue={data.rental_reg_type || "미등록"}
                  options={["미등록", "장기일반", "공공지원", "그 밖"]}
                  className="h-7 w-full bg-background text-[12px]"
                />
              </Td>
            </tr>
            <tr>
              <Th>전용면적</Th>
              <Td>
                <div className="flex items-center gap-1">
                  <Cell name="building_area" data={data} className="w-24" inputMode="decimal" />
                  <span>㎡</span>
                </div>
              </Td>
              <Th>대지면적</Th>
              <Td>
                <div className="flex items-center gap-1">
                  <Cell name="land_area" data={data} className="w-24" inputMode="decimal" />
                  <span>㎡</span>
                </div>
              </Td>
            </tr>
          </tbody>
        </table>

        <h3 className="text-[13px] font-bold">4. 계약조건</h3>
        <p className="text-[11px] font-medium">① 임대보증금, 월임대료 및 임대차 계약기간</p>
        <table className="w-full border-collapse">
          <tbody>
            <tr>
              <Th className="w-28">임대보증금</Th>
              <Td>
                <div className="flex flex-wrap items-center gap-1">
                  <Cell name="amount_korean" data={data} className="w-36" placeholder="한글" />
                  <span>원 / ₩</span>
                  <Cell name="amount" data={data} className="w-28" inputMode="numeric" placeholder="만원" />
                  <span>만원</span>
                </div>
              </Td>
            </tr>
            <tr>
              <Th>월임대료</Th>
              <Td>
                <div className="flex flex-wrap items-center gap-1">
                  <Cell name="monthly_rent_korean" data={data} className="w-36" placeholder="한글" />
                  <span>원 / ₩</span>
                  <Cell name="monthly_rent" data={data} className="w-28" inputMode="numeric" placeholder="만원" />
                  <span>만원</span>
                </div>
              </Td>
            </tr>
            <tr>
              <Th>임대차 계약기간</Th>
              <Td>
                <div className="flex flex-wrap items-center gap-1">
                  <DatePicker name="lease_start" defaultValue={data.lease_start ?? ""} className="w-36" />
                  <span>~</span>
                  <DatePicker name="lease_end" defaultValue={data.lease_end ?? ""} className="w-36" />
                  <NativeSelect
                    name="day_count_rule"
                    defaultValue={data.day_count_rule || "초일불산입"}
                    options={["초일불산입", "초일산입"]}
                    className="h-7 w-28 bg-background text-[12px]"
                  />
                </div>
              </Td>
            </tr>
          </tbody>
        </table>

        <p className="pt-1 text-[11px] font-medium">② 임차인은 임대보증금을 아래와 같이 지급한다.</p>
        <div className="mb-1 flex flex-wrap items-center gap-3 rounded-sm bg-slate-800 px-2 py-1.5 text-[11px] text-white">
          <span>잔금</span>
          <label className="inline-flex items-center gap-1">
            <input type="radio" name="balance_mode" value="자동계산" defaultChecked={(data.balance_mode || "자동계산") === "자동계산"} />
            자동계산
          </label>
          <label className="inline-flex items-center gap-1">
            <input type="radio" name="balance_mode" value="직접입력" defaultChecked={data.balance_mode === "직접입력"} />
            직접입력
          </label>
        </div>
        <table className="w-full border-collapse">
          <tbody>
            <tr>
              <Th className="w-24">계약금</Th>
              <Td>
                <div className="flex flex-wrap items-center gap-1">
                  <Cell name="down_payment" data={data} className="w-28" inputMode="numeric" />
                  <span>만원 · 계약 시 지급</span>
                </div>
              </Td>
            </tr>
            <tr>
              <Th>중도금</Th>
              <Td>
                <div className="flex flex-wrap items-center gap-1">
                  <Cell name="interim_payment_1" data={data} className="w-28" inputMode="numeric" />
                  <span>만원 ·</span>
                  <DatePicker name="interim_date_1" defaultValue={data.interim_date_1 ?? ""} className="w-36" />
                </div>
              </Td>
            </tr>
            <tr>
              <Th>잔금</Th>
              <Td>
                <div className="flex flex-wrap items-center gap-1">
                  <Cell name="balance_amount" data={data} className="w-28" inputMode="numeric" />
                  <span>만원 ·</span>
                  <DatePicker name="balance_date" defaultValue={data.balance_date ?? ""} className="w-36" />
                </div>
              </Td>
            </tr>
            <tr>
              <Th>입금계좌</Th>
              <Td>
                <div className="flex flex-wrap items-center gap-1">
                  <span>은행</span>
                  <Cell name="bank_name" data={data} className="w-24" />
                  <span>계좌</span>
                  <Cell name="bank_account" data={data} className="min-w-[8rem] flex-1" />
                  <span>예금주</span>
                  <Cell name="bank_holder" data={data} className="w-24" />
                </div>
              </Td>
            </tr>
          </tbody>
        </table>

        <ul className="list-disc space-y-0.5 pl-4 text-[10.5px] leading-relaxed text-muted-foreground print:text-foreground">
          <li>주택 면적은 「건축법」 및 건축물대장 기준에 따릅니다.</li>
          <li>민간임대주택 유형·최우선변제·보증금반환보증 가입 의무 등을 확인·설명합니다.</li>
        </ul>
      </Page>

      {/* ─── 3쪽: 제1조 ③~⑤ · 제2~9조 ① (별지 제24호서식 원문) ─── */}
      <Page no={3} active={page === 3}>
        <article className="space-y-2 text-[10.5px] leading-[1.55]">
          <section className="space-y-1">
            <p>③ 임차인은 제1항과 제2항에 따른 임대보증금을 이자 없이 임대사업자에게 예치한다.</p>
            <p>
              ④ 임차인은 제2항의 지급기한까지 임대보증금을 내지 않는 경우에는 연체이율(연{" "}
              <span className="inline-flex items-center gap-0.5 align-middle">
                <Cell name="late_fee_rate" data={data} className="inline-block h-6 w-12" inputMode="decimal" />
                %
              </span>
              )을 적용하여 계산한 연체료를 더하여 내야 한다. 이 경우 연체이율은 한국은행에서 발표하는 예금은행
              주택담보대출의 가중평균금리에 「은행법」에 따른 은행으로서 가계자금 대출시장의 점유율이 최상위인
              금융기관의 연체가산율을 합산한 이율을 고려하여 결정한다.
            </p>
            <p>
              ⑤ 임차인은 당월 분의 월임대료를 매달 말일까지 내야하며, 이를 내지 않을 경우에는 연체된 금액에
              제4항에 따른 연체요율을 적용하여 계산한 연체료를 더하여 내야 한다.
            </p>
          </section>

          <section>
            <p>
              <span className="font-bold">제2조(민간임대주택의 입주일)</span> 위 주택의 입주일은{" "}
              <DatePicker name="private_rental_start" defaultValue={data.private_rental_start ?? ""} className="inline-flex w-36" />
              부터{" "}
              <DatePicker name="private_rental_end" defaultValue={data.private_rental_end ?? ""} className="inline-flex w-36" />
              까지로 한다.
            </p>
          </section>

          <section className="space-y-1">
            <p>
              <span className="font-bold">제3조(월임대료의 계산)</span> ① 임대기간이 월의 첫날부터 시작되지 않거나
              월의 말일에 끝나지 않는 경우에는 그 임대기간이 시작되거나 끝나는 월의 임대료는 일할로 산정한다.
            </p>
            <p>
              ② 입주 월의 월임대료는 입주일(제2조에 따른 입주일을 정한 경우 입주일)부터 계산한다. 다만,
              입주지정기간이 지나 입주하는 경우에는 입주지정기간이 끝난 날부터 계산한다.
            </p>
          </section>

          <section className="space-y-1">
            <p>
              <span className="font-bold">제4조(관리비와 사용료)</span> ① 임차인이 임대주택에 대한 관리비와 사용료를
              임대사업자 또는 임대사업자가 지정한 관리주체에게 납부해야 하는 경우에는 특약으로 정하는 기한까지
              내야하며, 이를 내지 않을 경우에는 임대사업자는 임차인으로 하여금 연체된 금액에 대해 제1조제4항에
              따른 연체요율을 적용하여 계산한 연체료를 더하여 내게 할 수 있다.
            </p>
            <p>
              ② 임대사업자는 관리비와 사용료를 부과ㆍ징수할 때에는 관리비와 사용료의 부과 명세서를 첨부하여
              임차인에게 이를 낼 것을 통지해야 한다. 이 경우 임대사업자는 일반관리비, 청소비, 경비비, 소독비,
              승강기 유지비, 난방비, 급탕비, 수선유지비, 지능형 홈네트워크 설비 유지비 외의 어떠한 명목으로도
              관리비를 부과ㆍ징수할 수 없다.
            </p>
          </section>

          <section className="space-y-1">
            <p>
              <span className="font-bold">제5조(임대 조건 등의 변경)</span> 임대사업자와 임차인은 다음 각 호의 어느
              하나에 해당할 경우에는 임대보증금, 임대료, 관리비, 사용료 등 모든 납부금액을 조정할 수 있다. 다만,
              임대료의 조정은 법 및 「주택임대차보호법」을 위반해서는 안되고, 법 제44조에 따라 임대료 증액청구는
              임대료의 5퍼센트의 범위에서 주거비 물가지수, 인근 지역의 임대료 변동률, 임대주택 세대수 등을
              고려하여 「민간임대주택에 관한 특별법 시행령」 제34조의2에 따라 정하는 증액비율을 초과하여 청구할 수
              없으며, 임대차계약 또는 임대료 증액이 있은 후 1년 이내에는 그 임대료를 증액하지 못한다.
            </p>
            <ol className="list-decimal space-y-0.5 pl-5">
              <li>물가, 그 밖의 경제적 여건의 변동이 있을 때</li>
              <li>
                임대사업자가 임대하는 주택 상호간 또는 인근 유사지역의 민간임대주택 간에 임대조건의 균형상 조정할
                필요가 있을 때
              </li>
              <li>민간임대주택과 부대시설 및 부지의 가격에 현저한 변동이 있을 때</li>
            </ol>
            <div className="mt-1 space-y-1 border border-foreground px-2 py-1.5 text-[10px] leading-[1.5]">
              <p>
                100세대 이상 민간임대주택단지는 임대료 증액 시 직전 임대료의 5퍼센트의 범위에서 다음의 기준을 적용
                받음(「민간임대주택에 관한 특별법 시행령」 제34조의2제1호)
              </p>
              <p>
                1. 「통계법」에 따라 국가데이터처장이 고시하는 지출목적별 소비자물가지수 항목 중 해당 임대주택이
                소재한 특별시, 광역시, 특별자치시, 도 또는 특별자치도의 주택임차료, 주거시설 유지ㆍ보수 및 기타
                주거관련 서비스 지수를 가중 평균한 값의 변동률. 다만, 임대료의 5퍼센트 범위에서 시ㆍ군ㆍ자치구의
                조례로 해당 시ㆍ군ㆍ자치구에서 적용하는 비율을 정하고 있는 경우에는 그에 따름.
              </p>
              <p>
                2. 구체적인 산정방법은 임대등록시스템(렌트홈, www.renthome.go.kr) &quot;100세대 이상 민간임대주택단지
                임대료 증액기준&quot; 참조
              </p>
            </div>
          </section>

          <section className="space-y-1">
            <p>
              <span className="font-bold">제6조(임차인의 금지행위)</span> 임차인은 다음 각 호의 어느 하나에 해당하는
              행위를 해서는 안 된다.
            </p>
            <ol className="list-decimal space-y-0.5 pl-5">
              <li>임대사업자의 동의 없이 무단으로 임차권을 양도하거나 민간임대주택을 타인에게 전대하는 행위</li>
              <li>
                민간임대주택 및 그 부대시설을 개축ㆍ증축 또는 변경하거나 본래의 용도가 아닌 용도로 사용하는 행위
              </li>
              <li>민간임대주택 및 그 부대시설을 파손 또는 멸실하는 행위</li>
              <li>
                민간임대주택 및 그 부대시설의 유지ㆍ관리를 위하여 임대사업자와 임차인이 합의한 사항을 위반하는 행위
              </li>
            </ol>
          </section>

          <section>
            <p>
              <span className="font-bold">제7조(임차인의 의무)</span> 임차인은 위 주택을 선량한 관리자로서
              유지ㆍ관리해야 한다.
            </p>
          </section>

          <section>
            <p>
              <span className="font-bold">제8조(민간임대주택 관리의 범위)</span> 위 주택의 공용부분과 그 부대시설 및
              복리시설은 임대사업자 또는 임대사업자가 지정한 주택관리업자가 관리하고, 주택과 그 내부시설은 임차인이
              관리한다.
            </p>
          </section>

          <section>
            <p>
              <span className="font-bold">제9조(민간임대주택의 수선ㆍ유지 및 보수의 한계)</span> ① 위 주택의 보수와
              수선은 임대사업자의 부담으로 하되, 위 주택의 전용부분과 그 내부시설물을 임차인이 파손하거나 멸실한 부분
              또는 소모성 자재(「공동주택관리법 시행규칙」 별표 1의 장기수선계획의 수립기준상 수선주기가 6년 이내인
              자재를 말한다)의 보수주기에서의 보수 또는 수선은 임차인의 부담으로 한다.
            </p>
          </section>
        </article>
      </Page>

      {/* ─── 4쪽: 제9조 ②③ · 제10조 (별지 제24호서식 원문) ─── */}
      <Page no={4} active={page === 4}>
        <article className="space-y-2.5 text-[10.5px] leading-[1.55]">
          <section className="space-y-1">
            <p>
              ② 제1항에 따른 소모성 자재와 소모성 자재 외의 소모성 자재의 종류와 그 종류별 보수주기는 특약으로 따로
              정할 수 있다. 다만, 벽지ㆍ장판ㆍ전등기구 및 콘센트의 보수주기는 다음 각 호에 따른다.
            </p>
            <ol className="list-decimal space-y-0.5 pl-5">
              <li>
                벽지 및 장판: 10년(변색ㆍ훼손ㆍ오염 등이 심한 경우에는 6년으로 하며, 적치물의 제거에 임차인이 협조한
                경우만 해당한다)
              </li>
              <li>
                전등기구 및 콘센트: 10년. 다만, 훼손 등을 이유로 안전상의 위험이 우려되는 경우에는 조기 교체해야 한다.
              </li>
            </ol>
            <p>
              ③ 제1항에 따라 임차인이 파손하거나 멸실한 부분에 대한 원상복구 대상의 선정 및 그에 대한 수선비의 산출은
              각 호에 따른다.
            </p>
            <ol className="list-decimal space-y-0.5 pl-5">
              <li>임대사업자는 임차인 입주 시 상호 입회하에 시설물의 상태를 확인</li>
              <li>퇴거 시에는 제1호의 결과를 기초로 시설물 상태의 변경사항을 상호 입회하에 점검 및 확인</li>
              <li>
                임차인 부담비용은 상호 합의하에 산출하되, 수선비는 실제 소요되는 실비를 기준으로 시설물의 경과연수에
                따른 감가상각률을 계산하여 산출
              </li>
            </ol>
          </section>

          <section className="space-y-1">
            <p>
              <span className="font-bold">제10조(임대차계약의 해제ㆍ해지 및 손해배상)</span> ① 임차인이 다음 각 호의
              어느 하나에 해당하는 행위를 한 경우를 제외하고는 임대사업자는 이 계약을 해제 또는 해지하거나
              임대차계약의 갱신을 거절할 수 없다.
            </p>
            <ol className="list-decimal space-y-0.5 pl-5">
              <li>거짓이나 그 밖의 부정한 방법으로 민간임대주택을 임대받은 경우</li>
              <li>
                임대사업자의 귀책사유 없이 「민간임대주택에 관한 특별법 시행령」 제34조제1항 각 호의 시점으로부터
                3개월 이내에 입주하지 않은 경우.
              </li>
              <li>월임대료를 3개월 이상 연속하여 연체한 경우</li>
              <li>
                민간임대주택 및 그 부대시설을 임대사업자의 동의를 받지 않고 개축ㆍ증축 또는 변경하거나 본래의 용도가
                아닌 용도로 사용한 경우
              </li>
              <li>민간임대주택 및 그 부대시설을 고의로 파손 또는 멸실한 경우</li>
              <li>
                공공지원민간임대주택의 임차인이 다음 각 목의 어느 하나에 해당하게 된 경우
                <div className="mt-0.5 space-y-0.5 pl-4">
                  <p>
                    가. 임차인의 자산 또는 소득이「민간임대주택에 관한 특별법 시행규칙」 제14조의3 및 제14조의7에 따른
                    요건을 초과하는 경우
                  </p>
                  <p>
                    나. 임대차계약 기간 중 주택을 소유하게 된 경우. 다만, 다음의 어느 하나에 해당하는 경우는 제외한다.
                  </p>
                  <div className="space-y-0.5 pl-4">
                    <p>
                      1) 상속ㆍ판결 또는 혼인 등 그 밖의 부득이한 사유로 주택을 소유하게 된 경우로서 임대차계약이
                      해제ㆍ해지되거나 재계약이 거절될 수 있다는 내용을 통보받은 날부터 6개월 이내에 해당 주택을
                      처분하는 경우
                    </p>
                    <p>
                      2) 혼인 등의 사유로 주택을 소유하게 된 세대구성원이 소유권을 취득한 날부터 14일 이내에
                      전출신고를 하여 세대가 분리된 경우
                    </p>
                    <p>
                      3) 공공지원민간임대주택의 입주자를 선정하고 남은 공공지원민간임대주택에 대하여 선착순의 방법으로
                      입주자로 선정된 경우
                    </p>
                  </div>
                </div>
              </li>
              <li>
                법 제42조의2에 따라 임차인이 공공지원민간임대주택 또는 공공임대주택에 중복하여 입주한 것으로 확인된
                경우
              </li>
              <li>그 밖에 이 표준임대차계약서상의 의무를 위반한 경우</li>
            </ol>
            <p>
              ② 임차인은 다음 각 호의 어느 하나에 해당하는 경우에 이 계약을 해제 또는 해지할 수 있다.
            </p>
            <ol className="list-decimal space-y-0.5 pl-5">
              <li>
                특별자치도지사ㆍ특별자치시장ㆍ시장ㆍ군수ㆍ구청장이 민간임대주택에 거주하기 곤란할 정도의 중대한 하자가
                있다고 인정하는 경우
              </li>
              <li>임대사업자가 임차인의 의사에 반하여 민간임대주택의 부대시설ㆍ복리시설을 파손시킨 경우</li>
              <li>임대사업자의 귀책사유로 입주지정기간이 끝난 날부터 3개월 이내에 입주할 수 없는 경우</li>
              <li>임대사업자가 이 표준임대차계약서상의 의무를 위반한 경우</li>
              <li>
                법 제49조에 따라 임대보증금에 대한 보증에 가입해야 하는 임대사업자가 임대보증금에 대한 보증에 가입하지
                않은 경우
              </li>
            </ol>
            <p>
              ③ 임대인 또는 임차인은 제1항 또는 제2항에 따라 임대차계약을 해제 또는 해지한 경우에는 그 상대방에게
              「민법」 등 관계 법령에 따라 그 해제 또는 해지로 인해 입은 손해의 배상을 청구할 수 있다.
            </p>
          </section>
        </article>
      </Page>

      {/* ─── 5쪽: 제11~14조 (별지 제24호서식 원문) ─── */}
      <Page no={5} active={page === 5}>
        <article className="space-y-2 text-[10.5px] leading-[1.55]">
          <section className="space-y-1">
            <p>
              <span className="font-bold">제11조(임대보증금의 반환)</span> ① 임차인이 임대사업자에게 예치한 임대보증금은 이
              계약이 끝나거나 해제 또는 해지되어 임차인이 임대사업자에게 주택을 명도(明渡)함과 동시에 반환한다.
            </p>
            <p>
              ② 제1항에 따라 반환할 경우 임대사업자는 주택 및 내부 일체에 대한 점검을 실시한 후 임차인이 임대사업자에게 내야
              할 임대료, 관리비 등 모든 납부금액과 제9조제1항에 따른 임차인의 수선유지 불이행에 따른 보수비 및 특약으로 정한
              위약금, 불법거주에 따른 배상금, 손해금 등 임차인의 채무를 임대보증금에서 우선 공제하고 그 잔액을 반환한다.
            </p>
            <p>
              ③ 임차인은 위 주택을 임대사업자에게 명도할 때까지 사용한 전기ㆍ수도ㆍ가스 등의 사용료(납부시효가 끝나지 않은
              것을 말한다) 지급 영수증을 임대사업자에게 제시 또는 예치해야 한다.
            </p>
          </section>

          <section>
            <p>
              <span className="font-bold">제12조(임대보증금 보증)</span> ① 임대사업자가 법 제49조에 따라 임대보증금 보증에
              가입을 한 경우, 「민간임대주택에 관한 특별법 시행령」 제40조에 따라 보증수수료의 75퍼센트는 임대사업자가
              부담하고, 25퍼센트는 임차인이 부담한다. 부담 금액의 징수 방법ㆍ절차ㆍ기한에 관한 사항은 특약으로 정할 수 있다.
            </p>
          </section>

          <section className="space-y-1">
            <p>
              <span className="font-bold">제13조(민간임대주택의 양도)</span> ① 임대사업자가 임대의무기간 경과 후 위 주택을
              임차인에게 양도할 경우 위 주택의 양도 등에 관한 사항은 특약으로 정한 바에 따른다.
            </p>
            <p>
              ② 임대사업자가 법 제43조제2항에 따라 위 주택을 다른 임대사업자에게 양도하는 경우에는 양수도계약서에서 양도받는
              자는 양도하는 자의 임대사업자로서의 지위를 포괄적으로 승계한다는 뜻을 분명하게 밝혀야 한다.
            </p>
          </section>

          <section className="space-y-1">
            <p>
              <span className="font-bold">제14조(임대사업자의 설명의무)</span> ① 임대사업자는 법 제48조에 따라 임대차계약을
              체결하거나 월임대료를 임대보증금으로 전환하는 등 계약내용을 변경하는 경우에는 다음 각 호의 사항을 임차인이 이해할
              수 있도록 설명하고, 등기사항증명서 등 설명의 근거자료를 제시해야 한다.
            </p>
            <ol className="list-decimal space-y-1 pl-5">
              <li>
                임대보증금 보증가입에 관한 사항(법 제49조에 따른 임대보증금 보증가입 의무대상 주택에 한정한다)
                <div className="mt-0.5 space-y-0.5 pl-2">
                  <p>가. 해당 민간임대주택의 임대보증금 보증대상액 및 보증기간에 관한 사항</p>
                  <p>
                    나. 임대보증금 보증 가입에 드는 보증수수료(이하 &quot;보증수수료&quot;라 한다) 산정방법 및 금액, 임대보증금과
                    임차인의 보증수수료 분담비율, 임차인이 부담해야 할 보증수수료의 납부방법에 관한 사항
                  </p>
                  <p>
                    다. 보증기간 중 임대차계약이 해지ㆍ해제되거나 임대보증금의 증감이 있는 경우에 보증수수료의 환급 또는 추가
                    납부에 관한 사항
                  </p>
                  <p>라. 임대차 계약기간 중 보증기간이 만료되는 경우에 재가입에 관한 사항</p>
                  <p>
                    마. 보증약관의 내용 중 국토교통부장관이 정하여 고시하는 중요사항에 관한 내용(보증이행 조건 등)
                  </p>
                </div>
              </li>
              <li>
                민간임대주택의 선순위 담보권 등 권리관계에 관한 사항
                <div className="mt-0.5 space-y-0.5 pl-2">
                  <p>가. 민간임대주택에 설정된 제한물권, 압류ㆍ가압류ㆍ가처분 등에 관한 사항</p>
                  <p>나. 임대사업자의 국세ㆍ지방세 체납에 관한 사항</p>
                </div>
              </li>
              <li>임대의무기간 중 남아 있는 기간</li>
              <li>법 제44조제2항에 따른 임대료 증액 제한에 관한 사항</li>
              <li>법 제45조에 따른 임대차계약의 해제ㆍ해지 등에 관한 사항</li>
              <li>
                단독주택, 다중주택 및 다가구주택에 해당하는 민간임대주택에 둘 이상의 임대차계약이 존재하는 경우
                「주택임대차보호법」 제3조의6제2항에 따라 작성된 확정일자부에 기재된 주택의 차임 및 보증금 등의 정보
              </li>
            </ol>
            <p>
              ② 임차인은 임대사업자로부터 제1항의 사항에 대한 설명을 듣고 이해했음을 아래와 같이 확인한다.
            </p>
            <div className="mt-1.5 space-y-2 border border-foreground px-3 py-2.5">
              <p>본인은 임대보증금 보증가입, 민간임대주택의 권리관계 등에 관한 주요 내용에 대한 설명을 듣고 이해했음.</p>
              <div className="flex flex-wrap items-center justify-end gap-2">
                <span>임차인 성명 :</span>
                <span className="min-w-28 border-b border-foreground/50 px-1 text-center">
                  {data.lessee_name || "    "}
                </span>
                <span>(서명 또는 날인)</span>
                <label className="ml-1 inline-flex items-center gap-1 print:hidden">
                  <input type="checkbox" name="explanation_ack" value="1" defaultChecked={data.explanation_ack === "1"} />
                  확인
                </label>
              </div>
            </div>
          </section>
        </article>
      </Page>

      {/* ─── 6쪽: 제15~17조·소득공제·개인정보동의·별지 ─── */}
      <Page no={6} active={page === 6}>
        <article className="space-y-2.5 text-[10.5px] leading-[1.55]">
          <section>
            <p>
              <span className="font-bold">제15조(소송)</span> 이 계약에 관한 소송의 관할 법원은 임대사업자와 임차인이
              합의하여 결정하는 관할법원으로 하며, 임대사업자와 임차인 간에 합의가 이루어지지 않은 경우에는 위 주택 소재지를
              관할하는 법원으로 한다.
            </p>
          </section>

          <section>
            <p>
              <span className="font-bold">제16조(중개대상물의 확인ㆍ설명)</span> 개업공인중개사가 임대차계약서를 작성하는
              경우에는 중개대상물확인ㆍ설명서를 작성하고, 업무 보증 관계증서(공제증서 등) 사본을 첨부하여 임대차계약을 체결할
              때 임대사업자와 임차인에게 교부한다.
            </p>
          </section>

          <section className="space-y-1.5">
            <p>
              <span className="font-bold">제17조(특약)</span> 임대사업자와 임차인은 제1조부터 제15조까지에서 규정한 사항
              외에 필요한 사항에 대해서는 따로 특약으로 정할 수 있다. 다만, 특약의 내용은 「약관의 규제에 관한 법률」을
              위반해서는 안 된다.
            </p>
            <Area name="special_terms" data={data} rows={3} className="print:min-h-[3.5rem]" />
          </section>

          <section className="space-y-1 border border-foreground px-2.5 py-2 text-[10.5px]">
            <p className="font-semibold">◆ 주택월세 소득공제 안내</p>
            <p>
              근로소득이 있는 거주자(일용근로자는 제외한다)는 「소득세법」 및 「조세특례제한법」에 따라 주택월세에 대한
              소득공제를 받을 수 있으며, 자세한 사항은 국세청 콜센터(국번 없이 126)로 문의하시기 바랍니다.
            </p>
          </section>

          <section className="space-y-1.5">
            <h3 className="text-[11px] font-bold">5. 개인정보의 제3자 제공 동의서</h3>
            <p>
              임대사업자는 「개인정보 보호법」 제17조에 따라 등록임대주택에 관한 정보제공에 필요한 개인정보를 아래와 같이
              임차인의 동의를 받아 제공합니다. 이 경우 개인정보를 제공받은 자가 해당 개인정보를 이용하여 임차인에게 연락할 수
              있음을 알려드립니다.
            </p>
            <ul className="space-y-0.5 pl-1">
              <li>
                - 제공받는 자: 국토교통부장관, 시장ㆍ군수ㆍ구청장, 주택도시보증공사, 그 밖에 법 제49조에 따른 임대보증금에
                대한 보증을 취급하는 보증회사
              </li>
              <li>
                - 제공 목적: 등록임대주택에 관한 정보(보증 정보 포함) 제공을 위한 우편물 발송, 문자 발송 등 지원 관련
              </li>
              <li>- 개인정보 항목: 성명, 주소, 전화번호</li>
              <li>- 보유 및 이용 기간: 임대차계약 종료일까지</li>
            </ul>
            <div className="mt-1 space-y-2 border border-foreground px-3 py-2.5">
              <label className="flex flex-wrap items-center gap-2">
                <input
                  type="checkbox"
                  name="privacy_consent"
                  value="1"
                  defaultChecked={data.privacy_consent === "1"}
                  className="print:hidden"
                />
                <span>본인의 개인정보를 제3자 제공에 동의합니다.</span>
              </label>
              <div className="flex flex-wrap items-center justify-end gap-2">
                <span>임차인 성명 :</span>
                <span className="min-w-28 border-b border-foreground/50 px-1 text-center">
                  {data.lessee_name || "    "}
                </span>
                <span>(서명 또는 날인)</span>
              </div>
            </div>
            <p className="text-[10px] leading-snug">
              ※ 임차인은 본 개인정보 제공에 대한 동의를 거부할 수 있으며, 이 경우 임대사업자의 의무사항 준수 여부(임대보증금에
              대한 보증가입 정보 포함), 임차인 권리, 등록임대주택에 관한 정보 등의 제공이 제한되어 불이익을 받을 수 있습니다.
            </p>
          </section>
        </article>

        <div className="mt-3 space-y-3 print:hidden">
          <div className="overflow-hidden rounded-sm border border-foreground/30">
            <div className="bg-cyan-50 px-2 py-1.5 text-[12px] font-semibold text-cyan-950">계약서별지 출력용</div>
            <p className="px-2 py-1.5 text-[11px] leading-snug text-sky-700">
              ※ 표준임대차계약서는 법정양식이므로 공동거래인은 계약서 인쇄시 별지에 출력되며, 확인설명서 인쇄시 추가임대인1명
              추가임차인1명 까지는 별지 없이 출력 됩니다.
            </p>
            <table className="w-full border-collapse">
              <tbody>
                <tr>
                  <Th className="w-24 bg-muted/50">공동임대인</Th>
                  <Td>
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-1">
                        <span className="shrink-0 text-[11px] text-muted-foreground">주 소(도로명)</span>
                        <Cell
                          name="co_lessor_address"
                          data={data}
                          className="min-w-[12rem] flex-1"
                          placeholder="도로명주소를 모르는 경우 우측에 도로명 검색을 클릭하세요!"
                        />
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] text-muted-foreground">주민등록번호</span>
                        <Cell name="co_lessor_id_front" data={data} className="w-24" inputMode="numeric" maxLength={6} />
                        <span>-</span>
                        <Cell name="co_lessor_id_back" data={data} className="w-28" inputMode="numeric" maxLength={7} />
                        <span className="text-[11px] text-muted-foreground">전화</span>
                        <Cell name="co_lessor_phone" data={data} className="w-32" />
                        <span className="text-[11px] text-muted-foreground">성명</span>
                        <Cell name="co_lessor_name" data={data} className="w-28" />
                      </div>
                    </div>
                  </Td>
                </tr>
                <tr>
                  <Th className="bg-muted/50">공동임차인</Th>
                  <Td>
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-1">
                        <span className="shrink-0 text-[11px] text-muted-foreground">주 소(도로명)</span>
                        <Cell
                          name="co_lessee_address"
                          data={data}
                          className="min-w-[12rem] flex-1"
                          placeholder="도로명주소를 모르는 경우 우측에 도로명 검색을 클릭하세요!"
                        />
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] text-muted-foreground">주민등록번호</span>
                        <Cell name="co_lessee_id_front" data={data} className="w-24" inputMode="numeric" maxLength={6} />
                        <span>-</span>
                        <Cell name="co_lessee_id_back" data={data} className="w-28" inputMode="numeric" maxLength={7} />
                        <span className="text-[11px] text-muted-foreground">전화</span>
                        <Cell name="co_lessee_phone" data={data} className="w-32" />
                        <span className="text-[11px] text-muted-foreground">성명</span>
                        <Cell name="co_lessee_name" data={data} className="w-28" />
                      </div>
                    </div>
                  </Td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="overflow-hidden rounded-sm border border-foreground/30">
            <div className="bg-cyan-50 px-2 py-1.5 text-[12px] font-semibold text-cyan-950">
              계약서별지 및 확인설명서 출력용
            </div>
            <p className="px-2 py-1.5 text-[11px] leading-snug text-sky-700">
              ※ 표준임대차계약서는 법정양식이므로 공동중개사는 계약서 인쇄시 별지에 인쇄되며, 확인설명서 인쇄시
              추가공동중개사1명 까지는 별지 없이 인쇄됩니다.
            </p>
            <table className="w-full border-collapse">
              <tbody>
                <tr>
                  <Th className="w-28 bg-muted/50">
                    개업(공동)
                    <br />
                    공인중개사
                  </Th>
                  <Td>
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-1">
                        <span className="w-20 shrink-0 text-[11px] text-muted-foreground">사무소 소재지</span>
                        <Cell name="joint_office_address" data={data} className="min-w-[12rem] flex-1" />
                      </div>
                      <div className="flex flex-wrap items-center gap-1">
                        <span className="w-20 shrink-0 text-[11px] text-muted-foreground">사무소 명칭</span>
                        <Cell name="joint_office_name" data={data} className="min-w-[12rem] flex-1" />
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] text-muted-foreground">전화 번호</span>
                        <Cell name="joint_office_phone" data={data} className="w-32" />
                        <span className="text-[11px] text-muted-foreground">등록 번호</span>
                        <Cell name="joint_office_registration_no" data={data} className="w-36" />
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] text-muted-foreground">대표자 명</span>
                        <Cell name="joint_office_representative" data={data} className="w-28" />
                        <span className="text-[11px] text-muted-foreground">( 자필 서명 )</span>
                        <span className="text-[11px] text-muted-foreground">소속공인중개사</span>
                        <Cell name="joint_agent_name" data={data} className="w-28" />
                        <span className="text-[11px] text-muted-foreground">( 자필 서명 )</span>
                      </div>
                    </div>
                  </Td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </Page>

    </div>
  );
}
