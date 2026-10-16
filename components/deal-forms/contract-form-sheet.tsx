"use client";

import { useMemo, useState } from "react";
import { DatePicker } from "@/components/form/date-picker";
import { NativeSelect } from "@/components/form/native-select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  BUILDING_STRUCTURES,
  BUILDING_USES,
  LAND_CATEGORIES,
  contractArticlesForDeal,
  type ContractDealType,
  type ContractPropertyType,
} from "@/lib/contract-templates";
import { formatNumberInput, manwonToHangul } from "@/lib/money";
import { cn } from "@/lib/utils";

const CUSTOM_OPTION = "직접입력";

const ASSUME_OPTIONS = [
  { value: "승계", label: "현 상태에서 매수인이 승계함." },
  { value: "말소", label: "매도인이 말소함." },
  { value: "해당없음", label: "해당없음" },
] as const;

const fieldBorder =
  "rounded-md border-2 border-foreground/35 bg-background shadow-none focus-visible:border-foreground/60 focus-visible:ring-1";

function parseManwon(raw: string) {
  const n = Number(String(raw).replace(/,/g, "").trim());
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

/** 만원 저장값 ↔ 원 표시(쉼표). 폼 hidden에는 만원을 넣는다. */
function WonAmountInput({
  name,
  manwon,
  onManwonChange,
  className,
}: {
  name: string;
  manwon: string;
  onManwonChange?: (manwon: string) => void;
  className?: string;
}) {
  const won = parseManwon(manwon) * 10_000;
  const display = won > 0 ? formatNumberInput(String(won)) : "";

  return (
    <div className={cn("flex min-w-0 flex-1 items-center gap-1.5", className)}>
      <Input
        inputMode="numeric"
        autoComplete="off"
        value={display}
        onChange={(e) => {
          if (!onManwonChange) return;
          const digits = e.target.value.replace(/\D/g, "").replace(/^0+(?=\d)/, "").slice(0, 15);
          if (!digits) {
            onManwonChange("");
            return;
          }
          onManwonChange(String(Math.floor(Number(digits) / 10_000)));
        }}
        placeholder="0"
        className={cn("h-8 min-w-0 flex-1 text-sm tabular-nums", fieldBorder)}
      />
      <span className="shrink-0 text-muted-foreground">원</span>
      <input type="hidden" name={name} value={manwon} />
    </div>
  );
}

/** 잔금: 자동 계산된 한글 금액(수정 불가). 금액 인풋과 너비 맞춤용으로 '원' 자리를 비워 둔다. */
function BalanceHangulInput({ name, manwon }: { name: string; manwon: string }) {
  const hangul = manwonToHangul(parseManwon(manwon)).replace(/원$/, "");
  return (
    <div className="flex min-w-0 flex-1 items-center gap-1.5">
      <Input
        readOnly
        tabIndex={-1}
        value={hangul}
        placeholder="자동 계산"
        className={cn("h-8 min-w-0 flex-1 bg-muted/30 text-sm", fieldBorder)}
      />
      <span className="invisible shrink-0 select-none" aria-hidden>
        원
      </span>
      <input type="hidden" name={name} value={manwon} />
    </div>
  );
}

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
      className={cn("h-8 border-0 bg-transparent px-1 shadow-none focus-visible:ring-1", className)}
      {...props}
    />
  );
}

