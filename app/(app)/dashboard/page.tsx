import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Building2, CalendarClock, FileUp, Plus, UserPlus } from "lucide-react";
import { GatedLink } from "@/components/office-gate";
import { PageHeader } from "@/components/page-header";
import { PropertyThumbnail } from "@/components/property-thumbnail";
import { DealStageBadge, PropertyStatusBadge } from "@/components/status-badge";
import { ScheduleCalendar } from "@/components/calendar/schedule-calendar";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { isAppRequest } from "@/lib/app-mode";
import { getSession } from "@/lib/auth";
import { addDays, getCalendarEvents, monthGrid, parseMonth } from "@/lib/calendar";
import { CUSTOMER_CLOSED_STATUSES } from "@/lib/constants";
import { formatDate, formatDateTime, formatPrice, todayKst } from "@/lib/format";
import { getOfficeGate } from "@/lib/office-gate";
import { getCustomerOptions, getOfficeMembers, getPropertyList, getPropertyOptions } from "@/lib/queries";
import { AppDashboard } from "./app-dashboard";
import { GettingStarted } from "./getting-started";

export const metadata: Metadata = { title: "대시보드" };

const quickActions = [
  { title: "매물 등록", description: "새 매물 정보를 기록해요", href: "/properties/new", icon: Plus, kind: "property" },
  { title: "고객 등록", description: "고객 조건과 상담을 남겨요", href: "/customers/new", icon: UserPlus, kind: "customer" },
  { title: "서류 업로드", description: "등기·건축물대장을 보관해요", href: "/documents", icon: FileUp, kind: "document" },
] as const;

export default async function DashboardPage({ searchParams }: PageProps<"/dashboard">) {
  const { month: monthParam } = await searchParams;
  const month = parseMonth(monthParam);
  if (await isAppRequest()) return <AppDashboard month={month} />;

  const { supabase } = await getSession();
  const grid = monthGrid(month);
  const days: string[] = [];
  for (let d = grid.start; d <= grid.end; d = addDays(d, 1)) days.push(d);

  const [events, members, propertyOptions, customerOptions, recentProperties, pendingDocs, activeDeals, customerCount, gate] =
    await Promise.all([
      getCalendarEvents(grid.start, grid.end),
      getOfficeMembers(),
      getPropertyOptions(),
      getCustomerOptions(),
      getPropertyList(4),
      supabase
        .from("documents")
        .select("id, doc_type, created_at, property:properties(title)")
        .eq("status", "검토 필요")
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("deals")
        .select("id, stage, contract_date, balance_date, property:properties(title), customer:customers(name)")
        .not("stage", "in", "(완료,취소)")
        .order("balance_date", { ascending: true, nullsFirst: false })
        .limit(6),
      supabase
        .from("customers")
        .select("id", { count: "exact", head: true })
        .not("status", "in", `(${CUSTOMER_CLOSED_STATUSES.map((s) => `"${s}"`).join(",")})`),
      getOfficeGate(),
    ]);

  const stats = [
    { label: "등록 매물", value: propertyOptions.length, href: "/properties" },
    { label: "관리 중 고객", value: customerCount.count ?? 0, href: "/customers" },
    { label: "검토 필요 문서", value: pendingDocs.data?.length ?? 0, href: "/documents?status=검토 필요" },
    { label: "진행 중 계약", value: activeDeals.data?.length ?? 0, href: "/contracts" },
  ];
  const today = todayKst();
  const todayEvents = events.filter((e) => e.date === today && !e.done).length;

  return (
    <div className="space-y-6">
      <PageHeader title={`안녕하세요 중개사님`} description="오늘 처리할 업무와 검토가 필요한 항목을 확인하세요." />

      <GettingStarted />

      <div className="grid gap-3 sm:grid-cols-3">
        {quickActions.map((action) => (
          <GatedLink
            key={action.title}
            href={action.href}
            kind={action.kind}
            blocked={gate.blocked[action.kind]}
            isOwner={gate.isOwner}
            className="group flex items-center gap-4 rounded-xl border bg-card p-4 text-left transition-colors hover:border-primary/40 hover:bg-primary/5"
          >
            <span className="flex size-11 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <action.icon className="size-5" />
            </span>
            <div className="flex-1">
              <p className="font-semibold">{action.title}</p>
              <p className="text-xs text-muted-foreground">{action.description}</p>
            </div>
            <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </GatedLink>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="rounded-xl border bg-card p-4 hover:border-primary/40">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="text-2xl font-bold tabular-nums">{s.value}</p>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>일정</CardTitle>
          <CardDescription>
            임장·상담 기록, 계약일·잔금일과 직접 추가한 일정을 한 달 단위로 확인해요 · 오늘 {todayEvents}건
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScheduleCalendar
            month={month}
            prevMonth={grid.prevMonth}
            nextMonth={grid.nextMonth}
            days={days}
            today={today}
            events={events}
            members={members.map((m) => ({ value: m.id, label: m.name }))}
            properties={propertyOptions.map((p) => ({ value: p.id, label: p.title }))}
            customers={customerOptions.map((c) => ({ value: c.id, label: c.name }))}
          />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>검토 필요 문서</CardTitle>
            <CardDescription>핵심 항목 확인을 마쳐주세요</CardDescription>
            <CardAction>
              <Link href="/documents" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                전체
              </Link>
            </CardAction>
          </CardHeader>
          <CardContent className="space-y-2">
            {(pendingDocs.data ?? []).length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">검토할 문서가 없어요.</p>
            )}
            {pendingDocs.data?.map((doc) => (
              <Link key={doc.id} href={`/documents/${doc.id}`} className="block space-y-0.5 rounded-lg border p-3 hover:bg-muted/50">
                <p className="text-sm font-medium">{doc.doc_type}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {doc.property?.title} · {formatDateTime(doc.created_at)}
                </p>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>진행 중 계약</CardTitle>
            <CardDescription>잔금일이 가까운 순서</CardDescription>
            <CardAction>
              <Link href="/contracts" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                계약관리
                <ArrowRight data-icon="inline-end" />
              </Link>
            </CardAction>
          </CardHeader>
          <CardContent className="divide-y">
            {(activeDeals.data ?? []).length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">진행 중인 거래가 없어요.</p>
            )}
            {activeDeals.data?.map((deal) => (
              <Link key={deal.id} href={`/contracts/${deal.id}`} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <span className="flex size-9 items-center justify-center rounded-lg bg-muted">
                  <Building2 className="size-4 text-muted-foreground" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{deal.property?.title}</p>
                  <p className="text-xs text-muted-foreground">{deal.customer?.name ?? "고객 미지정"}</p>
                </div>
                <DealStageBadge stage={deal.stage} />
                <span className="hidden items-center gap-1 text-xs text-muted-foreground sm:flex">
                  <CalendarClock className="size-3.5" />
                  잔금 {formatDate(deal.balance_date)}
                </span>
              </Link>
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
          {recentProperties.length === 0 && (
            <p className="col-span-full py-6 text-center text-sm text-muted-foreground">등록된 매물이 없어요.</p>
          )}
          {recentProperties.map((p) => (
            <Link
              key={p.id}
              href={`/properties/${p.id}`}
              className="overflow-hidden rounded-lg border transition-colors hover:border-primary/40"
            >
              <PropertyThumbnail type={p.property_type} src={p.thumbUrl} alt={p.title} className="aspect-video" />
              <div className="space-y-1 p-3">
                <div className="flex items-center gap-1.5">
                  <PropertyStatusBadge status={p.status} />
                  <span className="text-xs text-muted-foreground">
                    {p.property_type} · {p.deal_type}
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
