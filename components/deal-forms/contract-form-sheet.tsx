"use client";

import { useMemo, useState } from "react";
import { DatePicker } from "@/components/form/date-picker";
import { NativeSelect } from "@/components/form/native-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  BUILDING_STRUCTURES,
  BUILDING_USES,
  DEFAULT_LEASE_MONTHS,
  DEFAULT_RENT_ARREARS,
  LAND_CATEGORIES,
  LEASE_MONTH_OPTIONS,
  RENT_ARREARS_OPTIONS,
  addMonthsToYmd,
  contractArticle1Text,
  contractArticlesForDeal,
  defaultSpecialTermsForDeal,
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

function normalizeLeaseMonths(raw: string | undefined) {
  const n = Number(raw);
  if (Number.isFinite(n) && n >= 1 && n <= 24) return String(Math.floor(n));
  return DEFAULT_LEASE_MONTHS;
}

/** 임대차 제2조 [존속기간]: 인도일·만기일·계약개월(1~24, 기본 24) */
function LeaseTermClause({ data }: { data: Record<string, string> }) {
  const [months, setMonths] = useState(() => normalizeLeaseMonths(data.lease_months));
  const [delivery, setDelivery] = useState(
    () => data.delivery_date ?? data.move_in_date ?? ""
  );
  const [leaseStart, setLeaseStart] = useState(
    () =>
      data.lease_start_date ||
      data.delivery_date ||
      data.move_in_date ||
      ""
  );
  const [expiry, setExpiry] = useState(() => {
    if (data.expiry_date) return data.expiry_date;
    const start =
      data.lease_start_date ||
      data.delivery_date ||
      data.move_in_date ||
      "";
    return start
      ? addMonthsToYmd(start, Number(normalizeLeaseMonths(data.lease_months)))
      : "";
  });
  const [dayRule, setDayRule] = useState(data.day_count_rule || "초일불산입");

  const syncExpiry = (start: string, monthStr: string) => {
    if (!start) return;
    const next = addMonthsToYmd(start, Number(monthStr));
    if (next) setExpiry(next);
  };

  return (
    <span className="inline">
      임대인은 위 부동산을 임대차 목적대로 사용할 수 있는 상태로{" "}
      <DatePicker
        name="delivery_date"
        value={delivery}
        onChange={(v) => {
          setDelivery(v);
          if (!leaseStart || leaseStart === delivery) {
            setLeaseStart(v);
            syncExpiry(v, months);
          }
        }}
        className="mx-1 inline-flex min-w-36 align-baseline"
        inputClassName="h-7 border-0 border-b border-dotted border-foreground/50 rounded-none px-1"
      />{" "}
      까지 임차인에게 인도하며, 임대차 기간은{" "}
      <DatePicker
        name="lease_start_date"
        value={leaseStart}
        onChange={(v) => {
          setLeaseStart(v);
          syncExpiry(v, months);
        }}
        className="mx-1 inline-flex min-w-36 align-baseline"
        inputClassName="h-7 border-0 border-b border-dotted border-foreground/50 rounded-none px-1"
      />{" "}
      부터{" "}
      <DatePicker
        name="expiry_date"
        value={expiry}
        onChange={setExpiry}
        className="mx-1 inline-flex min-w-36 align-baseline"
        inputClassName="h-7 border-0 border-b border-dotted border-foreground/50 rounded-none px-1"
      />{" "}
      (
      <NativeSelect
        name="lease_months"
        value={months}
        onChange={(e) => {
          const next = normalizeLeaseMonths(e.target.value);
          setMonths(next);
          syncExpiry(leaseStart || delivery, next);
        }}
        options={LEASE_MONTH_OPTIONS.map((m) => ({ value: m, label: m }))}
        className="mx-1 inline-flex w-16 align-baseline"
        selectClassName={cn(
          "h-7 border-0 border-b border-dotted border-foreground/50 rounded-none px-1 pr-6",
          "focus-visible:ring-0"
        )}
        aria-label="계약 기간(개월)"
      />{" "}
      개월)까지로 한다.{" "}
      <NativeSelect
        name="day_count_rule"
        value={dayRule}
        onChange={(e) => setDayRule(e.target.value)}
        options={["초일불산입", "초일산입"]}
        className="mx-1 inline-flex w-28 align-baseline print:hidden"
        selectClassName={cn(
          "h-7 border-0 border-b border-dotted border-foreground/50 rounded-none px-1 pr-6",
          "focus-visible:ring-0"
        )}
        aria-label="초일 산입 여부"
      />
    </span>
  );
}

