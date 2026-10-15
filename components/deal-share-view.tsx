import { CheckCircle2, Circle, MapPin, Phone, ShieldAlert } from "lucide-react";
import { DEAL_AMOUNT_LABEL } from "@/lib/constants";
import { STEP_TITLES, stageIndex } from "@/lib/deal-steps";
import { formatDate, formatManwon } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface DealShareData {
  expires_at: string;
  deal: {
    stage: string;
    amount: number | null;
    monthly_rent: number | null;
    move_in_date: string | null;
    terms_note: string | null;
    down_payment: number | null;
    down_payment_date: string | null;
    balance_date: string | null;
    contract_date: string | null;
    lessor_name: string | null;
    lessor_account: string | null;
    lessee_name: string | null;
  };
  property: { title: string; address: string; deal_type: string; property_type: string };
  checklist: { stage: string; category: string; label: string; done: boolean }[];
  clauses: string[];
  office: { name: string; phone: string | null; address: string | null };
  agent: { name: string | null; phone: string | null };
}

const won = (v: number | null) => (v === null ? "-" : `${formatManwon(v)}원`);

function Rows({ rows }: { rows: { label: string; value: React.ReactNode }[] }) {
  return (
    <dl className="divide-y rounded-lg border text-sm">
      {rows.map((r) => (
        <div key={r.label} className="flex gap-3 px-3 py-2">
          <dt className="w-28 shrink-0 text-neutral-500">{r.label}</dt>
          <dd className="flex-1 font-medium">{r.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold">{title}</h2>
      {children}
    </section>
  );
}

/** 임대인·임차인 공개용 계약 진행 내용. 내부 메모·연락처·수수료는 데이터에 포함하지 않는다 */
export function DealShareView({ data }: { data: DealShareData }) {
  const { deal, property } = data;
  const lease = property.deal_type !== "매매";
  const owner = lease ? "임대인" : "매도인";
  const buyer = lease ? "임차인" : "매수인";
  const current = stageIndex(deal.stage);
  const balance = deal.amount !== null ? Math.max(deal.amount - (deal.down_payment ?? 0), 0) : null;
  const groups = [...new Set(data.checklist.map((i) => i.category))];

  return (
    <article className="overflow-hidden rounded-xl border bg-white text-neutral-900 shadow-sm print:rounded-none print:border-0 print:shadow-none">
      <div className="space-y-6 p-6">
        <header className="space-y-1">
          <span className="inline-block rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium">
            {property.property_type} · {property.deal_type} 계약
          </span>
          <h1 className="text-xl font-bold">{property.title}</h1>
          <p className="flex items-center gap-1 text-sm text-neutral-500">
            <MapPin className="size-3.5" />
            {property.address}
          </p>
        </header>

        <ol className="grid grid-cols-5 gap-1 text-center text-[11px]">
          {STEP_TITLES.map((title, i) => {
            const done = i < current || deal.stage === "완료";
            const active = i === current && deal.stage !== "완료";
            return (
              <li key={title} className="space-y-1">
                <div className={cn("h-1.5 rounded-full", done ? "bg-primary" : active ? "bg-primary/40" : "bg-neutral-200")} />
                <p className={cn(active ? "font-semibold text-primary" : done ? "text-neutral-700" : "text-neutral-400")}>
                  {title}
                </p>
              </li>
            );
          })}
        </ol>

        <Section title="거래 조건">
          <Rows
            rows={[
              { label: DEAL_AMOUNT_LABEL[property.deal_type] ?? "거래대금", value: won(deal.amount) },
              ...(property.deal_type === "월세" ? [{ label: "월세", value: won(deal.monthly_rent) }] : []),
              { label: "입주 날짜", value: formatDate(deal.move_in_date) },
            ]}
          />
          {deal.terms_note && <p className="rounded-lg bg-neutral-50 p-3 text-sm whitespace-pre-wrap text-neutral-700">{deal.terms_note}</p>}
        </Section>

        <Section title="계약 일정 · 금액">
          <Rows
            rows={[
              { label: "계약서 작성일", value: formatDate(deal.contract_date) },
              { label: "계약금", value: `${won(deal.down_payment)}${deal.down_payment_date ? ` · ${formatDate(deal.down_payment_date)} 입금` : ""}` },
              { label: "잔금", value: `${won(balance)}${deal.balance_date ? ` · ${formatDate(deal.balance_date)}` : ""}` },
            ]}
          />
        </Section>

        <Section title="계약 당사자">
          <Rows
            rows={[
              { label: owner, value: deal.lessor_name ?? "-" },
              { label: buyer, value: deal.lessee_name ?? "-" },
              { label: "입금 계좌", value: deal.lessor_account ?? "-" },
            ]}
          />
          {deal.lessor_account && (
            <p className="flex items-start gap-1.5 text-xs text-amber-700">
              <ShieldAlert className="mt-0.5 size-3.5 shrink-0" />
              입금 전 계좌 명의가 {owner} 본인인지 담당 중개사에게 꼭 다시 확인하세요.
            </p>
          )}
        </Section>

        {data.checklist.length > 0 && (
          <Section title="확인 사항">
            <div className="space-y-3">
              {groups.map((category) => (
                <div key={category} className="space-y-1">
                  <p className="text-xs font-medium text-neutral-500">{category}</p>
                  <ul className="space-y-1">
                    {data.checklist
                      .filter((i) => i.category === category)
                      .map((item) => (
                        <li key={item.label} className={cn("flex items-center gap-2 text-sm", item.done ? "text-neutral-800" : "text-neutral-400")}>
                          {item.done ? <CheckCircle2 className="size-4 text-primary" /> : <Circle className="size-4" />}
                          {item.label}
                        </li>
                      ))}
                  </ul>
                </div>
              ))}
            </div>
          </Section>
        )}

        {data.clauses.length > 0 && (
          <Section title="특약 사항">
            <ol className="space-y-2 text-sm">
              {data.clauses.map((body, i) => (
                <li key={i} className="flex gap-2 rounded-lg bg-neutral-50 p-3">
                  <span className="font-medium text-neutral-500">{i + 1}.</span>
                  <p className="flex-1 leading-relaxed whitespace-pre-wrap">{body}</p>
                </li>
              ))}
            </ol>
          </Section>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-4 text-sm">
          <div>
            <p className="font-semibold">{data.office.name}</p>
            <p className="text-neutral-500">
              {data.agent.name && `담당 ${data.agent.name}`}
              {data.office.address && ` · ${data.office.address}`}
            </p>
          </div>
          {(data.agent.phone || data.office.phone) && (
            <a href={`tel:${data.agent.phone ?? data.office.phone}`} className="flex items-center gap-1 font-medium">
              <Phone className="size-4" />
              {data.agent.phone ?? data.office.phone}
            </a>
          )}
        </div>

        <p className="text-[11px] leading-relaxed text-neutral-400">
          본 자료는 계약 진행 상황 공유를 위한 참고 자료이며, 최종 내용은 계약서를 기준으로 합니다. 링크는 {formatDate(data.expires_at)}까지 열람할 수 있어요.
        </p>
      </div>
    </article>
  );
}
