"use client";

import { useMemo, useState } from "react";
import { DatePicker } from "@/components/form/date-picker";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatNumberInput } from "@/lib/money";
import { cn } from "@/lib/utils";

const fieldBorder =
  "rounded-md border-2 border-foreground/35 bg-background shadow-none focus-visible:border-foreground/60 focus-visible:ring-1";

type Line = {
  desc: string;
  sign: "" | "+" | "-";
  amount: string;
  note: string;
  lockedDesc?: boolean;
  lockedSign?: boolean;
};

const DEFAULT_LINES: Line[] = [
  { desc: "대금 총액", sign: "", amount: "", note: "", lockedDesc: true, lockedSign: true },
  { desc: "계약금", sign: "-", amount: "", note: "", lockedDesc: true, lockedSign: true },
  { desc: "중도금 총액", sign: "-", amount: "", note: "", lockedDesc: true, lockedSign: true },
  { desc: "", sign: "-", amount: "", note: "" },
  { desc: "", sign: "-", amount: "", note: "" },
  { desc: "대출금상환액", sign: "+", amount: "", note: "", lockedDesc: true, lockedSign: true },
  { desc: "선수관리비", sign: "+", amount: "", note: "", lockedDesc: true, lockedSign: true },
  { desc: "", sign: "+", amount: "", note: "" },
  { desc: "", sign: "+", amount: "", note: "" },
  { desc: "", sign: "+", amount: "", note: "" },
  { desc: "", sign: "+", amount: "", note: "" },
  { desc: "", sign: "", amount: "", note: "" },
];

function parseLines(data: Record<string, string>): Line[] {
  return DEFAULT_LINES.map((line, i) => ({
    ...line,
    desc: data[`line_${i}_desc`] ?? line.desc,
    sign: (data[`line_${i}_sign`] as Line["sign"]) || line.sign,
    amount: data[`line_${i}_amount`] ?? "",
    note: data[`line_${i}_note`] ?? "",
  }));
}