/** 드롭다운 + 직접입력. 폼에는 name으로 실제 값만 제출한다. */
function SelectOrCustom({
  name,
  options,
  defaultValue,
  fallback,
  className,
}: {
  name: string;
  options: readonly string[];
  defaultValue?: string;
  fallback: string;
  className?: string;
}) {
  const preset = options.filter((o) => o !== CUSTOM_OPTION);
  const initial = (defaultValue ?? "").trim();
  const startsCustom = Boolean(initial) && !preset.includes(initial);
  const [choice, setChoice] = useState(startsCustom ? CUSTOM_OPTION : initial || fallback);
  const [custom, setCustom] = useState(startsCustom ? initial : "");
  const isCustom = choice === CUSTOM_OPTION;
  const selectOptions = preset.includes(CUSTOM_OPTION) ? [...preset] : [...preset, CUSTOM_OPTION];

  return (
    <div className={cn("flex min-w-0 flex-1 items-center gap-1.5", className)}>
      <NativeSelect
        value={isCustom ? CUSTOM_OPTION : choice}
        onChange={(e) => {
          const next = e.target.value;
          setChoice(next);
          if (next !== CUSTOM_OPTION) setCustom("");
        }}
        options={selectOptions}
        className={cn("min-w-0", isCustom ? "w-[6.5rem] shrink-0 flex-none" : "flex-1")}
        selectClassName="h-8 rounded-md border-2 border-foreground/35 bg-background pr-7 pl-1.5 shadow-none focus-visible:border-foreground/60 focus-visible:ring-1 app:h-8 app:border-foreground/35 app:pl-1.5"
      />
      {isCustom ? (
        <Input
          name={name}
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          placeholder="직접 입력"
          className="h-8 min-w-0 flex-1 rounded-md border-2 border-foreground/35 bg-background px-1.5 shadow-none focus-visible:border-foreground/60 focus-visible:ring-1"
        />
      ) : (
        <input type="hidden" name={name} value={choice} />
      )}
    </div>
  );
}

/** 라벨(회색) + 입력 한 줄 셀 */
function InlineField({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex min-w-0 items-stretch border-r last:border-r-0", className)}>
      <span className="flex shrink-0 items-center bg-muted/40 px-2 py-1 text-[11px] font-medium whitespace-nowrap">
        {label}
      </span>
      <div className="flex min-w-0 flex-1 items-center gap-1 px-1.5 py-0.5">{children}</div>
    </div>
  );
}

function parseLandRatio(data: Record<string, string>) {
  if (data.land_right_ratio_den || data.land_right_ratio_num) {
    return { den: data.land_right_ratio_den ?? "", num: data.land_right_ratio_num ?? "" };
  }
  const m = (data.land_right_ratio ?? "").match(/^(.+?)\s*분의\s*(.+)$/);
  if (m) return { den: m[1].trim(), num: m[2].trim() };
  return { den: data.land_right_ratio ?? "", num: "" };
}

function TermsRow({
  label,
  amount,
  mid,
  detail,
}: {
  label: string;
  amount: React.ReactNode;
  /** 가운데 칸: 원정 / 원정은 */
  mid: React.ReactNode;
  detail?: React.ReactNode;
}) {
  return (
    <tr className="border-b">
      <th className="w-24 border-r bg-muted/40 px-2 py-1 text-left align-middle text-[12px] font-medium whitespace-nowrap">
        {label}
      </th>
      <td className="px-2 py-1">
        <div className="grid w-full min-w-0 grid-cols-[5fr_1fr_4fr] items-center gap-1.5 text-[12px]">
          <div className="flex min-w-0 items-center gap-1.5">
            <span className="shrink-0 text-muted-foreground">一金</span>
            {amount}
          </div>
          <div className="flex min-w-0 items-center justify-center whitespace-nowrap text-muted-foreground">
            {mid}
          </div>
          <div className="flex min-w-0 items-center gap-1.5 overflow-hidden">{detail}</div>
        </div>
      </td>
    </tr>
  );
}

