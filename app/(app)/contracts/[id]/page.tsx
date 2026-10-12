import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ComingSoonButton } from "@/components/coming-soon";
import { PageHeader } from "@/components/page-header";
import { DocStatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSession } from "@/lib/auth";
import { formatPrice } from "@/lib/format";
import { getCustomerOptions } from "@/lib/queries";
import { DealForm } from "../deal-form";
import { DealChecklist, DealClauses, DealHeaderActions, DealStageSelect } from "./deal-actions";

export const metadata: Metadata = { title: "거래 상세" };

export default async function DealDetailPage({ params }: PageProps<"/contracts/[id]">) {
  const { id } = await params;
  const { supabase } = await getSession();

  const { data: deal } = await supabase
    .from("deals")
    .select("*, property:properties(id, title, address, deal_type, price, monthly_rent), customer:customers(id, name, phone)")
    .eq("id", id)
    .maybeSingle();
  if (!deal) notFound();

  const [checklist, clauses, officeClauses, documents, customers] = await Promise.all([
    supabase.from("deal_checklist_items").select("*").eq("deal_id", id).order("sort_order").order("created_at"),
    supabase.from("deal_clauses").select("*").eq("deal_id", id).order("sort_order").order("created_at"),
    supabase.from("office_clauses").select("id, category, title, body").order("created_at", { ascending: false }),
    supabase.from("documents").select("id, doc_type, status, issued_at").eq("property_id", deal.property_id),
    getCustomerOptions(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={deal.property?.title ?? "거래"}
        description={`${deal.property?.address ?? ""} · ${deal.property ? `${deal.property.deal_type} ${formatPrice(deal.property)}` : ""}`}
        backHref="/contracts"
        backLabel="계약 준비"
        actions={<DealHeaderActions dealId={id} />}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>확인 체크리스트</CardTitle>
              <CardDescription>계약 전 확인해야 할 서류와 권리관계를 점검해요</CardDescription>
            </CardHeader>
            <CardContent>
              <DealChecklist dealId={id} items={checklist.data ?? []} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>특약 사항</CardTitle>
              <CardDescription>라이브러리에서 고르거나 직접 작성한 뒤 거래 조건에 맞게 다듬으세요</CardDescription>
            </CardHeader>
            <CardContent>
              <DealClauses dealId={id} clauses={clauses.data ?? []} officeClauses={officeClauses.data ?? []} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>진행 단계</CardTitle>
            </CardHeader>
            <CardContent>
              <DealStageSelect dealId={id} stage={deal.stage} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>거래 정보</CardTitle>
              {deal.customer && (
                <CardDescription>
                  <Link href={`/customers/${deal.customer.id}`} className="hover:underline">
                    {deal.customer.name}
                  </Link>
                  {deal.customer.phone && ` · ${deal.customer.phone}`}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <DealForm customers={customers.map((c) => ({ value: c.id, label: c.name }))} deal={deal} />
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
