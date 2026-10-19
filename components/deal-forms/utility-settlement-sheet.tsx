"use client";

import { useMemo, useState } from "react";
import { DatePicker } from "@/components/form/date-picker";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatNumberInput } from "@/lib/money";
import { cn } from "@/lib/utils";

const fieldBorder =
  "rounded-md border-2 border-foreground/35 bg-background shadow-none focus-visible:border-foreground/60 focus-visible:ring-1";

function Cell({
  name,
  value,
  onChange,
  className,
  ...props
}: {
  name: string;
  value: string;
  onChange: (v: string) => void;
} & Omit<React.ComponentProps<typeof Input>, "name" | "value" | "onChange">) {
  return (
    <Input
      name={name}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn("h-8 bg-background px-1.5", fieldBorder, className)}
      {...props}
    />
  );
}

function WonCell({
  name,
  value,
  onChange,
}: {
  name: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-xs text-muted-foreground">₩</span>
      <Input
        name={name}
        value={value ? formatNumberInput(value) : ""}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))}
        inputMode="numeric"
        className={cn("h-8 flex-1 bg-background px-1.5", fieldBorder)}
      />
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="border-b border-foreground/20 pb-1 text-sm font-semibold">{children}</h3>;
}

/** 공과금등 정산서 */
export function UtilitySettlementSheet({ data }: { data: Record<string, string> }) {
  const [values, setValues] = useState({
    propertyLabel: data.property_label || data.property_address || data.property_title || "",
    managementDesc: data.management_desc || "관리비 정산액(관리사무소 확인분)",
    managementAmount: data.management_amount ?? "",
    gasMeter: data.gas_meter ?? "",
    gasUsage: data.gas_usage ?? "",
    gasPeriod: data.gas_period ?? "",
    gasAmount: data.gas_amount ?? "",
    electricMeter: data.electric_meter ?? "",
    electricUsage: data.electric_usage ?? "",
    electricPeriod: data.electric_period ?? "",
    electricAmount: data.electric_amount ?? "",
    waterMeter: data.water_meter ?? "",
    waterUsage: data.water_usage ?? "",
    waterPeriod: data.water_period ?? "",
    waterAmount: data.water_amount ?? "",
    repairPeriod: data.repair_period ?? "",
    repairMonths: data.repair_months ?? "",
    repairMonthly: data.repair_monthly ?? "",
    repairAmount: data.repair_amount ?? "",
    otherItem: data.other_item ?? "",
    otherAmount: data.other_amount ?? "",
    totalDetail: data.total_detail ?? "",
    remarks: data.remarks ?? data.note ?? "",
    issuedAt: data.issued_at ?? "",
    officeName: data.office_name ?? "",
    agentName: data.agent_name ?? "",
    agentPhone: data.agent_phone || data.office_phone || "",
  });

  const set = (patch: Partial<typeof values>) => setValues((prev) => ({ ...prev, ...patch }));

  const totalAmount = useMemo(() => {
    const sum = [
      values.managementAmount,
      values.gasAmount,
      values.electricAmount,
      values.waterAmount,
      values.repairAmount,
      values.otherAmount,
    ].reduce((acc, v) => acc + (Number(v.replace(/\D/g, "")) || 0), 0);
    return sum > 0 ? String(sum) : "";
  }, [
    values.managementAmount,
    values.gasAmount,
    values.electricAmount,
    values.waterAmount,
    values.repairAmount,
    values.otherAmount,
  ]);

  return (
    <div id="contract-print-root" className="space-y-4 bg-white text-[13px] text-foreground">
      <input type="hidden" name="form_template" value="utility_settlement" />
      <input type="hidden" name="total_amount" value={totalAmount} />
      <input type="hidden" name="note" value={values.remarks} />
      {(["property_title", "property_address", "property_type", "deal_type", "office_phone", "office_address"] as const).map((name) => (
        <input key={name} type="hidden" name={name} defaultValue={data[name] ?? ""} />
      ))}

      <header className="space-y-3 text-center">
        <h2 className="text-xl font-bold tracking-tight print:text-[18px]">공과금등정산서</h2>
        <div className="flex items-center gap-2 text-left">
          <span className="shrink-0 font-semibold">[물건소재지]</span>
          <Cell name="property_label" value={values.propertyLabel} onChange={(v) => set({ propertyLabel: v })} className="flex-1" />
        </div>
      </header>

      <section className="space-y-4 rounded-md border px-3 py-3">
        <h3 className="text-center font-semibold">[정산내역]</h3>

        <div className="space-y-2">
          <SectionTitle>1. 관리비</SectionTitle>
          <div className="grid gap-2 sm:grid-cols-[1fr_9rem]">
            <Cell name="management_desc" value={values.managementDesc} onChange={(v) => set({ managementDesc: v })} />
            <WonCell name="management_amount" value={values.managementAmount} onChange={(v) => set({ managementAmount: v })} />
          </div>
        </div>

        {(
          [
            {
              title: "2. 가스요금",
              meter: "gas_meter",
              usage: "gas_usage",
              period: "gas_period",
              amount: "gas_amount",
              keys: ["gasMeter", "gasUsage", "gasPeriod", "gasAmount"] as const,
            },
            {
              title: "3. 전기요금",
              meter: "electric_meter",
              usage: "electric_usage",
              period: "electric_period",
              amount: "electric_amount",
              keys: ["electricMeter", "electricUsage", "electricPeriod", "electricAmount"] as const,
            },
            {
              title: "4. 수도요금",
              meter: "water_meter",
              usage: "water_usage",
              period: "water_period",
              amount: "water_amount",
              keys: ["waterMeter", "waterUsage", "waterPeriod", "waterAmount"] as const,
            },
          ] as const
        ).map((row) => (
          <div key={row.title} className="space-y-2">
            <SectionTitle>{row.title}</SectionTitle>
            <div className="grid gap-2 sm:grid-cols-4">
              <label className="space-y-1 text-[11px] text-muted-foreground">
                검침 수치
                <Cell name={row.meter} value={values[row.keys[0]]} onChange={(v) => set({ [row.keys[0]]: v })} />
              </label>
              <label className="space-y-1 text-[11px] text-muted-foreground">
                정산 사용량
                <Cell name={row.usage} value={values[row.keys[1]]} onChange={(v) => set({ [row.keys[1]]: v })} />
              </label>
              <label className="space-y-1 text-[11px] text-muted-foreground">
                정산기간
                <Cell name={row.period} value={values[row.keys[2]]} onChange={(v) => set({ [row.keys[2]]: v })} />
              </label>
              <label className="space-y-1 text-[11px] text-muted-foreground">
                정산금액
                <WonCell name={row.amount} value={values[row.keys[3]]} onChange={(v) => set({ [row.keys[3]]: v })} />
              </label>
            </div>
          </div>
        ))}

        <div className="space-y-2">
          <SectionTitle>5. 장기수선충당금</SectionTitle>
          <div className="grid gap-2 sm:grid-cols-4">
            <label className="space-y-1 text-[11px] text-muted-foreground">
              납입 기간
              <Cell name="repair_period" value={values.repairPeriod} onChange={(v) => set({ repairPeriod: v })} />
            </label>
            <label className="space-y-1 text-[11px] text-muted-foreground">
              납입 개월수
              <Cell name="repair_months" value={values.repairMonths} onChange={(v) => set({ repairMonths: v.replace(/\D/g, "") })} inputMode="numeric" />
            </label>
            <label className="space-y-1 text-[11px] text-muted-foreground">
              월납입액
              <WonCell name="repair_monthly" value={values.repairMonthly} onChange={(v) => set({ repairMonthly: v })} />
            </label>
            <label className="space-y-1 text-[11px] text-muted-foreground">
              정산금액
              <WonCell name="repair_amount" value={values.repairAmount} onChange={(v) => set({ repairAmount: v })} />
            </label>
          </div>
        </div>

        <div className="space-y-2">
          <SectionTitle>6. 기타사항</SectionTitle>
          <div className="grid gap-2 sm:grid-cols-[1fr_9rem]">
            <Cell name="other_item" value={values.otherItem} onChange={(v) => set({ otherItem: v })} placeholder="항목" />
            <WonCell name="other_amount" value={values.otherAmount} onChange={(v) => set({ otherAmount: v })} />
          </div>
        </div>

        <div className="space-y-2">
          <SectionTitle>7. 정산총액</SectionTitle>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="space-y-1 text-[11px] text-muted-foreground">
              정산총액
              <div className="flex h-8 items-center gap-1 rounded-md border-2 border-foreground/35 bg-muted/40 px-2">
                <span>₩</span>
                <span className="font-medium">{totalAmount ? formatNumberInput(totalAmount) : "0"}</span>
              </div>
            </label>
            <label className="space-y-1 text-[11px] text-muted-foreground">
              정산내역
              <Cell name="total_detail" value={values.totalDetail} onChange={(v) => set({ totalDetail: v })} />
            </label>
          </div>
        </div>
      </section>

      <section className="space-y-2">
        <SectionTitle>[기타사항]</SectionTitle>
        <Textarea
          name="remarks"
          value={values.remarks}
          onChange={(e) => set({ remarks: e.target.value })}
          rows={4}
          className={cn("resize-y bg-background", fieldBorder)}
        />
      </section>

      <footer className="flex flex-wrap items-end justify-between gap-3 border-t pt-3 text-sm">
        <div className="space-y-1">
          <Input
            name="office_name"
            value={values.officeName}
            onChange={(e) => set({ officeName: e.target.value })}
            className={cn("h-8 w-56 bg-background px-1.5", fieldBorder)}
            placeholder="사무소명"
          />
          <div className="flex flex-wrap items-center gap-1 text-xs">
            <span>[담당자]</span>
            <Input
              name="agent_name"
              value={values.agentName}
              onChange={(e) => set({ agentName: e.target.value })}
              className={cn("h-7 w-24 bg-background px-1.5", fieldBorder)}
            />
            <Input
              name="agent_phone"
              value={values.agentPhone}
              onChange={(e) => set({ agentPhone: e.target.value })}
              className={cn("h-7 w-32 bg-background px-1.5", fieldBorder)}
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span>발행일 :</span>
          <DatePicker name="issued_at" value={values.issuedAt} onChange={(v) => set({ issuedAt: v })} className="w-40" />
        </div>
      </footer>
    </div>
  );
}
