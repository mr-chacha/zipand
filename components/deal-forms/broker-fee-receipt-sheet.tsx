"use client";

import { useState } from "react";
import { DatePicker } from "@/components/form/date-picker";
import { Input } from "@/components/ui/input";
import { formatNumberInput } from "@/lib/money";
import { cn } from "@/lib/utils";

const fieldBorder =
  "rounded-md border-2 border-foreground/35 bg-background shadow-none focus-visible:border-foreground/60 focus-visible:ring-1";

function WonInput({
  name,
  value,
  onChange,
  className,
}: {
  name?: string;
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  return (
    <Input
      name={name}
      value={value ? formatNumberInput(value) : ""}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))}
      inputMode="numeric"
      className={cn("h-8 bg-background px-1.5", fieldBorder, className)}
    />
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block space-y-1 text-xs", className)}>
      <span className="text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

/** 중개보수 영수증 (협회 양식 기준, 수기 작성) */
export function BrokerFeeReceiptSheet({ data }: { data: Record<string, string> }) {
  const [values, setValues] = useState({
    receiptNo: data.receipt_no ?? "",
    recipientName: data.recipient_name ?? "",
    lessorName: data.lessor_name ?? "",
    lesseeName: data.lessee_name ?? "",
    taxId: data.tax_id ?? "",
    officeName: data.office_name ?? "",
    officeRepresentative: data.office_representative ?? "",
    officeAddress: data.office_address ?? "",
    officeRegistrationNo: data.office_registration_no ?? "",
    issuedAt: data.issued_at ?? "",
    summaryAmountWon: data.summary_amount_won || data.fee_amount_won || "",
    summaryNote: data.summary_note ?? "",
    txnDate: data.txn_date || data.issued_at || "",
    propertyLabel: data.property_label || data.property_address || "",
    dealAmountWon: data.deal_amount_won ?? "",
    feeTotalWon: data.fee_total_won || data.fee_amount_won || "",
    feeTotalVatWon: data.fee_total_vat_won || data.fee_vat_won || "",
    feeLessorWon: data.fee_lessor_won ?? "",
    feeLessorVatWon: data.fee_lessor_vat_won ?? "",
    feeLesseeWon: data.fee_lessee_won ?? "",
    feeLesseeVatWon: data.fee_lessee_vat_won ?? "",
    agentName: data.agent_name ?? "",
  });

  const set = (patch: Partial<typeof values>) => setValues((prev) => ({ ...prev, ...patch }));

  return (
    <div id="contract-print-root" className="space-y-4 bg-white text-[13px] text-foreground">
      <input type="hidden" name="form_template" value="broker_fee_receipt" />
      <input type="hidden" name="receipt_type" value="중개수수료" />
      <input type="hidden" name="payer_name" value={values.recipientName || values.lesseeName} />
      <input type="hidden" name="payee_name" value={values.officeName} />
      <input type="hidden" name="amount" value={values.feeTotalWon ? String(Math.floor(Number(values.feeTotalWon) / 10_000) || "") : ""} />
      <input type="hidden" name="paid_at" value={values.issuedAt} />
      <input type="hidden" name="purpose" value="중개보수" />
      <input type="hidden" name="payment_method" value="" />
      <input type="hidden" name="account" value="" />
      <input type="hidden" name="note" value={values.summaryNote} />
      <input type="hidden" name="fee_amount_won" value={values.feeTotalWon} />
      <input type="hidden" name="fee_vat_won" value={values.feeTotalVatWon} />
      {(["property_title", "property_address", "property_type", "deal_type", "office_phone", "agent_phone"] as const).map((name) => (
        <input key={name} type="hidden" name={name} defaultValue={data[name] ?? ""} />
      ))}

      <header className="space-y-2 text-center">
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1">
            일련번호:
            <Input
              name="receipt_no"
              value={values.receiptNo}
              onChange={(e) => set({ receiptNo: e.target.value })}
              className={cn("h-7 w-28 bg-background px-1.5", fieldBorder)}
            />
          </span>
          <span className="text-muted-foreground">(보관용 포함)</span>
        </div>
        <h2 className="text-xl font-bold tracking-[0.35em]">영 수 증</h2>
        <div className="flex items-end justify-end gap-1">
          <Input
            name="recipient_name"
            value={values.recipientName}
            onChange={(e) => set({ recipientName: e.target.value })}
            className={cn("h-8 w-40 bg-background px-1.5", fieldBorder)}
            placeholder="성명"
          />
          <span className="pb-1 font-medium">귀하</span>
        </div>
      </header>

      <section className="space-y-2 rounded-md border border-foreground/40 px-3 py-3">
        <p className="font-semibold">개업공인중개사</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <Field label="납세번호">
            <Input
              name="tax_id"
              value={values.taxId}
              onChange={(e) => set({ taxId: e.target.value })}
              className={cn("h-8 bg-background px-1.5", fieldBorder)}
              placeholder="000-00-00000"
            />
          </Field>
          <Field label="사무소 명칭">
            <Input
              name="office_name"
              value={values.officeName}
              onChange={(e) => set({ officeName: e.target.value })}
              className={cn("h-8 bg-background px-1.5", fieldBorder)}
            />
          </Field>
          <Field label="성명(대표자)">
            <div className="flex items-center gap-1">
              <Input
                name="office_representative"
                value={values.officeRepresentative}
                onChange={(e) => set({ officeRepresentative: e.target.value })}
                className={cn("h-8 flex-1 bg-background px-1.5", fieldBorder)}
              />
              <span className="shrink-0">(인)</span>
            </div>
          </Field>
          <Field label="등록번호">
            <Input
              name="office_registration_no"
              value={values.officeRegistrationNo}
              onChange={(e) => set({ officeRegistrationNo: e.target.value })}
              className={cn("h-8 bg-background px-1.5", fieldBorder)}
            />
          </Field>
          <Field label="소재지" className="sm:col-span-2">
            <Input
              name="office_address"
              value={values.officeAddress}
              onChange={(e) => set({ officeAddress: e.target.value })}
              className={cn("h-8 bg-background px-1.5", fieldBorder)}
            />
          </Field>
        </div>
      </section>

      <section className="grid gap-2 rounded-md border border-foreground/40 px-3 py-3 sm:grid-cols-3">
        <Field label="작성년월">
          <DatePicker name="issued_at" value={values.issuedAt} onChange={(v) => set({ issuedAt: v, txnDate: values.txnDate || v })} className="w-full" />
        </Field>
        <Field label="금액(원)">
          <WonInput name="summary_amount_won" value={values.summaryAmountWon} onChange={(v) => set({ summaryAmountWon: v })} />
        </Field>
        <Field label="비고">
          <Input
            name="summary_note"
            value={values.summaryNote}
            onChange={(e) => set({ summaryNote: e.target.value })}
            className={cn("h-8 bg-background px-1.5", fieldBorder)}
          />
        </Field>
      </section>

      <p className="text-center text-sm">상기금액을 아래 표시 부동산에 대한 중개보수(실비)로 영수함.</p>

      <section className="space-y-3 rounded-md border border-foreground/40 px-3 py-3">
        <div className="grid gap-2 sm:grid-cols-2">
          <Field label="임대인">
            <Input
              name="lessor_name"
              value={values.lessorName}
              onChange={(e) => set({ lessorName: e.target.value })}
              className={cn("h-8 bg-background px-1.5", fieldBorder)}
            />
          </Field>
          <Field label="임차인">
            <Input
              name="lessee_name"
              value={values.lesseeName}
              onChange={(e) => set({ lesseeName: e.target.value })}
              className={cn("h-8 bg-background px-1.5", fieldBorder)}
            />
          </Field>
        </div>
        <Field label="중개(확인)대상물">
          <Input
            name="property_label"
            value={values.propertyLabel}
            onChange={(e) => set({ propertyLabel: e.target.value })}
            className={cn("h-8 bg-background px-1.5", fieldBorder)}
          />
        </Field>
        <div className="grid gap-2 sm:grid-cols-3">
          <Field label="년월일">
            <DatePicker name="txn_date" value={values.txnDate} onChange={(v) => set({ txnDate: v })} className="w-full" />
          </Field>
          <Field label="거래액(원)">
            <WonInput name="deal_amount_won" value={values.dealAmountWon} onChange={(v) => set({ dealAmountWon: v })} />
          </Field>
          <Field label="담당">
            <Input
              name="agent_name"
              value={values.agentName}
              onChange={(e) => set({ agentName: e.target.value })}
              className={cn("h-8 bg-background px-1.5", fieldBorder)}
            />
          </Field>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[28rem] border-collapse text-xs">
            <thead>
              <tr className="border bg-muted/40">
                <th className="border px-2 py-1.5" colSpan={2}>
                  중개보수 및 실비
                </th>
              </tr>
              <tr className="border bg-muted/20">
                <th className="border px-2 py-1">구분</th>
                <th className="border px-2 py-1">금액 / VAT</th>
              </tr>
            </thead>
            <tbody>
              {(
                [
                  ["계", "fee_total_won", "fee_total_vat_won", "feeTotalWon", "feeTotalVatWon"],
                  ["임대인", "fee_lessor_won", "fee_lessor_vat_won", "feeLessorWon", "feeLessorVatWon"],
                  ["임차인", "fee_lessee_won", "fee_lessee_vat_won", "feeLesseeWon", "feeLesseeVatWon"],
                ] as const
              ).map(([label, amountName, vatName, amountKey, vatKey]) => (
                <tr key={label} className="border">
                  <td className="border px-2 py-1.5 text-center font-medium">{label}</td>
                  <td className="border px-2 py-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <WonInput
                        name={amountName}
                        value={values[amountKey]}
                        onChange={(v) => set({ [amountKey]: v } as Partial<typeof values>)}
                        className="w-32"
                      />
                      <span className="text-muted-foreground">VAT</span>
                      <WonInput
                        name={vatName}
                        value={values[vatKey]}
                        onChange={(v) => set({ [vatKey]: v } as Partial<typeof values>)}
                        className="w-28"
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