function ContractTermsTable({
  dealType,
  data,
}: {
  dealType: ContractDealType;
  data: Record<string, string>;
}) {
  const isSale = dealType === "매매";
  const priceLabel = isSale ? "매매대금" : dealType === "전세" ? "전세보증금" : "보증금";

  const [amount, setAmount] = useState(data.amount ?? "");
  const [monthlyRent, setMonthlyRent] = useState(data.monthly_rent ?? "");
  const [down, setDown] = useState(data.down_payment ?? "");
  const [loan, setLoan] = useState(data.loan_amount ?? "");
  const [loanAssume, setLoanAssume] = useState(data.loan_assume || "승계");
  const [deposit, setDeposit] = useState(data.current_deposit ?? "");
  const [depositAssume, setDepositAssume] = useState(data.deposit_assume || data.loan_assume || "승계");
  const [interim1, setInterim1] = useState(data.interim_payment_1 ?? "");
  const [interim2, setInterim2] = useState(data.interim_payment_2 ?? "");

  const balanceManwon = useMemo(() => {
    const total = parseManwon(amount);
    if (!total) return 0;
    let paid =
      parseManwon(down) + parseManwon(interim1) + parseManwon(interim2);
    if (isSale) {
      if (loanAssume === "승계") paid += parseManwon(loan);
      if (depositAssume === "승계") paid += parseManwon(deposit);
    }
    return Math.max(0, total - paid);
  }, [amount, down, interim1, interim2, isSale, loan, loanAssume, deposit, depositAssume]);

  const balanceStr = balanceManwon > 0 ? String(balanceManwon) : "";

  return (
    <>
      {!isSale && (
        <>
          <input type="hidden" name="loan_amount" value={data.loan_amount ?? ""} />
          <input type="hidden" name="loan_assume" value={data.loan_assume || "승계"} />
          <input type="hidden" name="current_deposit" value={data.current_deposit ?? ""} />
          <input type="hidden" name="deposit_assume" value={data.deposit_assume || "승계"} />
        </>
      )}
      {isSale || dealType !== "월세" ? (
        <input type="hidden" name="monthly_rent" value={data.monthly_rent ?? ""} />
      ) : null}
      <input type="hidden" name="down_payment_date" value={data.down_payment_date ?? ""} />
      <table className="w-full border-collapse border text-sm">
        <tbody>
          <TermsRow
            label={priceLabel}
            amount={<WonAmountInput name="amount" manwon={amount} onManwonChange={setAmount} />}
            mid="원정"
            detail={
              amount ? (
                <span className="text-muted-foreground tabular-nums">
                  (₩ {formatNumberInput(String(parseManwon(amount) * 10_000))})
                </span>
              ) : null
            }
          />
          {!isSale && dealType === "월세" && (
            <TermsRow
              label="월세"
              amount={<WonAmountInput name="monthly_rent" manwon={monthlyRent} onManwonChange={setMonthlyRent} />}
              mid="원정"
            />
          )}
          <TermsRow
            label="계약금"
            amount={<WonAmountInput name="down_payment" manwon={down} onManwonChange={setDown} />}
            mid="원정은"
            detail={
              <p className="flex min-w-0 items-center gap-0.5 whitespace-nowrap text-[15px] text-muted-foreground">
                <span className="truncate">계약시에 지불하고 영수함. 영수자(</span>
                <span className="inline-block w-14 shrink-0 border-b border-foreground/50 text-center text-[10px] text-muted-foreground/60">
                  자필서명
                </span>
                <span className="shrink-0">) (인)</span>
              </p>
            }
          />
          {isSale && (
            <>
              <TermsRow
                label="융자금"
                amount={<WonAmountInput name="loan_amount" manwon={loan} onManwonChange={setLoan} />}
                mid="원정은"
                detail={
                  <NativeSelect
                    name="loan_assume"
                    value={loanAssume}
                    onChange={(e) => setLoanAssume(e.target.value)}
                    options={[...ASSUME_OPTIONS]}
                    className="min-w-0 w-full"
                    selectClassName={cn("h-8", fieldBorder, "app:h-8")}
                  />
                }
              />
              <TermsRow
                label="현 임대보증금"
                amount={<WonAmountInput name="current_deposit" manwon={deposit} onManwonChange={setDeposit} />}
                mid="원정은"
                detail={
                  <NativeSelect
                    name="deposit_assume"
                    value={depositAssume}
                    onChange={(e) => setDepositAssume(e.target.value)}
                    options={[...ASSUME_OPTIONS]}
                    className="min-w-0 w-full"
                    selectClassName={cn("h-8", fieldBorder, "app:h-8")}
                  />
                }
              />
            </>
          )}
          <TermsRow
            label="중도금1"
            amount={<WonAmountInput name="interim_payment_1" manwon={interim1} onManwonChange={setInterim1} />}
            mid="원정은"
            detail={
              <>
                <DatePicker
                  name="interim_date_1"
                  defaultValue={data.interim_date_1 ?? ""}
                  className="min-w-0 flex-1"
                  inputClassName="h-8"
                />
                <span className="shrink-0 text-muted-foreground">일에 지불한다.</span>
              </>
            }
          />
          <TermsRow
            label="중도금2"
            amount={<WonAmountInput name="interim_payment_2" manwon={interim2} onManwonChange={setInterim2} />}
            mid="원정은"
            detail={
              <>
                <DatePicker
                  name="interim_date_2"
                  defaultValue={data.interim_date_2 ?? ""}
                  className="min-w-0 flex-1"
                  inputClassName="h-8"
                />
                <span className="shrink-0 text-muted-foreground">일에 지불한다.</span>
              </>
            }
          />
          <TermsRow
            label="잔금"
            amount={<BalanceHangulInput name="balance_amount" manwon={balanceStr} />}
            mid="원정은"
            detail={
              <>
                <DatePicker
                  name="balance_date"
                  defaultValue={data.balance_date ?? ""}
                  className="min-w-0 flex-1"
                  inputClassName="h-8"
                />
                <span className="shrink-0 text-muted-foreground">일에 지불한다.</span>
              </>
            }
          />
        </tbody>
      </table>
    </>
  );
}

