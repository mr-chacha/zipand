"use client";

import { useState } from "react";
import { DatePicker } from "@/components/form/date-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RECEIPT_AMOUNT_PRESETS } from "@/lib/related-forms";
import { formatNumberInput, wonToHangul } from "@/lib/money";
import { cn } from "@/lib/utils";

const fieldBorder =
  "rounded-md border-2 border-foreground/35 bg-background shadow-none focus-visible:border-foreground/60 focus-visible:ring-1";

export type ReceiptAmountPresets = {
  total: string;
  down: string;
  interim1: string;
  interim2: string;
  balance: string;
};

function ReceiptCopy({
  copyLabel,
  values,
  set,
  amounts,
  showToolbar,
}: {
  copyLabel: string;
  values: {
    receiptDocKind: string;
    receiptNo: string;
    recipientName: string;
    amountWon: string;
    propertyLabel: string;
    purposeLine1: string;
    purposeLine2: string;
    issuedAt: string;
    issuerAddress: string;
    issuerName: string;
  };
  set: (patch: Partial<typeof values>) => void;
  amounts: ReceiptAmountPresets;
  showToolbar: boolean;
}) {
  const wonNum = Number(values.amountWon.replace(/\D/g, "")) || 0;
  const hangul = wonToHangul(wonNum).replace(/원$/, "");

  const applyPreset = (id: (typeof RECEIPT_AMOUNT_PRESETS)[number]["id"]) => {
    const preset = RECEIPT_AMOUNT_PRESETS.find((p) => p.id === id);
    if (!preset) return;
    const map: Record<string, string> = {
      total: amounts.total,
      down: amounts.down,
      interim1: amounts.interim1,
      interim2: amounts.interim2,
      balance: amounts.balance,
    };
    set({
      amountWon: map[id] ?? "",
      purposeLine1: values.receiptDocKind === "반환금 영수증" ? `${preset.purpose} 반환` : preset.purpose,
    });
  };

  const reset = () =>
    set({
      receiptNo: "",
      recipientName: "",
      amountWon: "",
      purposeLine1: "",
      purposeLine2: "",
    });

  return (
    <div className="space-y-3 rounded-md border border-foreground/40 bg-white p-4 print:border-foreground/70 print:p-3">
      <div className="flex items-center justify-between text-[11px] text-muted-foreground print:text-foreground">
        <span>[{copyLabel}]</span>
        <span className="flex items-center gap-1">
          NO:
          <Input
            name={showToolbar ? "receipt_no" : undefined}
            value={values.receiptNo}
            onChange={(e) => set({ receiptNo: e.target.value })}
            className={cn("h-7 w-24 bg-background px-1.5 text-xs", fieldBorder)}
          />
        </span>
      </div>

      {showToolbar && (
        <div className="flex flex-wrap items-center gap-2 border-b pb-3 print:hidden">
          <div className="flex flex-wrap gap-1">
            {RECEIPT_AMOUNT_PRESETS.map((p) => (
              <Button key={p.id} type="button" size="sm" variant="destructive" className="h-7 px-2 text-xs" onClick={() => applyPreset(p.id)}>
                {p.label}
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-3 text-sm">
            {(["영수증", "반환금 영수증"] as const).map((kind) => (
              <label key={kind} className="flex items-center gap-1.5">
                <input
                  type="radio"
                  name="receipt_doc_kind"
                  value={kind}
                  checked={values.receiptDocKind === kind}
                  onChange={() => set({ receiptDocKind: kind })}
                />
                {kind}
              </label>
            ))}
          </div>
          <Button type="button" size="sm" variant="secondary" className="ml-auto h-7" onClick={reset}>
            초기화
          </Button>
        </div>
      )}

      <h3 className="text-center text-xl font-bold tracking-[0.35em] print:text-[18px]">
        {values.receiptDocKind === "반환금 영수증" ? "반환금 영수증" : "영 수 증"}
      </h3>

      <div className="flex items-end gap-1">
        <Input
          name={showToolbar ? "recipient_name" : undefined}
          value={values.recipientName}
          onChange={(e) => set({ recipientName: e.target.value })}
          className={cn("h-8 flex-1 bg-background px-1.5", fieldBorder)}
          placeholder="성명"
        />
        <span className="shrink-0 pb-1 font-medium">귀하</span>
      </div>

      <div className="space-y-1.5 rounded border border-dashed border-foreground/30 px-3 py-2">
        <div className="flex flex-wrap items-center gap-1">
          <span className="font-semibold">一金</span>
          <Input
            readOnly
            value={hangul}
            className={cn("h-8 min-w-[12rem] flex-1 bg-muted/40 px-1.5", fieldBorder)}
            placeholder="금액(한글)"
          />
          <span>원정</span>
        </div>
        <div className="flex flex-wrap items-center gap-1 text-sm">
          <span>(￦</span>
          <Input
            name={showToolbar ? "amount_won" : undefined}
            value={values.amountWon ? formatNumberInput(values.amountWon) : ""}
            onChange={(e) => set({ amountWon: e.target.value.replace(/\D/g, "") })}
            inputMode="numeric"
            className={cn("h-8 w-40 bg-background px-1.5", fieldBorder)}
          />
          <span>원정)</span>
        </div>
      </div>

      <div className="space-y-1">
        <p className="font-semibold">[부동산의 표시]</p>
        <Input
          name={showToolbar ? "property_label" : undefined}
          value={values.propertyLabel}
          onChange={(e) => set({ propertyLabel: e.target.value })}
          className={cn("h-8 w-full bg-background px-1.5", fieldBorder)}
        />
      </div>

      <div className="space-y-1.5 text-[13px] leading-relaxed">
        <p>상기 금액을 위 표시 부동산에 대한</p>
        <Input
          name={showToolbar ? "purpose_line1" : undefined}
          value={values.purposeLine1}
          onChange={(e) => set({ purposeLine1: e.target.value })}
          className={cn("h-8 w-full bg-background px-1.5", fieldBorder)}
          placeholder="예: 월세 보증금"
        />
        <Input
          name={showToolbar ? "purpose_line2" : undefined}
          value={values.purposeLine2}
          onChange={(e) => set({ purposeLine2: e.target.value })}
          className={cn("h-8 w-full bg-background px-1.5", fieldBorder)}
        />
        <p>(으)로 정히 영수하고 본 영수증을 발행합니다.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="shrink-0">발행일:</span>
        {showToolbar ? (
          <DatePicker name="issued_at" value={values.issuedAt} onChange={(v) => set({ issuedAt: v })} className="w-40" />
        ) : (
          <span>{values.issuedAt}</span>
        )}
      </div>

      <div className="space-y-2 pt-2">
        <div className="flex items-center gap-2">
          <span className="w-14 shrink-0 tracking-widest">주 소</span>
          <span>:</span>
          <Input
            name={showToolbar ? "issuer_address" : undefined}
            value={values.issuerAddress}
            onChange={(e) => set({ issuerAddress: e.target.value })}
            className={cn("h-8 flex-1 bg-background px-1.5", fieldBorder)}
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="w-14 shrink-0 tracking-widest">성 명</span>
          <span>:</span>
          <Input
            name={showToolbar ? "issuer_name" : undefined}
            value={values.issuerName}
            onChange={(e) => set({ issuerName: e.target.value })}
            className={cn("h-8 flex-1 bg-background px-1.5", fieldBorder)}
          />
          <span className="shrink-0 font-medium">(인)</span>
        </div>
      </div>
    </div>
  );
}

/** 협회 영수증 양식 (지급인용 + 발행인용) */
export function ReceiptSheet({
  data,
  amounts,
}: {
  data: Record<string, string>;
  amounts?: ReceiptAmountPresets;
}) {
  const [values, setValues] = useState({
    receiptDocKind: data.receipt_doc_kind || "영수증",
    receiptNo: data.receipt_no ?? "",
    recipientName: data.recipient_name ?? data.payer_name ?? "",
    amountWon: data.amount_won ?? "",
    propertyLabel: data.property_label || data.property_address || data.property_title || "",
    purposeLine1: data.purpose_line1 || data.purpose || "",
    purposeLine2: data.purpose_line2 ?? "",
    issuedAt: data.issued_at || data.paid_at || "",
    issuerAddress: data.issuer_address || data.office_address || "",
    issuerName: data.issuer_name || data.agent_name || data.office_name || "",
  });

  const patch = (next: Partial<typeof values>) => setValues((prev) => ({ ...prev, ...next }));
  const presetAmounts: ReceiptAmountPresets = amounts ?? {
    total: data.amount_won_total ?? "",
    down: data.amount_won_down ?? data.amount_won ?? "",
    interim1: data.amount_won_interim1 ?? "",
    interim2: data.amount_won_interim2 ?? "",
    balance: data.amount_won_balance ?? "",
  };

  return (
    <div id="contract-print-root" className="space-y-4 bg-white text-[13px] text-foreground print:space-y-6">
      <input type="hidden" name="form_template" value="receipt" />
      <input type="hidden" name="receipt_type" value={values.purposeLine1 || "계약금"} />
      <input type="hidden" name="payer_name" value={values.recipientName} />
      <input type="hidden" name="payee_name" value={values.issuerName} />
      <input type="hidden" name="amount" value={values.amountWon ? String(Math.floor(Number(values.amountWon) / 10_000) || "") : ""} />
      <input type="hidden" name="paid_at" value={values.issuedAt} />
      <input type="hidden" name="purpose" value={[values.purposeLine1, values.purposeLine2].filter(Boolean).join(" ")} />
      <input type="hidden" name="payment_method" value={data.payment_method || "계좌이체"} />
      <input type="hidden" name="account" value={data.account ?? ""} />
      <input type="hidden" name="note" value={data.note ?? ""} />
      {(
        [
          "property_title",
          "property_address",
          "property_type",
          "deal_type",
          "office_name",
          "office_phone",
          "office_address",
          "agent_name",
          "agent_phone",
          "lessor_name",
          "lessee_name",
        ] as const
      ).map((name) => (
        <input key={name} type="hidden" name={name} defaultValue={data[name] ?? ""} />
      ))}

      <ReceiptCopy copyLabel="지급인용" values={values} set={patch} amounts={presetAmounts} showToolbar />
      <ReceiptCopy copyLabel="발행인용" values={values} set={patch} amounts={presetAmounts} showToolbar={false} />
    </div>
  );
}
