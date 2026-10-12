import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CalendarClock,
  CheckCircle2,
  Circle,
  FileSearch,
  Mic,
  Plus,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { PropertyThumbnail } from "@/components/property-thumbnail";
import { AnalysisStatusBadge, PropertyStatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { aiUsage, currentUser, deals, todayTasks } from "@/lib/mock/dashboard";
import { documents } from "@/lib/mock/documents";
import { properties } from "@/lib/mock/properties";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "대시보드" };

const quickActions = [
  {
    title: "매물 등록",
    description: "새 매물 정보를 기록해요",
    href: "/properties/new",
    icon: Plus,
  },
  {
    title: "임장 기록",
    description: "사진·음성으로 현장을 남겨요",
    href: "/properties/p-1002/visit",
    icon: Mic,
  },
  {
    title: "문서 분석",
    description: "등기·건축물대장을 분석해요",
    href: "/documents",
    icon: FileSearch,
  },
];

const usageItems = [
  { label: "임장 요약", ...aiUsage.visitSummary },
  { label: "문서 분석", ...aiUsage.documentAnalysis },
  { label: "브리핑 생성", ...aiUsage.briefing },
];

export default function DashboardPage() {
  const pendingDocs = documents.filter((d) => d.status !== "검토 완료");
  const recentProperties = [...properties]
    .sort((a, b) => b.registeredAt.localeCompare(a.registeredAt))
    .slice(0, 4);
  const doneCount = todayTasks.filter((t) => t.done).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`안녕하세요, ${currentUser.name}님`}
        description="오늘 처리할 업무와 검토가 필요한 항목을 확인하세요."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        {quickActions.map((action) => (
          <Link
            key={action.title}
            href={action.href}
            className="group flex items-center gap-4 rounded-xl border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-primary/5"
          >
            <span className="flex size-11 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <action.icon className="size-5" />
            </span>
            <div className="flex-1">
              <p className="font-semibold">{action.title}</p>
              <p className="text-xs text-muted-foreground">{action.description}</p>
            </div>
            <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>오늘의 업무</CardTitle>
            <CardDescription>
              {todayTasks.length}건 중 {doneCount}건 완료
            </CardDescription>
            <CardAction>
              <Badge variant="secondary">10월 12일 (월)</Badge>
            </CardAction>
          </CardHeader>
          <CardContent className="space-y-1">
            {todayTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-muted/50"
              >
                {task.done ? (
                  <CheckCircle2 className="size-5 text-success" />
                ) : (
                  <Circle className="size-5 text-muted-foreground/50" />
                )}
                <span className="w-12 text-sm text-muted-foreground tabular-nums">{task.time}</span>
                <Badge variant="outline" className="w-12 justify-center">
                  {task.type}
                </Badge>
                <span className={cn("flex-1 text-sm", task.done && "text-muted-foreground line-through")}>
                  {task.title}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>검토 대기 문서</CardTitle>
            <CardDescription>AI 분석 결과를 확인해 주세요</CardDescription>
            <CardAction>
              <Link href="/documents" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                전체
              </Link>
            </CardAction>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingDocs.map((doc) => (
              <Link
                key={doc.id}
                href={doc.status === "검토 필요" ? `/documents/${doc.id}` : "/documents"}
                className="block space-y-1.5 rounded-lg border p-3 hover:bg-muted/50"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">{doc.type}</span>
                  <AnalysisStatusBadge status={doc.status} />
                </div>
                <p className="truncate text-xs text-muted-foreground">{doc.propertyTitle}</p>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>진행 중 거래</CardTitle>
            <CardDescription>계약 단계별 진행 상황</CardDescription>
          </CardHeader>
          <CardContent className="divide-y">
            {deals.map((deal) => (
              <Link
                key={deal.id}
                href={`/properties/${deal.propertyId}`}
                className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
              >
                <span className="flex size-9 items-center justify-center rounded-lg bg-muted">
                  <Building2 className="size-4 text-muted-foreground" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{deal.propertyTitle}</p>
                  <p className="text-xs text-muted-foreground">{deal.customerAlias}</p>
                </div>
                <Badge variant="secondary">{deal.stage}</Badge>
                <span className="hidden items-center gap-1 text-xs text-muted-foreground sm:flex">
                  <CalendarClock className="size-3.5" />
                  {deal.dueDate.slice(5).replace("-", "/")}
                </span>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>이번 달 AI 사용량</CardTitle>
            <CardDescription>{currentUser.plan} 플랜 기준</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {usageItems.map((item) => (
              <div key={item.label} className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span>{item.label}</span>
                  <span className="text-muted-foreground tabular-nums">
                    {item.used} / {item.limit}
                  </span>
                </div>
                <Progress value={(item.used / item.limit) * 100} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>최근 매물</CardTitle>
          <CardAction>
            <Link href="/properties" className={buttonVariants({ variant: "ghost", size: "sm" })}>
              매물 관리
              <ArrowRight data-icon="inline-end" />
            </Link>
          </CardAction>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {recentProperties.map((p) => (
            <Link
              key={p.id}
              href={`/properties/${p.id}`}
              className="overflow-hidden rounded-lg border transition-colors hover:border-primary/40"
            >
              <PropertyThumbnail type={p.propertyType} className="aspect-video" />
              <div className="space-y-1 p-3">
                <div className="flex items-center gap-1.5">
                  <PropertyStatusBadge status={p.status} />
                  <span className="text-xs text-muted-foreground">
                    {p.propertyType} · {p.dealType}
                  </span>
                </div>
                <p className="truncate text-sm font-medium">{p.title}</p>
                <p className="text-sm font-semibold text-primary">{formatPrice(p)}</p>
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
