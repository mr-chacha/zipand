import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { DayEventList, KindLegend, dayHref, formatDayTitle } from "@/components/calendar/schedule-calendar";
import { PageHeader } from "@/components/page-header";
import { TaskDialog } from "@/components/tasks/task-board";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { addDays, getCalendarEvents, type CalendarKind } from "@/lib/calendar";
import { todayKst } from "@/lib/format";
import { getCustomerOptions, getOfficeMembers, getPropertyOptions } from "@/lib/queries";

export const metadata: Metadata = { title: "일정 상세" };

function isValidDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(`${value}T00:00:00Z`).getTime()) && addDays(value, 0) === value;
}

export default async function ScheduleDayPage({ params }: PageProps<"/schedule/[date]">) {
  const { date } = await params;
  if (!isValidDate(date)) notFound();

  const [events, members, propertyOptions, customerOptions] = await Promise.all([
    getCalendarEvents(date, date),
    getOfficeMembers(),
    getPropertyOptions(),
    getCustomerOptions(),
  ]);
  // 날짜만 있는 일정(계약일·잔금일)을 먼저, 나머지는 시간순
  const dayEvents = events
    .filter((e) => e.date === date)
    .sort((a, b) => (a.time ?? "").localeCompare(b.time ?? ""));
  const counts = dayEvents.reduce<Partial<Record<CalendarKind, number>>>((acc, e) => ({ ...acc, [e.kind]: (acc[e.kind] ?? 0) + 1 }), {});
  const today = todayKst();
  const doneCount = dayEvents.filter((e) => e.taskId && e.done).length;
  const taskCount = dayEvents.filter((e) => e.taskId).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title={formatDayTitle(date, true)}
        description={
          dayEvents.length === 0
            ? "등록된 일정이 없어요."
            : `일정 ${dayEvents.length}건${taskCount ? ` · 할 일 ${doneCount}/${taskCount} 완료` : ""}`
        }
        backHref={`/dashboard?month=${date.slice(0, 7)}`}
        backLabel="대시보드"
        actions={
          <TaskDialog
            members={members.map((m) => ({ value: m.id, label: m.name }))}
            properties={propertyOptions.map((p) => ({ value: p.id, label: p.title }))}
            customers={customerOptions.map((c) => ({ value: c.id, label: c.name }))}
            defaultDue={`${date}T10:00`}
            title="일정 추가"
            description="임장, 상담, 계약, 중도금·잔금, 연락 등 일정을 기록해요. 계약일·잔금일은 계약관리에서 입력해도 표시돼요."
            trigger={
              <Button className="app:w-full">
                <Plus data-icon="inline-start" />
                일정 추가
              </Button>
            }
          />
        }
      />

      <div className="flex items-center gap-2">
        <Link href={dayHref(addDays(date, -1))} className={buttonVariants({ variant: "outline", size: "sm" })} aria-label="전날">
          <ChevronLeft data-icon="inline-start" />
          전날
        </Link>
        {date !== today && (
          <Link href={dayHref(today)} className={buttonVariants({ variant: "outline", size: "sm" })}>
            오늘
          </Link>
        )}
        <Link href={dayHref(addDays(date, 1))} className={buttonVariants({ variant: "outline", size: "sm" })} aria-label="다음날">
          다음날
          <ChevronRight data-icon="inline-end" />
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>일정 목록</CardTitle>
          <CardDescription>시간순 · 할 일은 체크해서 완료 처리해요</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <KindLegend counts={counts} />
          <DayEventList events={dayEvents} emptyText="이 날짜에 등록된 일정이 없어요." />
        </CardContent>
      </Card>
    </div>
  );
}
