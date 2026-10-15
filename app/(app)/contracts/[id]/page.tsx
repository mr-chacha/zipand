import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ComingSoonButton } from "@/components/coming-soon";
import { PageHeader } from "@/components/page-header";
import { DealStageBadge, DocStatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSession } from "@/lib/auth";
import { formatPrice } from "@/lib/format";
import { getCustomerOptions } from "@/lib/queries";
import { DealForm } from "../deal-form";
import { STEP_DESCRIPTIONS, STEP_TITLES, stageIndex } from "@/lib/deal-steps";
import { isPast } from "@/lib/format";
import { DealChecklist, DealClauses, DealHeaderActions, DealShareLinks } from "./deal-actions";
import { BalanceStep, CompleteStep, DealStepNav, DocsStepFooter, PrepStep, TermsStep } from "./deal-steps";

export const metadata: Metadata = { title: "거래 상세" };

export default async function DealDetailPage({ params, searchParams }: PageProps<"/contracts/[id]">) {
  const { id } = await params;
  const { step: stepParam } = await searchParams;
  const { supabase } = await getSession();

  const { data: deal } = await supabase
    .from("deals")
    .select("*, property:properties(id, title, address, deal_type, price, monthly_rent), customer:customers(id, name, phone)")
    .eq("id", id)
    .maybeSingle();
  if (!deal) notFound();

  const [checklist, clauses, officeClauses, documents, customers, shares] = await Promise.all([
    supabase.from("deal_checklist_items").select("*").eq("deal_id", id).order("sort_order").order("created_at"),
    supabase.from("deal_clauses").select("*").eq("deal_id", id).order("sort_order").order("created_at"),
    supabase.from("office_clauses").select("id, category, title, body").order("created_at", { ascending: false }),
    supabase.from("documents").select("id, doc_type, status, issued_at").eq("property_id", deal.property_id),
    getCustomerOptions(),
    supabase.from("deal_shares").select("id, token, expires_at, view_count, created_at").eq("deal_id", id).order("created_at", { ascending: false }),
  ]);
  const closed = deal.stage === "완료" || deal.stage === "취소";

  // 보는 단계: ?step=1~5. 아직 열리지 않은 단계(진행 단계 이후)는 진행 중인 단계로 보여준다
  const current = stageIndex(deal.stage);
  const requested = Number(stepParam);
  const lastStep = STEP_TITLES.length;
  const step =
    Number.isInteger(requested) && requested >= 1 && requested <= lastStep && (requested === lastStep || requested - 1 <= current)
      ? requested
      : current + 1;

  const { property, customer, ...dealRow } = deal;
  const dealType = property?.deal_type ?? "매매";
  const items = checklist.data ?? [];
  const stageItems = (stage: string) => items.filter((i) => i.stage === stage);
  const docsItems = stageItems("서류 확인");

  return (
    <div className="space-y-6">
      <PageHeader
        title={property?.title ?? "거래"}
        description={`${property?.address ?? ""} · ${property ? `${property.deal_type} ${formatPrice(property)}` : ""}`}
        backHref="/contracts"
        backLabel="계약 준비"
        actions={<DealHeaderActions dealId={id} cancellable={!closed} />}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {step}. {STEP_TITLES[step - 1]}
                {step - 1 === current && step < lastStep && <DealStageBadge stage="진행 중" />}
              </CardTitle>
              <CardDescription>{STEP_DESCRIPTIONS[step - 1]}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {step === 1 && (
                <>
                  <DealChecklist dealId={id} stage="서류 확인" items={docsItems} />
                  <DocsStepFooter dealId={id} done={docsItems.filter((i) => i.done).length} total={docsItems.length} />
                </>
              )}
              {step === 2 && <TermsStep deal={dealRow} dealType={dealType} />}
              {step === 3 && (
                <>
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold">확인 서류 · 권리분석 · 서류 작업</h3>
                    <DealChecklist dealId={id} stage="계약 준비" items={stageItems("계약 준비")} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold">특약 사항</h3>
                    <DealClauses dealId={id} clauses={clauses.data ?? []} officeClauses={officeClauses.data ?? []} />
                  </div>
                  <div className="border-t pt-6">
                    <PrepStep deal={dealRow} dealType={dealType} customer={customer ? { name: customer.name, phone: customer.phone } : null} />
                  </div>
                </>
              )}
              {step === 4 && (
                <>
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold">잔금 · 인도 확인</h3>
                    <DealChecklist dealId={id} stage="잔금 대기" items={stageItems("잔금 대기")} />
                  </div>
                  <div className="border-t pt-6">
                    <BalanceStep deal={dealRow} />
                  </div>
                </>
              )}
              {step === 5 && <CompleteStep deal={dealRow} />}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>진행 단계</CardTitle>
              <CardDescription>단계를 눌러 내용을 확인하고, 각 단계 하단의 다음 버튼으로 진행해요</CardDescription>
            </CardHeader>
            <CardContent>
              <DealStepNav dealId={id} stage={deal.stage} viewing={step} />
            </CardContent>
          </Card>

          {deal.stage !== "취소" && (
            <Card>
              <CardHeader>
                <CardTitle>임대인·임차인 공유</CardTitle>
                <CardDescription>계약 진행 내용을 링크로 보내 당사자가 함께 확인할 수 있어요</CardDescription>
              </CardHeader>
              <CardContent>
                <DealShareLinks
                  dealId={id}
                  links={(shares.data ?? []).map((s) => ({ ...s, expired: isPast(s.expires_at) }))}
                  siteUrl={process.env.NEXT_PUBLIC_SITE_URL ?? ""}
                />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>거래 정보</CardTitle>
              {customer && (
                <CardDescription>
                  <Link href={`/customers/${customer.id}`} className="hover:underline">
                    {customer.name}
                  </Link>
                  {customer.phone && ` · ${customer.phone}`}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <DealForm customers={customers.map((c) => ({ value: c.id, label: c.name }))} deal={dealRow} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>매물 서류</CardTitle>
              <CardDescription>잔금일에는 최신 등기를 다시 확인하세요</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {(documents.data ?? []).length === 0 && (
                <Link href={`/documents?property=${deal.property_id}`} className="block text-sm text-primary hover:underline">
                  서류 업로드하기
                </Link>
              )}
              {documents.data?.map((doc) => (
                <Link key={doc.id} href={`/documents/${doc.id}`} className="flex items-center justify-between gap-2 rounded-lg border p-2 text-sm hover:bg-muted/50">
                  <span>
                    {doc.doc_type}
                    <span className="ml-1 text-xs text-muted-foreground">{doc.issued_at ?? ""}</span>
                  </span>
                  <DocStatusBadge status={doc.status} />
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>AI 계약 도우미</CardTitle>
              <CardDescription>계약서·중개대상물 확인설명서 초안</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <ComingSoonButton size="sm">계약서 초안</ComingSoonButton>
              <ComingSoonButton size="sm">확인설명서 초안</ComingSoonButton>
              <ComingSoonButton size="sm">특약 추천</ComingSoonButton>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
