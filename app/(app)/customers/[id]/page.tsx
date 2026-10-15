import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Phone } from "lucide-react";
import { ComingSoonButton } from "@/components/coming-soon";
import { GatedLink } from "@/components/office-gate";
import { PageHeader } from "@/components/page-header";
import { CustomerStatusBadge } from "@/components/status-badge";
import { TaskBoard } from "@/components/tasks/task-board";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSession } from "@/lib/auth";
import { formatBudget, formatDate } from "@/lib/format";
import { getOfficeGate } from "@/lib/office-gate";
import { signedUrls } from "@/lib/storage";
import { getOfficeMembers, getPropertyList, getTasks, todayRange, type PropertyListItem } from "@/lib/queries";
import { ConsultationPanel, CustomerHeaderActions, CustomerProperties } from "./customer-actions";

export const metadata: Metadata = { title: "고객 상세" };

interface MatchTarget {
  deal_type: string | null;
  regions: string | null;
  budget_min: number | null;
  budget_max: number | null;
}

/** 거래 유형·예산·지역 조건으로 매물 점수를 매긴다. 거래 유형·예산이 맞지 않으면 제외. */
function recommend(customer: MatchTarget, properties: PropertyListItem[], excludeIds: Set<string>) {
  const regions = (customer.regions ?? "")
    .split(/[,\s]+/)
    .map((r) => r.trim())
    .filter(Boolean);
  return properties
    .filter((p) => !excludeIds.has(p.id) && (p.status === "광고 중" || p.status === "임장 전"))
    .filter((p) => !customer.deal_type || p.deal_type === customer.deal_type)
    .filter((p) => (customer.budget_max === null || p.price <= customer.budget_max) && (customer.budget_min === null || p.price >= customer.budget_min * 0.8))
    .map((p) => {
      const reasons: string[] = [];
      if (customer.deal_type) reasons.push(`${p.deal_type} 일치`);
      if (customer.budget_min !== null || customer.budget_max !== null) reasons.push("예산 범위");
      const regionHit = regions.find((r) => p.region?.includes(r) || p.address.includes(r));
      if (regionHit) reasons.push(`${regionHit}`);
      return { property: p, reasons, score: reasons.length + (regionHit ? 2 : 0) };
    })
    .filter((r) => regions.length === 0 || r.reasons.length > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

export default async function CustomerDetailPage({ params }: PageProps<"/customers/[id]">) {
  const { id } = await params;
  const { supabase, office } = await getSession();

  const { data: customer } = await supabase
    .from("customers")
    .select("*, manager:profiles!customers_manager_id_fkey(name)")
    .eq("id", id)
    .maybeSingle();
  if (!customer) notFound();

  const [consultations, linkedRows, tasks, members, properties, gate] = await Promise.all([
    supabase
      .from("consultations")
      .select("id, channel, content, consulted_at, audio_path, audio_name, audio_duration_sec, author:profiles!consultations_created_by_fkey(name)")
      .eq("customer_id", id)
      .order("consulted_at", { ascending: false }),
    supabase.from("customer_properties").select("property_id, created_at").eq("customer_id", id),
    getTasks({ customerId: id }),
    getOfficeMembers(),
    getPropertyList(),
    getOfficeGate(),
  ]);

  const audioUrls = await signedUrls(
    supabase,
    "consultation-audio",
    (consultations.data ?? []).flatMap((c) => (c.audio_path ? [c.audio_path] : []))
  );
  const linkedIds = new Set((linkedRows.data ?? []).map((r) => r.property_id));
  const linked = properties.filter((p) => linkedIds.has(p.id));
  const recommendations = recommend(customer, properties, linkedIds);
  const { todayStart, tomorrowStart } = todayRange();

  const conditions = [
    { label: "희망 거래", value: customer.deal_type ?? "-" },
    { label: "예산", value: formatBudget(customer.budget_min, customer.budget_max) },
    { label: "희망 지역", value: customer.regions ?? "-" },
    { label: "입주 희망일", value: formatDate(customer.move_in_date) },
    { label: "필수 조건", value: customer.must_have ?? "-" },
    { label: "제외 조건", value: customer.exclude ?? "-" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={customer.name}
        backHref="/customers"
        backLabel="고객 및 상담"
        actions={<CustomerHeaderActions customerId={id} />}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>상담 기록</CardTitle>
              <CardDescription>상담 내용과 다음 행동을 남겨두면 팀원도 이어서 응대할 수 있어요</CardDescription>
            </CardHeader>
            <CardContent>
              <ConsultationPanel
                officeId={office.id}
                customerId={id}
                consultations={(consultations.data ?? []).map((c) => ({ ...c, audioUrl: c.audio_path ? (audioUrls[c.audio_path] ?? null) : null }))}
                gate={{ blocked: gate.blocked.consultation, isOwner: gate.isOwner }}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>연결 매물</CardTitle>
              <CardDescription>보여준 매물, 관심 매물을 연결해 두세요</CardDescription>
            </CardHeader>
            <CardContent>
              <CustomerProperties
                customerId={id}
                linked={linked}
                recommendations={recommendations.map((r) => ({ ...r.property, reasons: r.reasons }))}
                options={properties.filter((p) => !linkedIds.has(p.id)).map((p) => ({ value: p.id, label: p.title }))}
                gate={{ blocked: gate.blocked.link, isOwner: gate.isOwner }}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                고객 조건
                <CustomerStatusBadge status={customer.status} />
              </CardTitle>
              {customer.phone && (
                <a href={`tel:${customer.phone}`} className="flex w-fit items-center gap-1 text-sm text-primary">
                  <Phone className="size-3.5" />
                  {customer.phone}
                </a>
              )}
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <dl className="space-y-2">
                {conditions.map((c) => (
                  <div key={c.label} className="flex gap-3">
                    <dt className="w-20 shrink-0 text-muted-foreground">{c.label}</dt>
                    <dd className="flex-1">{c.value}</dd>
                  </div>
                ))}
                <div className="flex gap-3">
                  <dt className="w-20 shrink-0 text-muted-foreground">담당자</dt>
                  <dd className="flex-1">{customer.manager?.name ?? "-"}</dd>
                </div>
              </dl>
              {customer.memo && (
                <p className="rounded-lg bg-muted/60 p-3 text-xs whitespace-pre-wrap text-muted-foreground">{customer.memo}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>후속 일정</CardTitle>
              <CardDescription>연락·방문 약속을 놓치지 않게 기록해요</CardDescription>
            </CardHeader>
            <CardContent>
              <TaskBoard
                tasks={tasks}
                todayStart={todayStart}
                tomorrowStart={tomorrowStart}
                members={members.map((m) => ({ value: m.id, label: m.name }))}
                properties={linked.map((p) => ({ value: p.id, label: p.title }))}
                fixedCustomerId={id}
                emptyText="예정된 후속 일정이 없어요."
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>AI 상담 도우미</CardTitle>
              <CardDescription>통화 녹음 요약, 고객 문자 초안 작성</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <ComingSoonButton size="sm">통화 녹음 요약</ComingSoonButton>
              <ComingSoonButton size="sm">문자 초안 작성</ComingSoonButton>
            </CardContent>
          </Card>

          <p className="text-center text-xs text-muted-foreground">
            최근 업데이트 {formatDate(customer.updated_at)} ·{" "}
            <GatedLink
              href={`/contracts/new?customer=${id}`}
              kind="deal"
              blocked={gate.blocked.deal}
              isOwner={gate.isOwner}
              className="text-primary hover:underline"
            >
              계약 시작하기
            </GatedLink>
          </p>
        </div>
      </div>
    </div>
  );
}