/** 임대차 제4조 [계약의 해지]: 차임 연체 기수 선택(기본 2기) */
function LeaseTerminateClause({
  data,
  bodyBefore,
  bodyAfter,
}: {
  data: Record<string, string>;
  bodyBefore: string;
  bodyAfter: string;
}) {
  const [periods, setPeriods] = useState(() => {
    const v = data.rent_arrears_periods;
    return RENT_ARREARS_OPTIONS.includes(v as (typeof RENT_ARREARS_OPTIONS)[number])
      ? v
      : DEFAULT_RENT_ARREARS;
  });

  return (
    <span className="inline">
      {bodyBefore}{" "}
      <NativeSelect
        name="rent_arrears_periods"
        value={periods}
        onChange={(e) => setPeriods(e.target.value)}
        options={[...RENT_ARREARS_OPTIONS]}
        className="mx-1 inline-flex w-16 align-baseline"
        selectClassName={cn(
          "h-7 border-0 border-b border-dotted border-foreground/50 rounded-none px-1 pr-6",
          "focus-visible:ring-0"
        )}
        aria-label="차임 연체 기준"
      />{" "}
      {bodyAfter}
    </span>
  );
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
          const digits = e.target.value
            .replace(/\D/g, "")
            .replace(/^0+(?=\d)/, "")
            .slice(0, 15);
          if (!digits) {
            onManwonChange("");
            return;
          }
          onManwonChange(String(Math.floor(Number(digits) / 10_000)));
        }}
        placeholder="0"
        className={cn(
          "h-8 min-w-0 flex-1 text-[14px] tabular-nums md:text-[14px] app:text-[14px]",
          fieldBorder
        )}
      />
      <span className="shrink-0 text-muted-foreground">원</span>
      <input type="hidden" name={name} value={manwon} />
    </div>
  );
}