/** PDF형 계약서 본문. 인쇄 시 A4로 출력한다 */
export function ContractFormSheet({
  propertyType,
  dealType,
  title,
  data,
}: {
  propertyType: ContractPropertyType;
  dealType: ContractDealType;
  title: string;
  data: Record<string, string>;
}) {
  const isSale = dealType === "매매";
  const landRatio = parseLandRatio(data);
  const buildingUseDefault =
    data.building_use ||
    (BUILDING_USES.includes(propertyType as (typeof BUILDING_USES)[number]) ? propertyType : "아파트");

  return (
    <div
      id="contract-print-root"
      className="space-y-6 bg-white text-[13px] text-foreground print:space-y-4 print:text-[11px]"
    >
      <header className="space-y-1 text-center print:pt-2">
        <h2 className="text-xl font-bold tracking-tight print:text-lg">{title}</h2>
        <p className="text-xs text-muted-foreground print:hidden">
          {propertyType} · {dealType} · 인쇄 시 제공하신 PDF와 같은 항목으로 출력돼요
        </p>
      </header>

      {/* 1. 부동산의 표시 */}
      <section>
        <h3 className="mb-2 font-bold">1. 부동산의 표시</h3>
        <table className="w-full border-collapse border text-sm">
          <tbody>
            <tr className="border-b">
              <th className="w-28 border-r bg-muted/40 px-2 py-1.5 text-left">소재지</th>
              <td className="px-2 py-1">
                <div className="flex flex-wrap items-center gap-2">
                  <CellInput
                    name="property_address"
                    data={data}
                    className={cn("min-w-0 flex-1 bg-background px-1.5", fieldBorder)}
                    placeholder="주소"
                  />
                  <span className="text-muted-foreground">동</span>
                  <CellInput
                    name="building"
                    data={data}
                    className={cn("w-16 bg-background px-1.5", fieldBorder)}
                  />
                  <span className="text-muted-foreground">호</span>
                  <CellInput
                    name="unit"
                    data={data}
                    className={cn("w-16 bg-background px-1.5", fieldBorder)}
                  />
                </div>
              </td>
            </tr>
            <tr className="border-b">
              <th className="w-14 border-r bg-muted/40 px-2 py-1.5 text-left align-middle whitespace-nowrap">
                토지
              </th>
              <td className="p-0">
                <div className="flex min-w-0 flex-wrap items-stretch">
                  <InlineField label="지목" className="min-w-[9rem] flex-1">
                    <SelectOrCustom
                      name="land_category"
                      options={LAND_CATEGORIES}
                      defaultValue={data.land_category}
                      fallback="대"
                    />
                  </InlineField>
                  <InlineField label="면적" className="min-w-[8rem] flex-1">
                    <CellInput
                      name="land_area"
                      data={data}
                      inputMode="decimal"
                      className={cn("min-w-0 flex-1 bg-background px-1.5", fieldBorder)}
                    />
                    <span className="shrink-0 text-muted-foreground">㎡</span>
                  </InlineField>
                  <InlineField label="대지권종류" className="min-w-[7rem] flex-1">
                    <CellInput
                      name="land_right_type"
                      data={data}
                      className={cn("min-w-0 flex-1 bg-background px-1.5", fieldBorder)}
                    />
                  </InlineField>
                  <InlineField label="대지권비율" className="min-w-[9rem] flex-[1.2] border-r-0">
                    <CellInput
                      name="land_right_ratio_den"
                      data={{ land_right_ratio_den: landRatio.den }}
                      className={cn("w-14 bg-background px-1 text-right", fieldBorder)}
                    />
                    <span className="shrink-0 text-muted-foreground">분의</span>
                    <CellInput
                      name="land_right_ratio_num"
                      data={{ land_right_ratio_num: landRatio.num }}
                      className={cn("w-14 bg-background px-1", fieldBorder)}
                    />
                  </InlineField>
                </div>
              </td>
            </tr>
            <tr>
              <th className="w-14 border-r bg-muted/40 px-2 py-1.5 text-left align-middle whitespace-nowrap">
                건물
              </th>
              <td className="p-0">
                <div className="flex min-w-0 flex-wrap items-stretch">
                  <InlineField label="구조" className="min-w-[12rem] flex-[1.4]">
                    <SelectOrCustom
                      name="building_structure"
                      options={BUILDING_STRUCTURES}
                      defaultValue={data.building_structure}
                      fallback="철근콘크리트구조"
                    />
                  </InlineField>
                  <InlineField label="용도" className="min-w-[12rem] flex-[1.6]">
                    <SelectOrCustom
                      name="building_use"
                      options={BUILDING_USES}
                      defaultValue={buildingUseDefault}
                      fallback="아파트"
                    />
                  </InlineField>
                  <InlineField label="면적" className="min-w-[7rem] flex-1 border-r-0">
                    <CellInput
                      name="building_area"
                      data={data}
                      inputMode="decimal"
                      className={cn("min-w-0 flex-1 bg-background px-1.5", fieldBorder)}
                    />
                    <span className="shrink-0 text-muted-foreground">㎡</span>
                  </InlineField>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* 2. 계약내용 */}
      <section>
        <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
          <h3 className="font-bold">2. 계약내용</h3>
          <p className="text-[11px] text-muted-foreground print:hidden">입력·표시: 원 (저장은 만원 단위)</p>
        </div>
        <p className="mb-2 text-[12px] text-muted-foreground">
          제1조 위 부동산의 {isSale ? "매매" : "임대차"}에 대하여 당사자는 합의에 의하여 대금을 아래와 같이 지불하기로 한다.
        </p>
        <ContractTermsTable dealType={dealType} data={data} />
      </section>

      {/* 일반조항 제2조~제8조 + 추가 특약 */}
      <section className="space-y-3">
        <div className="space-y-2.5 rounded-md border px-3 py-3 text-[12px] leading-relaxed print:border-foreground/40 print:text-[10px]">
          {contractArticlesForDeal(dealType).map((article) => (
            <div key={article.no} className="text-justify">
              <strong className="mr-1">
                제{article.no}조 [{article.title}]
              </strong>
              {"bodyBeforeDate" in article ? (
                <span className="inline">
                  {article.bodyBeforeDate}{" "}
                  <DatePicker
                    name="delivery_date"
                    defaultValue={data.delivery_date ?? data.move_in_date ?? ""}
                    className="mx-1 inline-flex min-w-36 align-baseline"
                    inputClassName="h-7 border-0 border-b border-dotted border-foreground/50 rounded-none px-1"
                  />{" "}
                  {article.bodyAfterDate}
                </span>
              ) : (
                <span>{article.body}</span>
              )}
            </div>
          ))}
        </div>
        <div className="space-y-1.5">
          <h3 className="font-bold">특약사항</h3>
          <Textarea
            name="special_terms"
            defaultValue={data.special_terms ?? ""}
            rows={4}
            className={cn("text-sm", fieldBorder)}
            placeholder="당사자 간 추가 특약이 있으면 기재하세요"
          />
        </div>
      </section>

      {/* 당사자 */}
      <section>
        <h3 className="mb-2 font-bold">당사자 표시</h3>
        <table className="w-full border-collapse border text-sm">
          <tbody>
            <tr className="border-b">
              <th className="w-28 border-r bg-muted/40 px-2 py-1.5 text-left">{isSale ? "매도인" : "임대인"}</th>
              <td className="px-2 py-1">
                <div className="grid gap-2 sm:grid-cols-2">
                  <CellInput name="lessor_name" data={data} placeholder="성명" />
                  <CellInput name="lessor_phone" data={data} placeholder="전화" />
                  <CellInput name="lessor_account" data={data} placeholder="입금 계좌" className="sm:col-span-2" />
                </div>
              </td>
            </tr>
            <tr>
              <th className="border-r bg-muted/40 px-2 py-1.5 text-left">{isSale ? "매수인" : "임차인"}</th>
              <td className="px-2 py-1">
                <div className="grid gap-2 sm:grid-cols-2">
                  <CellInput name="lessee_name" data={data} placeholder="성명" />
                  <CellInput name="lessee_phone" data={data} placeholder="전화" />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="grid gap-2 border-t pt-4 text-sm sm:grid-cols-2">
        <div>
          <p className="text-xs text-muted-foreground">중개사무소</p>
          <CellInput name="office_name" data={data} />
          <CellInput name="office_address" data={data} placeholder="주소" />
          <CellInput name="office_phone" data={data} placeholder="전화" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">담당 중개사</p>
          <CellInput name="agent_name" data={data} />
          <CellInput name="agent_phone" data={data} placeholder="전화" />
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs text-muted-foreground">계약일</span>
            <DatePicker name="contract_date" defaultValue={data.contract_date ?? ""} className="w-44" />
          </div>
        </div>
      </section>

      {/* 숨김 메타 */}
      <input type="hidden" name="property_type" value={propertyType} />
      <input type="hidden" name="deal_type" value={dealType} />
      <input type="hidden" name="property_title" defaultValue={data.property_title ?? ""} />
      <input type="hidden" name="expiry_date" defaultValue={data.expiry_date ?? ""} />
      <input type="hidden" name="memo" defaultValue={data.memo ?? ""} />
      <input type="hidden" name="completed" defaultValue={data.completed ?? ""} />
      <input type="hidden" name="sender_name" defaultValue={data.sender_name ?? ""} />
      <input type="hidden" name="receiver_name" defaultValue={data.receiver_name ?? ""} />
      <input type="hidden" name="contract_no" defaultValue={data.contract_no ?? ""} />
      <input type="hidden" name="terms_note" defaultValue={data.terms_note ?? ""} />
      <input type="hidden" name="extra_note" defaultValue={data.extra_note ?? ""} />
      <input type="hidden" name="move_in_date" defaultValue={data.move_in_date ?? data.delivery_date ?? ""} />
      <input type="hidden" name="template_id" defaultValue={data.template_id ?? ""} />
      <input type="hidden" name="template_title" defaultValue={data.template_title ?? title} />
    </div>
  );
}