/** 잔금 정산서 */
export function BalanceSettlementSheet({ data }: { data: Record<string, string> }) {
  const [propertyLabel, setPropertyLabel] = useState(data.property_label || data.property_address || "");
  const [lines, setLines] = useState<Line[]>(() => parseLines(data));
  const [remarks, setRemarks] = useState(data.remarks ?? data.note ?? "");
  const [issuedAt, setIssuedAt] = useState(data.issued_at ?? "");
  const [lessorName, setLessorName] = useState(data.lessor_name ?? "");
  const [lesseeName, setLesseeName] = useState(data.lessee_name ?? "");
  const [officeName, setOfficeName] = useState(data.office_name ?? "");
  const [officePhone, setOfficePhone] = useState(data.office_phone || data.agent_phone || "");

  const patchLine = (index: number, patch: Partial<Line>) =>
    setLines((prev) => prev.map((line, i) => (i === index ? { ...line, ...patch } : line)));

  const total = useMemo(() => {
    return lines.reduce((acc, line) => {
      const n = Number(line.amount.replace(/\D/g, "")) || 0;
      if (!n) return acc;
      if (line.sign === "-") return acc - n;
      if (line.sign === "+") return acc + n;
      return acc + n;
    }, 0);
  }, [lines]);

  return (
    <div id="contract-print-root" className="space-y-4 bg-white text-[13px] text-foreground">
      <input type="hidden" name="form_template" value="balance_settlement" />
      <input type="hidden" name="total_amount" value={total !== 0 ? String(total) : ""} />
      <input type="hidden" name="note" value={remarks} />
      {(["property_title", "property_address", "property_type", "deal_type", "office_address", "agent_name", "agent_phone"] as const).map(
        (name) => (
          <input key={name} type="hidden" name={name} defaultValue={data[name] ?? ""} />
        ),
      )}
      {lines.map((line, i) => (
        <span key={i} className="hidden">
          <input type="hidden" name={`line_${i}_desc`} value={line.desc} />
          <input type="hidden" name={`line_${i}_sign`} value={line.sign} />
          <input type="hidden" name={`line_${i}_amount`} value={line.amount} />
          <input type="hidden" name={`line_${i}_note`} value={line.note} />
        </span>
      ))}

      <header className="space-y-3 text-center">
        <h2 className="text-xl font-bold tracking-tight print:text-[18px]">계약 대금(잔금) 정산서</h2>
        <div className="flex items-center gap-2 text-left">
          <span className="shrink-0 font-semibold">[물건소재지]</span>
          <Input
            name="property_label"
            value={propertyLabel}
            onChange={(e) => setPropertyLabel(e.target.value)}
            className={cn("h-8 flex-1 bg-background px-1.5", fieldBorder)}
          />
        </div>
      </header>

      <section className="space-y-2">
        <h3 className="text-center font-semibold">[정산내역]</h3>
        <div className="overflow-x-auto rounded-md border border-foreground/40">
          <table className="w-full min-w-[36rem] border-collapse text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="px-2 py-2 text-left font-medium">적요</th>
                <th className="w-16 px-2 py-2 text-center font-medium">가감</th>
                <th className="w-36 px-2 py-2 text-right font-medium">금액(원)</th>
                <th className="w-40 px-2 py-2 text-left font-medium">비고</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line, i) => (
                <tr key={i} className="border-b border-foreground/15">
                  <td className="px-1 py-1">
                    <Input
                      value={line.desc}
                      onChange={(e) => patchLine(i, { desc: e.target.value })}
                      readOnly={line.lockedDesc}
                      className={cn("h-8 bg-background px-1.5", fieldBorder, line.lockedDesc && "bg-muted/30")}
                    />
                  </td>
                  <td className="px-1 py-1 text-center">
                    {line.lockedSign ? (
                      <span className="font-medium">{line.sign || "·"}</span>
                    ) : (
                      <select
                        value={line.sign}
                        onChange={(e) => patchLine(i, { sign: e.target.value as Line["sign"] })}
                        className={cn("h-8 w-full rounded-md border-2 border-foreground/35 bg-background px-1 text-center", fieldBorder)}
                      >
                        <option value="">·</option>
                        <option value="+">+</option>
                        <option value="-">-</option>
                      </select>
                    )}
                  </td>
                  <td className="px-1 py-1">
                    <Input
                      value={line.amount ? formatNumberInput(line.amount) : ""}
                      onChange={(e) => patchLine(i, { amount: e.target.value.replace(/\D/g, "") })}
                      inputMode="numeric"
                      className={cn("h-8 bg-background px-1.5 text-right", fieldBorder)}
                    />
                  </td>
                  <td className="px-1 py-1">
                    <Input
                      value={line.note}
                      onChange={(e) => patchLine(i, { note: e.target.value })}
                      className={cn("h-8 bg-background px-1.5", fieldBorder)}
                    />
                  </td>
                </tr>
              ))}
              <tr className="bg-muted/30 font-semibold">
                <td className="px-2 py-2" colSpan={2}>
                  잔금정산액
                </td>
                <td className="px-2 py-2 text-right">{total ? formatNumberInput(String(Math.abs(total))) : "0"}</td>
                <td className="px-2 py-2 text-xs font-normal text-muted-foreground">{total < 0 ? "(지급)" : total > 0 ? "(수령)" : ""}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-2">
        <h3 className="font-semibold">[기타사항]</h3>
        <Textarea
          name="remarks"
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          rows={4}
          className={cn("resize-y bg-background", fieldBorder)}
        />
      </section>

      <footer className="space-y-3 border-t pt-3">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span>발행일 :</span>
          <DatePicker name="issued_at" value={issuedAt} onChange={setIssuedAt} className="w-40" />
        </div>
        <p className="text-center text-sm">상기 내역을 확인하고 정산 수령합니다.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex items-center gap-2">
            <span className="shrink-0">매도(임대)인</span>
            <Input
              name="lessor_name"
              value={lessorName}
              onChange={(e) => setLessorName(e.target.value)}
              className={cn("h-8 flex-1 bg-background px-1.5", fieldBorder)}
            />
            <span>(인)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="shrink-0">매수(임차)인</span>
            <Input
              name="lessee_name"
              value={lesseeName}
              onChange={(e) => setLesseeName(e.target.value)}
              className={cn("h-8 flex-1 bg-background px-1.5", fieldBorder)}
            />
            <span>(인)</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <Input
            name="office_name"
            value={officeName}
            onChange={(e) => setOfficeName(e.target.value)}
            className={cn("h-8 w-56 bg-background px-1.5", fieldBorder)}
            placeholder="사무소명"
          />
          <div className="flex items-center gap-1">
            <span>연락처 :</span>
            <Input
              name="office_phone"
              value={officePhone}
              onChange={(e) => setOfficePhone(e.target.value)}
              className={cn("h-8 w-40 bg-background px-1.5", fieldBorder)}
            />
          </div>
        </div>
      </footer>
    </div>
  );
}