/** 잔금: 자동 계산된 한글 금액(수정 불가). 금액 인풋과 너비 맞춤용으로 '원' 자리를 비워 둔다. */
function BalanceHangulInput({
  name,
  manwon,
}: {
  name: string;
  manwon: string;
}) {
  const hangul = manwonToHangul(parseManwon(manwon)).replace(/원$/, "");
  return (
    <div className="flex min-w-0 flex-1 items-center gap-1.5">
      <Input
        readOnly
        tabIndex={-1}
        value={hangul}
        placeholder="자동 계산"
        className={cn(
          "h-8 min-w-0 flex-1 bg-muted/30 text-[14px] md:text-[14px] app:text-[14px]",
          fieldBorder
        )}
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
}: { name: string; data: Record<string, string> } & React.ComponentProps<
  typeof Input
>) {
  return (
    <Input
      name={name}
      defaultValue={data[name] ?? ""}
      className={cn(
        "h-8 border-0 bg-transparent px-1 text-[14px] shadow-none focus-visible:ring-1 md:text-[14px] app:text-[14px]",
        className
      )}
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
  const [choice, setChoice] = useState(
    startsCustom ? CUSTOM_OPTION : initial || fallback
  );
  const [custom, setCustom] = useState(startsCustom ? initial : "");
  const isCustom = choice === CUSTOM_OPTION;
  const selectOptions = preset.includes(CUSTOM_OPTION)
    ? [...preset]
    : [...preset, CUSTOM_OPTION];

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
        className={cn(
          "min-w-0",
          isCustom ? "w-[6.5rem] shrink-0 flex-none" : "flex-1"
        )}
        selectClassName="h-8 rounded-md border-2 border-foreground/35 bg-background pr-7 pl-1.5 text-[14px] shadow-none focus-visible:border-foreground/60 focus-visible:ring-1 app:h-8 app:border-foreground/35 app:pl-1.5 app:text-[14px]"
      />
      {isCustom ? (
        <Input
          name={name}
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          placeholder="직접 입력"
          className="h-8 min-w-0 flex-1 rounded-md border-2 border-foreground/35 bg-background px-1.5 text-[14px] shadow-none focus-visible:border-foreground/60 focus-visible:ring-1 md:text-[14px] app:text-[14px]"
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
    <div
      className={cn(
        "flex min-w-0 items-stretch border-r last:border-r-0",
        className
      )}
    >
      <span className="flex shrink-0 items-center bg-muted/40 px-2 py-1 text-[14px] font-medium whitespace-nowrap leading-none">
        {label}
      </span>
      <div className="flex min-w-0 flex-1 items-center gap-1 px-1.5 py-0.5">
        {children}
      </div>
    </div>
  );
}

function parseLandRatio(data: Record<string, string>) {
  if (data.land_right_ratio_den || data.land_right_ratio_num) {
    return {
      den: data.land_right_ratio_den ?? "",
      num: data.land_right_ratio_num ?? "",
    };
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
  className,
}: {
  label: string;
  amount: React.ReactNode;
  /** 가운데 칸: 원정 / 원정은 */
  mid: React.ReactNode;
  detail?: React.ReactNode;
  className?: string;
}) {
  return (
    <tr className={cn("border-b", className)}>
      <th className="w-24 border-r bg-muted/40 px-2 py-1 text-left align-middle text-[14px] font-medium whitespace-nowrap">
        {label}
      </th>
      <td className="px-2 py-1">
        <div className="grid w-full min-w-0 grid-cols-[5fr_1fr_4fr] items-center gap-1.5 text-[14px]">
          <div className="flex min-w-0 items-center gap-1.5">
            <span className="shrink-0 text-muted-foreground">一金</span>
            {amount}
          </div>
          <div className="flex min-w-0 items-center justify-center whitespace-nowrap text-muted-foreground">
            {mid}
          </div>
          <div className="flex min-w-0 items-center gap-1.5 overflow-hidden">
            {detail}
          </div>
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
  const isMonthly = dealType === "월세";
  const priceLabel = isSale ? "매매대금" : "보증금";

  const [amount, setAmount] = useState(data.amount ?? "");
  const [monthlyRent, setMonthlyRent] = useState(data.monthly_rent ?? "");
  const [rentPayDay, setRentPayDay] = useState(data.rent_pay_day ?? "");
  const [rentPayTiming, setRentPayTiming] = useState(
    data.rent_pay_timing || "후불"
  );
  const [down, setDown] = useState(data.down_payment ?? "");
  const [loan, setLoan] = useState(data.loan_amount ?? "");
  const [loanAssume, setLoanAssume] = useState(data.loan_assume || "승계");
  const [deposit, setDeposit] = useState(data.current_deposit ?? "");
  const [depositAssume, setDepositAssume] = useState(
    data.deposit_assume || data.loan_assume || "승계"
  );
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
  }, [
    amount,
    down,
    interim1,
    interim2,
    isSale,
    loan,
    loanAssume,
    deposit,
    depositAssume,
  ]);

  const balanceStr = balanceManwon > 0 ? String(balanceManwon) : "";
  const hasDown = parseManwon(down) > 0;
  const hasLoan = parseManwon(loan) > 0;
  const hasDeposit = parseManwon(deposit) > 0;
  const hasInterim1 = parseManwon(interim1) > 0;
  const hasInterim2 = parseManwon(interim2) > 0;
  /** 인쇄: 금액 없는 행은 숨김. 매매는 잔금만 기본, 임대차는 보증금(+월세 차임) */
  const printOptional = (shown: boolean) => (shown ? undefined : "print:hidden");

  return (
    <>
      {!isSale && (
        <>
          <input
            type="hidden"
            name="loan_amount"
            value={data.loan_amount ?? ""}
          />
          <input
            type="hidden"
            name="loan_assume"
            value={data.loan_assume || "승계"}
          />
          <input
            type="hidden"
            name="current_deposit"
            value={data.current_deposit ?? ""}
          />
          <input
            type="hidden"
            name="deposit_assume"
            value={data.deposit_assume || "승계"}
          />
        </>
      )}
      {!isMonthly ? (
        <>
          <input
            type="hidden"
            name="monthly_rent"
            value={data.monthly_rent ?? ""}
          />
          <input
            type="hidden"
            name="rent_pay_day"
            value={data.rent_pay_day ?? ""}
          />
          <input
            type="hidden"
            name="rent_pay_timing"
            value={data.rent_pay_timing || "후불"}
          />
        </>
      ) : null}
      <input
        type="hidden"
        name="down_payment_date"
        value={data.down_payment_date ?? ""}
      />
      <table className="w-full border-collapse border text-[14px] print:border-b-0">
        <tbody>
          <TermsRow
            className={isSale ? "print:hidden" : undefined}
            label={priceLabel}
            amount={
              <WonAmountInput
                name="amount"
                manwon={amount}
                onManwonChange={setAmount}
              />
            }
            mid="원정"
            detail={
              amount ? (
                <span className="text-muted-foreground tabular-nums">
                  (₩ {formatNumberInput(String(parseManwon(amount) * 10_000))})
                </span>
              ) : null
            }
          />
          <TermsRow
            className={printOptional(hasDown)}
            label="계약금"
            amount={
              <WonAmountInput
                name="down_payment"
                manwon={down}
                onManwonChange={setDown}
              />
            }
            mid="원정은"
            detail={
              <p className="flex min-w-0 items-center gap-0.5 whitespace-nowrap text-[14px] text-muted-foreground">
                <span className="truncate">
                  계약시에 지불하고 영수함. 영수자(
                </span>
                <span className="inline-block w-14 shrink-0 border-b border-foreground/50 text-center text-[14px] text-muted-foreground/60">
                  자필서명
                </span>
                <span className="shrink-0">) (인)</span>
              </p>
            }
          />
          {isSale && (
            <>
              <TermsRow
                className={printOptional(hasLoan)}
                label="융자금"
                amount={
                  <WonAmountInput
                    name="loan_amount"
                    manwon={loan}
                    onManwonChange={setLoan}
                  />
                }
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
                className={printOptional(hasDeposit)}
                label="현 임대보증금"
                amount={
                  <WonAmountInput
                    name="current_deposit"
                    manwon={deposit}
                    onManwonChange={setDeposit}
                  />
                }
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
            className={printOptional(hasInterim1)}
            label="중도금1"
            amount={
              <WonAmountInput
                name="interim_payment_1"
                manwon={interim1}
                onManwonChange={setInterim1}
              />
            }
            mid="원정은"
            detail={
              <>
                <DatePicker
                  name="interim_date_1"
                  defaultValue={data.interim_date_1 ?? ""}
                  className="min-w-0 flex-1"
                  inputClassName="h-8"
                />
                <span className="shrink-0 text-muted-foreground">
                  일에 지불한다.
                </span>
              </>
            }
          />
          <TermsRow
            className={printOptional(hasInterim2)}
            label="중도금2"
            amount={
              <WonAmountInput
                name="interim_payment_2"
                manwon={interim2}
                onManwonChange={setInterim2}
              />
            }
            mid="원정은"
            detail={
              <>
                <DatePicker
                  name="interim_date_2"
                  defaultValue={data.interim_date_2 ?? ""}
                  className="min-w-0 flex-1"
                  inputClassName="h-8"
                />
                <span className="shrink-0 text-muted-foreground">
                  일에 지불한다.
                </span>
              </>
            }
          />
          <TermsRow
            className={cn(
              isSale
                ? undefined
                : printOptional(balanceManwon > 0 || Boolean(data.balance_date)),
              !isMonthly && "print:border-b-0"
            )}
            label="잔금"
            amount={
              <BalanceHangulInput name="balance_amount" manwon={balanceStr} />
            }
            mid="원정은"
            detail={
              <>
                <DatePicker
                  name="balance_date"
                  defaultValue={data.balance_date ?? ""}
                  className="min-w-0 flex-1"
                  inputClassName="h-8"
                />
                <span className="shrink-0 text-muted-foreground">
                  일에 지불한다.
                </span>
              </>
            }
          />
          {isMonthly && (
            <TermsRow
              className="print:border-b-0"
              label="차임"
              amount={
                <WonAmountInput
                  name="monthly_rent"
                  manwon={monthlyRent}
                  onManwonChange={setMonthlyRent}
                />
              }
              mid="원정은"
              detail={
                <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                  <span className="shrink-0 text-muted-foreground">매월</span>
                  <NativeSelect
                    name="rent_pay_day"
                    value={rentPayDay}
                    onChange={(e) => setRentPayDay(e.target.value)}
                    placeholder="없음"
                    options={Array.from({ length: 28 }, (_, i) => ({
                      value: String(i + 1),
                      label: `${i + 1}일`,
                    }))}
                    className="w-20 shrink-0"
                    selectClassName={cn("h-8", fieldBorder, "app:h-8")}
                  />
                  <NativeSelect
                    name="rent_pay_timing"
                    value={rentPayTiming}
                    onChange={(e) => setRentPayTiming(e.target.value)}
                    options={["선불", "후불"]}
                    className="w-20 shrink-0"
                    selectClassName={cn("h-8", fieldBorder, "app:h-8")}
                  />
                  <span className="shrink-0 text-muted-foreground">
                    로 지불한다.
                  </span>
                </div>
              }
            />
          )}
        </tbody>
      </table>
    </>
  );
}

const ID_TYPE_OPTIONS = ["주민등록번호", "외국인등록번호"] as const;
const MAX_PARTY_ROWS = 5;
const MAX_JOINT_OFFICES = 5;
/** 매도인·매수인·개업공인중개사 표 열 너비 통일 (역할 / 주소·소재지 라벨) */
const PARTY_COL_ROLE = "w-[7rem]";
const PARTY_COL_LABEL = "w-[7.5rem]";

function partyFieldKey(prefix: string, index: number, field: string) {
  return index === 0 ? `${prefix}_${field}` : `${prefix}_${index + 1}_${field}`;
}

function initialPartyCount(data: Record<string, string>, prefix: string) {
  const fromCount = Number(data[`${prefix}_count`]);
  let n = 1;
  for (let i = 2; i <= MAX_PARTY_ROWS; i++) {
    if (
      data[`${prefix}_${i}_name`] ||
      data[`${prefix}_${i}_address`] ||
      data[`${prefix}_${i}_phone`]
    ) {
      n = i;
    }
  }
  if (Number.isFinite(fromCount) && fromCount >= 1) {
    return Math.min(MAX_PARTY_ROWS, Math.max(n, Math.floor(fromCount)));
  }
  return n;
}

function jointFieldKey(index: number, field: string) {
  if (index === 0) {
    if (field === "agent_name") return "joint_agent_name";
    return `joint_office_${field}`;
  }
  if (field === "agent_name") return `joint_agent_${index + 1}_name`;
  return `joint_office_${index + 1}_${field}`;
}

function initialJointCount(data: Record<string, string>) {
  const fromCount = Number(data.joint_office_count);
  let n = 0;
  if (
    data.joint_office_name ||
    data.joint_office_address ||
    data.joint_office_phone ||
    data.joint_agent_name
  ) {
    n = 1;
  }
  for (let i = 2; i <= MAX_JOINT_OFFICES; i++) {
    if (
      data[`joint_office_${i}_name`] ||
      data[`joint_office_${i}_address`] ||
      data[`joint_agent_${i}_name`]
    ) {
      n = i;
    }
  }
  if (Number.isFinite(fromCount) && fromCount >= 0) {
    return Math.min(MAX_JOINT_OFFICES, Math.max(n, Math.floor(fromCount)));
  }
  return n;
}

/** 매도인·매수인 / 임대인·임차인 한 명분 입력 */
function PartyPersonRow({
  roleLabel,
  prefix,
  index,
  data,
  printStart,
}: {
  roleLabel: string;
  prefix: "lessor" | "lessee";
  index: number;
  data: Record<string, string>;
  /** 인쇄 시 이어진 당사자 블록의 첫 표 */
  printStart?: boolean;
}) {
  const address = partyFieldKey(prefix, index, "address");
  const idType = partyFieldKey(prefix, index, "id_type");
  const idFront = partyFieldKey(prefix, index, "id_front");
  const idBack = partyFieldKey(prefix, index, "id_back");
  const phone = partyFieldKey(prefix, index, "phone");
  const name = partyFieldKey(prefix, index, "name");
  const [idKind, setIdKind] = useState(
    () => data[idType] || "주민등록번호"
  );

  return (
    <table
      className={cn(
        "contract-party-table w-full table-fixed border-collapse border text-[14px]",
        printStart && "contract-party-start"
      )}
    >
      <colgroup>
        <col className={PARTY_COL_ROLE} />
        <col className={PARTY_COL_LABEL} />
        <col />
        <col />
        <col />
        <col />
        <col />
      </colgroup>
      <tbody>
        <tr className="border-b">
          <th
            rowSpan={2}
            className={cn(
              PARTY_COL_ROLE,
              "border-r bg-muted/40 px-2 py-1.5 text-left align-middle font-medium"
            )}
          >
            {roleLabel}
            {index > 0 ? ` ${index + 1}` : ""}
          </th>
          <th
            className={cn(
              PARTY_COL_LABEL,
              "border-r bg-muted/40 px-2 py-1.5 text-left font-medium whitespace-nowrap"
            )}
          >
            주소(도로명)
          </th>
          <td className="px-2 py-1" colSpan={5}>
            <CellInput
              name={address}
              data={data}
              placeholder="도로명 주소"
              className={cn("w-full bg-background px-1.5", fieldBorder)}
            />
          </td>
        </tr>
        <tr>
          <th
            className={cn(
              PARTY_COL_LABEL,
              "border-r bg-muted/40 px-2 py-1.5 text-left font-medium"
            )}
          >
            <NativeSelect
              name={idType}
              value={idKind}
              onChange={(e) => setIdKind(e.target.value)}
              options={[...ID_TYPE_OPTIONS]}
              className="w-full min-w-0"
              selectClassName="h-8 w-full border-0 bg-transparent px-0 pr-5 text-[13px] font-medium shadow-none focus-visible:ring-0 app:h-8 app:text-[13px]"
              aria-label="신분증 종류"
            />
          </th>
          <td className="px-2 py-1">
            <div className="flex min-w-0 items-center gap-1">
              <CellInput
                name={idFront}
                data={data}
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                className={cn("w-20 bg-background px-1.5", fieldBorder)}
              />
              <span className="text-muted-foreground">-</span>
              <CellInput
                name={idBack}
                data={data}
                inputMode="numeric"
                maxLength={7}
                placeholder="0000000"
                className={cn("w-24 bg-background px-1.5", fieldBorder)}
              />
            </div>
          </td>
          <th className="w-14 border-x bg-muted/40 px-2 py-1.5 text-left font-medium whitespace-nowrap">
            전화
          </th>
          <td className="px-2 py-1">
            <CellInput
              name={phone}
              data={data}
              type="tel"
              placeholder="전화"
              className={cn("w-full min-w-28 bg-background px-1.5", fieldBorder)}
            />
          </td>
          <th className="w-14 border-x bg-muted/40 px-2 py-1.5 text-left font-medium whitespace-nowrap">
            성명
          </th>
          <td className="px-2 py-1">
            <CellInput
              name={name}
              data={data}
              placeholder="성명"
              className={cn("w-full min-w-24 bg-background px-1.5", fieldBorder)}
            />
          </td>
        </tr>
      </tbody>
    </table>
  );
}

function PartyPersonList({
  roleLabel,
  prefix,
  count,
  data,
  printStart,
}: {
  roleLabel: string;
  prefix: "lessor" | "lessee";
  count: number;
  data: Record<string, string>;
  printStart?: boolean;
}) {
  return (
    <div className="space-y-2 print:space-y-0">
      <input type="hidden" name={`${prefix}_count`} value={String(count)} />
      {Array.from({ length: count }, (_, i) => (
        <PartyPersonRow
          key={`${prefix}-${i}`}
          roleLabel={roleLabel}
          prefix={prefix}
          index={i}
          data={data}
          printStart={printStart && i === 0}
        />
      ))}
    </div>
  );
}

/** 개업공인중개사 / 공동중개 사무소 한 블록 */
function BrokerOfficeBlock({
  title,
  index,
  data,
  primary,
  flushBottom,
}: {
  title: string;
  index: number;
  data: Record<string, string>;
  primary?: boolean;
  /** 인쇄 시 표 하단을 외곽선에 붙임 */
  flushBottom?: boolean;
}) {
  const address = primary ? "office_address" : jointFieldKey(index, "address");
  const name = primary ? "office_name" : jointFieldKey(index, "name");
  const representative = primary
    ? "office_representative"
    : jointFieldKey(index, "representative");
  const phone = primary ? "office_phone" : jointFieldKey(index, "phone");
  const registration = primary
    ? "office_registration_no"
    : jointFieldKey(index, "registration_no");
  const agentName = primary ? "agent_name" : jointFieldKey(index, "agent_name");

  return (
    <table
      className={cn(
        "contract-party-table w-full table-fixed border-collapse border text-[14px]",
        flushBottom && "contract-party-flush"
      )}
    >
      <colgroup>
        <col className={PARTY_COL_ROLE} />
        <col className={PARTY_COL_LABEL} />
        <col />
        <col />
        <col />
        <col />
        <col />
      </colgroup>
      <tbody>
        <tr className="border-b">
          <th
            rowSpan={3}
            className={cn(
              PARTY_COL_ROLE,
              "border-r bg-muted/40 px-2 py-1.5 text-left align-middle font-medium leading-snug"
            )}
          >
            {title}
            {!primary && index > 0 ? ` ${index + 1}` : ""}
          </th>
          <th
            className={cn(
              PARTY_COL_LABEL,
              "border-r bg-muted/40 px-2 py-1.5 text-left font-medium whitespace-nowrap"
            )}
          >
            사무소 소재지
          </th>
          <td className="px-2 py-1" colSpan={5}>
            <CellInput
              name={address}
              data={data}
              placeholder="사무소 주소"
              className={cn("w-full bg-background px-1.5", fieldBorder)}
            />
          </td>
        </tr>
        <tr className="border-b">
          <th
            className={cn(
              PARTY_COL_LABEL,
              "border-r bg-muted/40 px-2 py-1.5 text-left font-medium whitespace-nowrap"
            )}
          >
            사무소 명칭
          </th>
          <td className="px-2 py-1" colSpan={2}>
            <CellInput
              name={name}
              data={data}
              placeholder="사무소명"
              className={cn("w-full bg-background px-1.5", fieldBorder)}
            />
          </td>
          <th className="border-x bg-muted/40 px-2 py-1.5 text-left font-medium whitespace-nowrap">
            대표자 명
          </th>
          <td className="px-2 py-1" colSpan={2}>
            <CellInput
              name={representative}
              data={data}
              placeholder="대표자"
              className={cn("w-full bg-background px-1.5", fieldBorder)}
            />
          </td>
        </tr>
        <tr>
          <th
            className={cn(
              PARTY_COL_LABEL,
              "border-r bg-muted/40 px-2 py-1.5 text-left font-medium whitespace-nowrap"
            )}
          >
            전화 번호
          </th>
          <td className="px-2 py-1">
            <CellInput
              name={phone}
              data={data}
              type="tel"
              placeholder="전화"
              className={cn("w-full min-w-0 bg-background px-1.5", fieldBorder)}
            />
          </td>
          <th className="border-x bg-muted/40 px-2 py-1.5 text-left font-medium whitespace-nowrap">
            등록 번호
          </th>
          <td className="px-2 py-1">
            <CellInput
              name={registration}
              data={data}
              placeholder="개설등록번호"
              className={cn("w-full min-w-0 bg-background px-1.5", fieldBorder)}
            />
          </td>
          <th className="border-x bg-muted/40 px-2 py-1.5 text-left font-medium whitespace-nowrap">
            소속공인중개사
          </th>
          <td className="px-2 py-1">
            <CellInput
              name={agentName}
              data={data}
              placeholder="(자필 서명)"
              className={cn("w-full min-w-0 bg-background px-1.5", fieldBorder)}
            />
          </td>
        </tr>
      </tbody>
    </table>
  );
}

function JointBrokerList({
  count,
  data,
}: {
  count: number;
  data: Record<string, string>;
}) {
  return (
    <div className="space-y-2 print:space-y-0">
      <input type="hidden" name="joint_office_count" value={String(count)} />
      {Array.from({ length: count }, (_, i) => (
        <BrokerOfficeBlock
          key={`joint-${i}`}
          title="개업(공동)공인중개사"
          index={i}
          data={data}
          flushBottom={i === count - 1}
        />
      ))}
    </div>
  );
}

/** 당사자·중개사 블록. 추가 버튼은 상단 오른쪽(이미지와 동일) */
function ContractPartiesSection({
  isSale,
  data,
}: {
  isSale: boolean;
  data: Record<string, string>;
}) {
  const [lessorCount, setLessorCount] = useState(() =>
    initialPartyCount(data, "lessor")
  );
  const [lesseeCount, setLesseeCount] = useState(() =>
    initialPartyCount(data, "lessee")
  );
  const [jointCount, setJointCount] = useState(() => initialJointCount(data));

  const lessorAdd = isSale ? "매도인 추가" : "임대인 추가";
  const lesseeAdd = isSale ? "매수인 추가" : "임차인 추가";

  return (
    <section className="contract-parties space-y-4 text-[14px] print:space-y-0">
      <div className="space-y-2 border-t pt-4 print:space-y-0 print:border-t-0 print:pt-0">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[14px] leading-relaxed print:text-[11.5px]">
            본 계약을 증명하기 위하여 계약당사자가 이의 없음을 확인하고 각자 서명
            또는 기명 날인한다.
          </p>
          <div className="flex items-center gap-2">
            <span className="shrink-0 text-muted-foreground">계약일</span>
            <DatePicker
              name="contract_date"
              defaultValue={data.contract_date ?? ""}
              className="w-44"
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2 print:hidden">
          <Button
            type="button"
            size="sm"
            className="bg-emerald-600 text-white hover:bg-emerald-700"
            disabled={lessorCount >= MAX_PARTY_ROWS}
            onClick={() =>
              setLessorCount((c) => Math.min(MAX_PARTY_ROWS, c + 1))
            }
          >
            {lessorAdd}
          </Button>
          <Button
            type="button"
            size="sm"
            className="bg-emerald-600 text-white hover:bg-emerald-700"
            disabled={lesseeCount >= MAX_PARTY_ROWS}
            onClick={() =>
              setLesseeCount((c) => Math.min(MAX_PARTY_ROWS, c + 1))
            }
          >
            {lesseeAdd}
          </Button>
          <Button
            type="button"
            size="sm"
            className="bg-emerald-600 text-white hover:bg-emerald-700"
            disabled={jointCount >= MAX_JOINT_OFFICES}
            onClick={() =>
              setJointCount((c) => Math.min(MAX_JOINT_OFFICES, c + 1))
            }
          >
            공동중개사 추가
          </Button>
        </div>
      </div>

      <PartyPersonList
        roleLabel={isSale ? "매도인" : "임대인"}
        prefix="lessor"
        count={lessorCount}
        data={data}
        printStart
      />
      <PartyPersonList
        roleLabel={isSale ? "매수인" : "임차인"}
        prefix="lessee"
        count={lesseeCount}
        data={data}
      />

      <BrokerOfficeBlock
        title="개업공인중개사"
        index={0}
        data={data}
        primary
        flushBottom={jointCount === 0}
      />
      <JointBrokerList count={jointCount} data={data} />

      <input
        type="hidden"
        name="lessor_account"
        defaultValue={data.lessor_account ?? ""}
      />
      <input
        type="hidden"
        name="agent_phone"
        defaultValue={data.agent_phone ?? ""}
      />
    </section>
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
    (BUILDING_USES.includes(propertyType as (typeof BUILDING_USES)[number])
      ? propertyType
      : "아파트");
  const [specialTerms, setSpecialTerms] = useState(
    () => data.special_terms || defaultSpecialTermsForDeal(dealType)
  );

  return (
    <div
      id="contract-print-root"
      className="space-y-6 bg-white text-[14px] text-foreground print:space-y-2 print:text-[11.5px]"
    >
      <header className="space-y-1 text-center print:space-y-1 print:pt-0">
        <h2 className="text-xl font-bold tracking-tight print:border-b print:border-black print:pb-1 print:text-[20px]">
          {title}
        </h2>
        <p className="text-[14px] text-muted-foreground print:text-[11.5px] print:text-foreground">
          {isSale ? "매도인과 매수인" : "임대인과 임차인"} 쌍방은 아래 표시
          부동산에 관하여 다음 내용과 같이 {isSale ? "매매" : "임대차"} 계약을
          체결한다.
        </p>
      </header>

      {/* 1. 부동산의 표시 */}
      <section>
        <h3 className="mb-2 font-bold print:mb-0 print:border-b print:border-black">
          1. 부동산의 표시
        </h3>
        <table className="w-full border-collapse border text-[14px] print:border-t-0">
          <tbody>
            <tr className="border-b">
              <th className="w-28 border-r bg-muted/40 px-2 py-1.5 text-left">
                소재지
              </th>
              <td className="px-2 py-1">
                <div className="flex flex-wrap items-center gap-2">
                  <CellInput
                    name="property_address"
                    data={data}
                    className={cn(
                      "min-w-0 flex-1 bg-background px-1.5",
                      fieldBorder
                    )}
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
                      className={cn(
                        "min-w-0 flex-1 bg-background px-1.5",
                        fieldBorder
                      )}
                    />
                    <span className="shrink-0 text-muted-foreground">㎡</span>
                  </InlineField>
                  <InlineField
                    label="대지권종류"
                    className="min-w-[7rem] flex-1"
                  >
                    <CellInput
                      name="land_right_type"
                      data={data}
                      className={cn(
                        "min-w-0 flex-1 bg-background px-1.5",
                        fieldBorder
                      )}
                    />
                  </InlineField>
                  <InlineField
                    label="대지권비율"
                    className="min-w-[9rem] flex-[1.2] border-r-0"
                  >
                    <CellInput
                      name="land_right_ratio_den"
                      data={{ land_right_ratio_den: landRatio.den }}
                      className={cn(
                        "w-14 bg-background px-1 text-right",
                        fieldBorder
                      )}
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
            <tr className={isSale ? undefined : "border-b"}>
              <th className="w-14 border-r bg-muted/40 px-2 py-1.5 text-left align-middle whitespace-nowrap">
                건물
              </th>
              <td className="p-0">
                <div className="flex min-w-0 flex-wrap items-stretch">
                  <InlineField
                    label="구조"
                    className="min-w-[12rem] flex-[1.4]"
                  >
                    <SelectOrCustom
                      name="building_structure"
                      options={BUILDING_STRUCTURES}
                      defaultValue={data.building_structure}
                      fallback="철근콘크리트구조"
                    />
                  </InlineField>
                  <InlineField
                    label="용도"
                    className="min-w-[12rem] flex-[1.6]"
                  >
                    <SelectOrCustom
                      name="building_use"
                      options={BUILDING_USES}
                      defaultValue={buildingUseDefault}
                      fallback="아파트"
                    />
                  </InlineField>
                  <InlineField
                    label="면적"
                    className="min-w-[7rem] flex-1 border-r-0"
                  >
                    <CellInput
                      name="building_area"
                      data={data}
                      inputMode="decimal"
                      className={cn(
                        "min-w-0 flex-1 bg-background px-1.5",
                        fieldBorder
                      )}
                    />
                    <span className="shrink-0 text-muted-foreground">㎡</span>
                  </InlineField>
                </div>
              </td>
            </tr>
            {!isSale && (
              <tr>
                <th className="w-28 border-r bg-muted/40 px-2 py-1.5 text-left align-middle whitespace-nowrap">
                  임대할 부분
                </th>
                <td className="p-0">
                  <div className="flex min-w-0 flex-wrap items-stretch">
                    <div className="flex min-w-0 flex-[2] items-center border-r px-2 py-1">
                      <CellInput
                        name="leased_portion"
                        data={data}
                        className={cn(
                          "min-w-0 w-full bg-background px-1.5",
                          fieldBorder
                        )}
                        placeholder="예: 위 건물 중 제101동 1203호 전부"
                      />
                    </div>
                    <InlineField
                      label="면적"
                      className="min-w-[7rem] flex-1 border-r-0"
                    >
                      <CellInput
                        name="leased_portion_area"
                        data={data}
                        inputMode="decimal"
                        className={cn(
                          "min-w-0 flex-1 bg-background px-1.5",
                          fieldBorder
                        )}
                      />
                      <span className="shrink-0 text-muted-foreground">㎡</span>
                    </InlineField>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      {/* 2. 계약내용 */}
      <section>
        <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
          <h3 className="font-bold">2. 계약내용</h3>
          <p className="text-[14px] text-muted-foreground print:hidden">
            입력·표시: 원 (저장은 만원 단위)
          </p>
        </div>
        <p className="mb-2 text-[14px] leading-relaxed text-muted-foreground print:mb-0 print:text-[10.5px] print:leading-relaxed print:text-foreground">
          {contractArticle1Text(dealType)}
        </p>
        <ContractTermsTable dealType={dealType} data={data} />
      </section>

      {/* 일반조항 제2조~제8조 + 추가 특약 (매매·임대차 조항 상이) */}
      <section className="contract-articles-block space-y-3 print:flex print:min-h-0 print:flex-1 print:flex-col print:space-y-0">
        <div className="shrink-0 space-y-2.5 rounded-md border px-3 py-3 text-[14px] leading-relaxed print:space-y-1.5 print:rounded-none print:border-x-0 print:border-b-0 print:border-black print:px-0 print:py-0 print:text-[10.5px] print:leading-relaxed">
          {contractArticlesForDeal(dealType).map((article) => (
            <div key={article.no} className="text-justify print:break-inside-avoid">
              <strong className="mr-1">
                제{article.no}조 [{article.title}]
              </strong>
              {"variant" in article && article.variant === "lease_term" ? (
                <LeaseTermClause data={data} />
              ) : "variant" in article && article.variant === "lease_terminate" ? (
                <LeaseTerminateClause
                  data={data}
                  bodyBefore={article.bodyBefore}
                  bodyAfter={article.bodyAfter}
                />
              ) : "variant" in article &&
                article.variant === "explanation_delivery" &&
                "bodyBeforeDate" in article ? (
                <span className="inline">
                  {article.bodyBeforeDate}{" "}
                  <DatePicker
                    name="explanation_delivery_date"
                    defaultValue={
                      data.explanation_delivery_date ||
                      data.contract_date ||
                      ""
                    }
                    className="mx-1 inline-flex min-w-36 align-baseline"
                    inputClassName="h-7 border-0 border-b border-dotted border-foreground/50 rounded-none px-1"
                  />{" "}
                  {article.bodyAfterDate}
                </span>
              ) : "bodyBeforeDate" in article ? (
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
              ) : "body" in article ? (
                <span>{article.body}</span>
              ) : null}
            </div>
          ))}
        </div>
        <div className="contract-special-terms space-y-1.5 print:flex print:min-h-0 print:flex-1 print:flex-col print:space-y-0 print:border-t print:border-black">
          <h3 className="shrink-0 font-bold">특약사항</h3>
          <Textarea
            name="special_terms"
            value={specialTerms}
            onChange={(e) => setSpecialTerms(e.target.value)}
            rows={isSale ? 12 : 6}
            className={cn(
              "resize-none overflow-y-auto text-[12px] leading-relaxed md:text-[12px] app:text-[12px] print:hidden",
              fieldBorder
            )}
            placeholder="당사자 간 추가 특약이 있으면 기재하세요"
          />
          {/* 인쇄: 남는 페이지 높이를 특약 공백으로 채움 */}
          <pre className="contract-special-terms-body hidden whitespace-pre-wrap border border-foreground/50 px-1.5 py-1 font-sans text-[12px] leading-relaxed print:block print:min-h-0 print:flex-1 print:border-0 print:px-0 print:py-0">
            {specialTerms || " "}
          </pre>
        </div>
      </section>

      <ContractPartiesSection isSale={isSale} data={data} />

      {/* 숨김 메타 */}
      <input type="hidden" name="property_type" value={propertyType} />
      <input type="hidden" name="deal_type" value={dealType} />
      <input
        type="hidden"
        name="property_title"
        defaultValue={data.property_title ?? ""}
      />
      {/* 임대차는 제2조에서 expiry_date·lease_months를 제출 */}
      {isSale ? (
        <input
          type="hidden"
          name="expiry_date"
          defaultValue={data.expiry_date ?? ""}
        />
      ) : null}
      <input type="hidden" name="memo" defaultValue={data.memo ?? ""} />
      <input
        type="hidden"
        name="completed"
        defaultValue={data.completed ?? ""}
      />
      <input
        type="hidden"
        name="sender_name"
        defaultValue={data.sender_name ?? ""}
      />
      <input
        type="hidden"
        name="receiver_name"
        defaultValue={data.receiver_name ?? ""}
      />
      <input
        type="hidden"
        name="contract_no"
        defaultValue={data.contract_no ?? ""}
      />
      <input
        type="hidden"
        name="terms_note"
        defaultValue={data.terms_note ?? ""}
      />
      <input
        type="hidden"
        name="extra_note"
        defaultValue={data.extra_note ?? ""}
      />
      <input
        type="hidden"
        name="move_in_date"
        defaultValue={data.move_in_date ?? data.delivery_date ?? ""}
      />
      <input
        type="hidden"
        name="template_id"
        defaultValue={data.template_id ?? ""}
      />
      <input
        type="hidden"
        name="template_title"
        defaultValue={data.template_title ?? title}
      />
    </div>
  );
}
