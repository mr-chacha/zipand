import type { Metadata } from "next";
import Link from "next/link";
import { FileText, Plus } from "lucide-react";
import { ComingSoonPanel } from "@/components/coming-soon";
import { ContractWriteEntry } from "@/components/deal-forms/contract-write-entry";
import type { WriteDealOption } from "@/components/deal-forms/contract-write-dialog";
import { GatedLink } from "@/components/office-gate";
import { PageHeader } from "@/components/page-header";
import { DealStageBadge } from "@/components/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { isAppRequest } from "@/lib/app-mode";
import { getSession } from "@/lib/auth";
import { formatDate, formatManwon } from "@/lib/format";
import { getOfficeGate } from "@/lib/office-gate";
import { ClauseLibrary } from "./clause-library";

export const metadata: Metadata = { title: "계약관리" };

export default async function ContractsPage({ searchParams }: PageProps<"/contracts">) {
  const { tab, q } = await searchParams;
  const keyword = typeof q === "string" ? q.trim() : "";
  const [{ supabase, profile, office }, isApp] = await Promise.all([getSession(), isAppRequest()]);

  const [{ data: deals }, { data: officeClauses }, gate] = await Promise.all([
    supabase
      .from("deals")
      .select(
        "id, stage, contract_date, balance_date, amount, monthly_rent, down_payment, move_in_date, lessor_name, lessor_phone, lessor_account, lessee_name, lessee_phone, terms_note, updated_at, property:properties(id, title, address, deal_type, property_type), customer:customers(id, name), deal_checklist_items(done)"
      )
      .order("updated_at", { ascending: false }),
    supabase.from("office_clauses").select("id, category, title, body").order("created_at", { ascending: false }),
    getOfficeGate(),
  ]);

  const matched = keyword
    ? (deals ?? []).filter((d) => `${d.property?.title ?? ""} ${d.customer?.name ?? ""}`.includes(keyword))
    : (deals ?? []);
  const active = matched.filter((d) => d.stage !== "완료" && d.stage !== "취소");
  const closed = matched.filter((d) => d.stage === "완료" || d.stage === "취소");

  const writeDeals: WriteDealOption[] = (deals ?? [])
    .filter((d) => d.stage !== "취소")
    .map((deal) => {
      const property = Array.isArray(deal.property) ? deal.property[0] : deal.property;
      const customer = Array.isArray(deal.customer) ? deal.customer[0] : deal.customer;
      return {
        value: deal.id,
        label: [property?.title, customer?.name, property?.deal_type, deal.stage].filter(Boolean).join(" · ") || deal.id.slice(0, 8),
        propertyType: property?.property_type ?? "",
        dealType: property?.deal_type ?? "",
        prefill: {
          dealType: property?.deal_type ?? "",
          propertyTitle: property?.title ?? "",
          propertyAddress: property?.address ?? "",
          propertyType: property?.property_type ?? "",
          amount: deal.amount,
          monthlyRent: deal.monthly_rent,
          downPayment: deal.down_payment,
          balanceDate: deal.balance_date,
          contractDate: deal.contract_date,
          moveInDate: deal.move_in_date,
          lessorName: deal.lessor_name,
          lessorPhone: deal.lessor_phone,
          lessorAccount: deal.lessor_account,
          lesseeName: deal.lessee_name,
          lesseePhone: deal.lessee_phone,
          termsNote: deal.terms_note,
          clauses: [],
          officeName: office.name,
          officePhone: office.phone,
          officeAddress: office.address,
          agentName: profile.name,
          agentPhone: profile.phone,
        },
      };
    });

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
        title="계약관리"
        description="거래별 확인 체크리스트와 특약을 정리해요. 계약서·확인설명서 작성은 계약서 관리에서 해요."
        actions={
          <div className="flex flex-wrap gap-2">
            <GatedLink href="/contracts/new" kind="deal" blocked={gate.blocked.deal} isOwner={gate.isOwner} className={buttonVariants()}>
              <Plus data-icon="inline-start" />
              계약 시작
            </GatedLink>
            {isApp ? (
              <GatedLink
                href="/contracts/documents"
                kind="deal"
                blocked={gate.blocked.deal}
                isOwner={gate.isOwner}
                className={buttonVariants()}
              >
                <FileText data-icon="inline-start" />
                계약서
              </GatedLink>
            ) : (
              <ContractWriteEntry
                deals={writeDeals}
                blocked={gate.blocked.deal}
                isOwner={gate.isOwner}
                variant="outline"
              />
            )}
          </div>
        }
      />

      <Tabs defaultValue={tab === "clauses" ? "clauses" : "deals"}>
        <TabsList className="app:w-full">
          <TabsTrigger value="deals" className="app:px-1 app:text-sm">
            진행 중<span className="app:hidden"> 계약</span> ({active.length})
          </TabsTrigger>
          <TabsTrigger value="closed" className="app:px-1 app:text-sm">
            종료<span className="app:hidden">된 계약</span> ({closed.length})
          </TabsTrigger>
          <TabsTrigger value="clauses" className="app:px-1 app:text-sm">
            특약 라이브러리
          </TabsTrigger>
        </TabsList>
        <TabsContent value="deals" className="pt-4">
          {renderDeals(active, "진행 중인 계약 내역이 없어요.")}
        </TabsContent>
        <TabsContent value="closed" className="pt-4">
          {renderDeals(closed, "종료된 계약 내역이 없어요.")}
        </TabsContent>
        <TabsContent value="clauses" className="space-y-4 pt-4">
          <ComingSoonPanel
            title="AI 특약 추천"
            description="계약 조건에 맞는 특약 추천은 서비스 준비중이에요. 계약서·확인설명서는 계약서 작성에서 만들 수 있어요."
          />
          <Card>
            <CardHeader>
              <CardTitle>특약 문구</CardTitle>
              <CardDescription>예시 문구는 계약 조건에 맞게 수정해서 사용하세요</CardDescription>
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
