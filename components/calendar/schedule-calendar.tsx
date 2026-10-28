"use client";

import { useState, useSyncExternalStore, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { toast } from "sonner";
import { useBusy } from "@/lib/busy";
import { TaskDialog } from "@/components/tasks/task-board";
import { Button, buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toggleTask } from "@/lib/actions/tasks";
import type { CalendarEvent, CalendarKind } from "@/lib/calendar";
import { notifyRemindersChanged } from "@/lib/reminder-types";
import { cn } from "@/lib/utils";

const KINDS: { kind: CalendarKind; label: string; dot: string; chip: string }[] = [
  { kind: "task", label: "일정", dot: "bg-amber-500", chip: "bg-amber-500/10 text-amber-700 dark:text-amber-300" },
  { kind: "visit", label: "임장 기록", dot: "bg-emerald-500", chip: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" },
  { kind: "consultation", label: "중개 상담", dot: "bg-sky-500", chip: "bg-sky-500/10 text-sky-700 dark:text-sky-300" },
  { kind: "contract", label: "계약일", dot: "bg-violet-500", chip: "bg-violet-500/10 text-violet-700 dark:text-violet-300" },
  { kind: "balance", label: "잔금일", dot: "bg-rose-500", chip: "bg-rose-500/10 text-rose-700 dark:text-rose-300" },
];
const STYLE = Object.fromEntries(KINDS.map((k) => [k.kind, k])) as Record<CalendarKind, (typeof KINDS)[number]>;
const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

type Option = { value: string; label: string };

/**
 * 숨긴 일정 종류. 달을 옮기면 페이지가 다시 렌더링되므로 컴포넌트 상태 대신
 * localStorage에 두어 달 이동·새로고침 후에도 유지한다.
 */
const HIDDEN_KEY = "zipand:calendar-hidden";
const hiddenListeners = new Set<() => void>();

function subscribeHidden(listener: () => void) {
  hiddenListeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    hiddenListeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function saveHiddenKinds(kinds: CalendarKind[]) {
  localStorage.setItem(HIDDEN_KEY, kinds.join(","));
  hiddenListeners.forEach((listener) => listener());
}

function useHiddenKinds() {
  const raw = useSyncExternalStore(
    subscribeHidden,
    () => localStorage.getItem(HIDDEN_KEY) ?? "",
    () => ""
  );
  return raw ? (raw.split(",") as CalendarKind[]) : [];
}

interface ScheduleCalendarProps {
  /** YYYY-MM */
  month: string;
  prevMonth: string;
  nextMonth: string;
  /** 달력에 표시할 날짜 목록 (첫 주 일요일 ~ 마지막 주 토요일) */
  days: string[];
  today: string;
  events: CalendarEvent[];
  members: Option[];
  properties: Option[];
  customers: Option[];
}

/** 제목(YYYY년 M월)을 누르면 연도·월을 골라 바로 이동한다 */
function MonthPicker({ year, month }: { year: number; month: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(year);

  const go = (m: number) => {
    setOpen(false);
    router.push(`?month=${viewYear}-${String(m).padStart(2, "0")}`, { scroll: false });
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setViewYear(year);
      }}
    >
      <PopoverTrigger
        render={
          <button
            type="button"
            className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-lg font-semibold tabular-nums hover:bg-muted"
            aria-label="연도와 월 선택"
          />
        }
      >
        {year}년 {month}월
        <ChevronDown className="size-4 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64">
        <div className="flex items-center justify-between">
          <Button size="icon-sm" variant="ghost" aria-label="이전 해" onClick={() => setViewYear((y) => y - 1)}>
            <ChevronLeft />
          </Button>
          <span className="font-semibold tabular-nums">{viewYear}년</span>
          <Button size="icon-sm" variant="ghost" aria-label="다음 해" onClick={() => setViewYear((y) => y + 1)}>
            <ChevronRight />
          </Button>
        </div>
        <div className="grid grid-cols-4 gap-1">
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
            const current = viewYear === year && m === month;
            return (
              <Button key={m} size="sm" variant={current ? "default" : "ghost"} onClick={() => go(m)}>
                {m}월
              </Button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function formatDayTitle(date: string, withYear = false) {
  const d = new Date(`${date}T00:00:00Z`);
  return `${withYear ? `${d.getUTCFullYear()}년 ` : ""}${d.getUTCMonth() + 1}월 ${d.getUTCDate()}일 (${WEEKDAYS[d.getUTCDay()]})`;
}

export const dayHref = (date: string) => `/schedule/${date}`;

/** 하루치 일정 목록. 할 일은 바로 완료 처리할 수 있다 */
export function DayEventList({ events, emptyText = "일정이 없어요." }: { events: CalendarEvent[]; emptyText?: string }) {
  const [pending, startTransition] = useTransition();
  useBusy(pending);

  const toggleDone = (taskId: string, done: boolean) =>
    startTransition(async () => {
      const result = await toggleTask(taskId, done);
      if (result.error) toast.error(result.error);
      else notifyRemindersChanged();
    });

  if (events.length === 0) {
    return <p className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">{emptyText}</p>;
  }

  return (
    <ul className="space-y-2">
      {events.map((e) => {
        const body = (
          <>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className={cn("size-2 rounded-full", STYLE[e.kind].dot)} />
              {e.label}
              {e.time && <span className="tabular-nums">· {e.time}</span>}
            </p>
            <p className={cn("truncate text-sm font-medium", e.done && "text-muted-foreground line-through")}>{e.title}</p>
            {e.detail && <p className="line-clamp-2 text-xs text-muted-foreground">{e.detail}</p>}
          </>
        );
        return (
          <li key={e.id} className="flex items-start gap-2 rounded-lg border bg-card p-2.5">
            {e.taskId && (
              <Checkbox
                className="mt-0.5"
                checked={e.done}
                disabled={pending}
                onCheckedChange={(v) => toggleDone(e.taskId!, Boolean(v))}
                aria-label="완료"
              />
            )}
            {e.href ? (
              <Link href={e.href} className="min-w-0 flex-1 space-y-0.5 hover:opacity-80">
                {body}
              </Link>
            ) : (
              <div className="min-w-0 flex-1 space-y-0.5">{body}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/** 일정 종류별 색상 범례 */
export function KindLegend({ counts }: { counts?: Partial<Record<CalendarKind, number>> }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {KINDS.map((k) => (
        <span key={k.kind} className="flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs">
          <span className={cn("size-2 rounded-full", k.dot)} />
          {k.label}
          {counts && <span className="tabular-nums text-muted-foreground">{counts[k.kind] ?? 0}</span>}
        </span>
      ))}
    </div>
  );
}

export function ScheduleCalendar({
  month,
  prevMonth,
  nextMonth,
  days,
  today,
  events,
  members,
  properties,
  customers,
}: ScheduleCalendarProps) {
  // 날짜를 누르면 일정 상세(/schedule/[date])로 이동하고, 옆 목록은 오늘(다른 달이면 1일) 일정을 보여준다
  const selected = today.startsWith(month) ? today : `${month}-01`;
  const hidden = useHiddenKinds();

  const visible = events.filter((e) => !hidden.includes(e.kind));
  const byDate = new Map<string, CalendarEvent[]>();
  for (const e of visible) byDate.set(e.date, [...(byDate.get(e.date) ?? []), e]);
  const selectedEvents = byDate.get(selected) ?? [];
  const [year, monthNum] = month.split("-").map(Number);

  const toggleKind = (kind: CalendarKind) =>
    saveHiddenKinds(hidden.includes(kind) ? hidden.filter((k) => k !== kind) : [...hidden, kind]);

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1">
            <Link href={`?month=${prevMonth}`} scroll={false} aria-label="이전 달" className={buttonVariants({ variant: "ghost", size: "icon-sm" })}>
              <ChevronLeft />
            </Link>
            <MonthPicker year={year} month={monthNum} />
            <Link href={`?month=${nextMonth}`} scroll={false} aria-label="다음 달" className={buttonVariants({ variant: "ghost", size: "icon-sm" })}>
              <ChevronRight />
            </Link>
          </div>
          {!today.startsWith(month) && (
            <Link href="?" scroll={false} className={buttonVariants({ variant: "outline", size: "sm" })}>
              오늘
            </Link>
          )}
          <div className="ml-auto flex flex-wrap gap-1">
            {KINDS.map((k) => {
              const off = hidden.includes(k.kind);
              return (
                <button
                  key={k.kind}
                  type="button"
                  onClick={() => toggleKind(k.kind)}
                  aria-pressed={!off}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs transition-opacity",
                    off && "opacity-40"
                  )}
                >
                  <span className={cn("size-2 rounded-full", k.dot)} />
                  {k.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border">
          <div className="grid grid-cols-7 border-b bg-muted/40 text-center text-xs font-medium">
            {WEEKDAYS.map((w, i) => (
              <div key={w} className={cn("py-1.5", i === 0 && "text-rose-500", i === 6 && "text-sky-600")}>
                {w}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {days.map((date, i) => {
              const dayEvents = byDate.get(date) ?? [];
              const inMonth = date.startsWith(month);
              const weekday = i % 7;
              return (
                <Link
                  key={date}
                  href={dayHref(date)}
                  aria-label={`${formatDayTitle(date)} 일정 ${dayEvents.length}건`}
                  className={cn(
                    "flex min-h-16 flex-col gap-1 border-b border-r p-1 text-left transition-colors hover:bg-muted/50 sm:min-h-24 [&:nth-child(7n)]:border-r-0",
                    !inMonth && "bg-muted/30 text-muted-foreground/60"
                  )}
                >
                  <span
                    className={cn(
                      "flex size-6 items-center justify-center rounded-full text-xs tabular-nums",
                      date === today && "bg-primary font-semibold text-primary-foreground",
                      date !== today && weekday === 0 && inMonth && "text-rose-500",
                      date !== today && weekday === 6 && inMonth && "text-sky-600"
                    )}
                  >
                    {Number(date.slice(8))}
                  </span>
                  <span className="hidden flex-col gap-0.5 sm:flex">
                    {dayEvents.slice(0, 3).map((e) => (
                      <span
                        key={e.id}
                        className={cn("truncate rounded px-1 py-px text-[11px] leading-4", STYLE[e.kind].chip, e.done && "line-through opacity-60")}
                      >
                        {e.kind === "task" ? `[${e.label}] ` : e.kind === "contract" || e.kind === "balance" ? `${e.label} ` : ""}
                        {e.title}
                      </span>
                    ))}
                    {dayEvents.length > 3 && <span className="px-1 text-[11px] text-muted-foreground">+{dayEvents.length - 3}건</span>}
                  </span>
                  {dayEvents.length > 0 && (
                    <span className="flex flex-wrap gap-0.5 sm:hidden">
                      {dayEvents.slice(0, 4).map((e) => (
                        <span key={e.id} className={cn("size-1.5 rounded-full", STYLE[e.kind].dot)} />
                      ))}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* 큰 화면에서는 달력 높이를 넘지 않고 목록만 스크롤한다 */}
      <div className="lg:relative">
        <div className="flex flex-col gap-3 lg:absolute lg:inset-0">
          <div className="flex items-center justify-between gap-2">
            <Link href={dayHref(selected)} className="font-semibold hover:underline">
              {formatDayTitle(selected)}
            </Link>
            <TaskDialog
              members={members}
              properties={properties}
              customers={customers}
              defaultDue={`${selected}T10:00`}
              title="일정 추가"
              description="임장, 상담, 계약, 중도금·잔금, 연락 등 일정을 달력에 기록해요. 계약일·잔금일은 계약관리에서 입력해도 표시돼요."
              trigger={
                <Button size="sm">
                  <Plus data-icon="inline-start" />
                  일정 추가
                </Button>
              }
            />
          </div>
          <div className="max-h-96 min-h-0 flex-1 overflow-y-auto overscroll-contain lg:max-h-none">
            <DayEventList events={selectedEvents} />
          </div>
          {selectedEvents.length > 0 && (
            <Link href={dayHref(selected)} className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full")}>
              {formatDayTitle(selected)} 일정 자세히 보기
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
