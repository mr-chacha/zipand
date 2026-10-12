import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { ComingSoonPanel } from "@/components/coming-soon";
import { PageHeader } from "@/components/page-header";
import { DealStageBadge } from "@/components/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getSession } from "@/lib/auth";
import { formatDate, formatManwon } from "@/lib/format";
import { ClauseLibrary } from "./clause-library";

export const metadata: Metadata = { title: "계약 준비" };

export default async function ContractsPage({ searchParams }: PageProps<"/contracts">) {
  const { tab, q } = await searchParams;
  const keyword = typeof q === "string" ? q.trim() : "";
  const { supabase } = await getSession();

  const [{ data: deals }, { data: officeClauses }] = await Promise.all([
    supabase
      .from("deals")
      .select(
        "id, stage, contract_date, balance_date, amount, updated_at, property:properties(id, title, deal_type), customer:customers(id, name), deal_checklist_items(done)"
      )
      .order("updated_at", { ascending: false }),
    supabase.from("office_clauses").select("id, category, title, body").order("created_at", { ascending: false }),
  ]);

  const matched = keyword
    ? (deals ?? []).filter((d) => `${d.property?.title ?? ""} ${d.customer?.name ?? ""}`.includes(keyword))
    : (deals ?? []);
  const active = matched.filter((d) => d.stage !== "완료" && d.stage !== "취소");
  const closed = matched.filter((d) => d.stage === "완료" || d.stage === "취소");

  const renderDeals = (list: typeof active, empty: string) =>
    list.length === 0 ? (
      <p className="py-10 text-center text-sm text-muted-foreground">{empty}</p>
    ) : (
      <div className="grid gap-3 md:grid-cols-2">
        {list.map((deal) => {
          const total = deal.deal_checklist_items.length;
          const done = deal.deal_checklist_items.filter((i) => i.done).length;
          return (
            <Link key={deal.id} href={`/contracts/${deal.id}`} className="space-y-3 rounded-xl border bg-card p-4 hover:border-primary/40">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{deal.property?.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {deal.property?.deal_type} · {deal.customer?.name ?? "고객 미지정"}
                    {deal.amount !== null && ` · ${formatManwon(deal.amount)}`}
                  </p>
                </div>
                <DealStageBadge stage={deal.stage} />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>체크리스트</span>
                  <span className="tabular-nums">
                    {done}/{total}
                  </span>
                </div>
                <Progress value={total ? (done / total) * 100 : 0} />
              </div>
              <p className="text-xs text-muted-foreground">
                계약일 {formatDate(deal.contract_date)} · 잔금일 {formatDate(deal.balance_date)}
              </p>
            </Link>
          );
        })}
      </div>
    );

  return (
    <div className="space-y-6">
      <PageHeader
        title="계약 준비"
        description="거래별 확인 체크리스트와 특약을 정리해요. 최종 계약서 작성 전 단계를 돕는 기능이에요."
        actions={
          <Link href="/contracts/new" className={buttonVariants()}>
            <Plus data-icon="inline-start" />
            거래 시작
          </Link>
        }
      />

      <Tabs defaultValue={tab === "clauses" ? "clauses" : "deals"}>
        <TabsList>
          <TabsTrigger value="deals">진행 중 거래 ({active.length})</TabsTrigger>
          <TabsTrigger value="closed">종료된 거래 ({closed.length})</TabsTrigger>
          <TabsTrigger value="clauses">특약 라이브러리</TabsTrigger>
        </TabsList>
        <TabsContent value="deals" className="pt-4">
          {renderDeals(active, "진행 중인 거래가 없어요. 계약이 시작되면 거래를 만들어 체크리스트를 관리하세요.")}
        </TabsContent>
        <TabsContent value="closed" className="pt-4">
          {renderDeals(closed, "종료된 거래가 없어요.")}
        </TabsContent>
        <TabsContent value="clauses" className="space-y-4 pt-4">
          <ComingSoonPanel
            title="AI 특약 추천 · 계약서 초안"
            description="거래 조건에 맞는 특약 추천과 계약서·확인설명서 초안 작성은 서비스 준비중이에요. 지금은 예시 문구와 사무소 특약을 직접 골라 쓸 수 있어요."
          />
          <Card>
            <CardHeader>
              <CardTitle>특약 문구</CardTitle>
              <CardDescription>예시 문구는 거래 조건에 맞게 수정해서 사용하세요</CardDescription>
            </CardHeader>
            <CardContent>
              <ClauseLibrary officeClauses={officeClauses ?? []} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
