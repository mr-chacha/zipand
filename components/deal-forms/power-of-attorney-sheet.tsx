"use client";

import { useState } from "react";
import { DatePicker } from "@/components/form/date-picker";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const fieldBorder =
  "rounded-md border-2 border-foreground/35 bg-background shadow-none focus-visible:border-foreground/60 focus-visible:ring-1";

function Row({
  label,
  name,
  value,
  onChange,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-2 border-b border-foreground/15 py-1.5 last:border-b-0">
      <span className="w-20 shrink-0 text-sm font-medium">{label}</span>
      <Input
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn("h-8 flex-1 bg-background px-1.5", fieldBorder)}
      />
    </div>
  );
}

/** 위임장 */
export function PowerOfAttorneySheet({ data }: { data: Record<string, string> }) {
  const [values, setValues] = useState({
    subjectLabel: data.subject_label || data.property_label || "",
    principalName: data.principal_name ?? "",
    principalResidentId: data.principal_resident_id ?? "",
    principalAddress: data.principal_address ?? "",
    principalPhone: data.principal_phone ?? "",
    mandateBody: data.mandate_body ?? "",
    agentRelation: data.agent_relation ?? "",
    agentName: data.agent_name_poa || data.delegate_name || "",
    agentResidentId: data.agent_resident_id ?? "",
    agentAddress: data.agent_address ?? "",
    agentPhone: data.agent_phone_poa || "",
    issuedAt: data.issued_at ?? "",
    signName: data.sign_name || data.principal_name || "",
    officeName: data.office_name ?? "",
  });

  const set = (patch: Partial<typeof values>) => setValues((prev) => ({ ...prev, ...patch }));

  return (
    <div id="contract-print-root" className="space-y-4 bg-white text-[13px] text-foreground">
      <input type="hidden" name="form_template" value="power_of_attorney" />
      <input type="hidden" name="note" value={values.mandateBody} />
      {(["property_title", "property_address", "property_type", "deal_type", "office_phone", "office_address", "agent_name", "agent_phone"] as const).map(
        (name) => (
          <input key={name} type="hidden" name={name} defaultValue={data[name] ?? ""} />
        ),
      )}
      <input type="hidden" name="office_name" value={values.officeName} />

      <header className="text-center">
        <h2 className="text-xl font-bold tracking-[0.4em] print:text-[18px]">위 임 장</h2>
      </header>

      <section className="rounded-md border border-foreground/40 px-3 py-3">
        <div className="mb-3 flex items-center gap-2">
          <span className="shrink-0 font-semibold">[위임 대상물]</span>
          <Input
            name="subject_label"
            value={values.subjectLabel}
            onChange={(e) => set({ subjectLabel: e.target.value })}
            className={cn("h-8 flex-1 bg-background px-1.5", fieldBorder)}
            placeholder="부동산 표시"
          />
        </div>
        <p className="mb-2 font-semibold">[위임인 인적사항]</p>
        <Row label="성명" name="principal_name" value={values.principalName} onChange={(v) => set({ principalName: v, signName: v })} />
        <Row label="주민번호" name="principal_resident_id" value={values.principalResidentId} onChange={(v) => set({ principalResidentId: v })} />
        <Row label="주소" name="principal_address" value={values.principalAddress} onChange={(v) => set({ principalAddress: v })} />
        <Row label="전화번호" name="principal_phone" value={values.principalPhone} onChange={(v) => set({ principalPhone: v })} />
      </section>

      <p className="text-center text-sm">위 &apos;위임대상물&apos; 에 대하여 아래와 같이 대리인에게 권한을 위임합니다.</p>

      <section className="rounded-md border border-foreground/40 px-3 py-3">
        <p className="mb-2 font-semibold">[위임할 사항]</p>
        <Textarea
          name="mandate_body"
          value={values.mandateBody}
          onChange={(e) => set({ mandateBody: e.target.value })}
          rows={5}
          className={cn("mb-3 resize-y bg-background", fieldBorder)}
          placeholder="위임할 권한·업무를 적어 주세요"
        />
        <p className="mb-2 font-semibold">[수임인 인적사항]</p>
        <Row label="관계" name="agent_relation" value={values.agentRelation} onChange={(v) => set({ agentRelation: v })} />
        <Row label="성명" name="agent_name_poa" value={values.agentName} onChange={(v) => set({ agentName: v })} />
        <Row label="주민번호" name="agent_resident_id" value={values.agentResidentId} onChange={(v) => set({ agentResidentId: v })} />
        <Row label="주소" name="agent_address" value={values.agentAddress} onChange={(v) => set({ agentAddress: v })} />
        <Row label="전화번호" name="agent_phone_poa" value={values.agentPhone} onChange={(v) => set({ agentPhone: v })} />
      </section>

      <div className="space-y-2 text-right">
        <div className="inline-flex items-center gap-2">
          <DatePicker name="issued_at" value={values.issuedAt} onChange={(v) => set({ issuedAt: v })} className="w-40" />
        </div>
        <div className="flex items-center justify-end gap-2">
          <span>위임인</span>
          <Input
            name="sign_name"
            value={values.signName}
            onChange={(e) => set({ signName: e.target.value })}
            className={cn("h-8 w-40 bg-background px-1.5", fieldBorder)}
          />
          <span className="font-medium">(인감)</span>
        </div>
      </div>

      <footer className="space-y-1 border-t pt-3 text-xs text-muted-foreground print:text-foreground">
        <p className="font-medium text-foreground"># 첨부</p>
        <ol className="list-decimal space-y-0.5 pl-5">
          <li>인감증명서 1부</li>
          <li>소유자 주민등록증 사본 1부</li>
          <li>대리인 주민등록증 사본 1부</li>
        </ol>
      </footer>
    </div>
  );
}
