import { getSession } from "@/lib/auth";
import { isoToKstLocal, kstDayStart, todayKst } from "@/lib/format";

export type CalendarKind = "task" | "visit" | "consultation" | "contract" | "balance";

export interface CalendarEvent {
  id: string;
  kind: CalendarKind;
  /** 한국 시간 YYYY-MM-DD */
  date: string;
  /** HH:mm, 날짜만 있는 일정(계약일·잔금일)은 null */
  time: string | null;
  title: string;
  /** 일정 종류 표시 (할 일은 '임장', '잔금' 등 종류) */
  label: string;
  detail: string | null;
  href: string | null;
  /** 할 일만 완료 처리 가능 */
  taskId?: string;
  done?: boolean;
}

/** YYYY-MM-DD 날짜 계산 (시간대 영향 없이 UTC로 계산) */
export function addDays(date: string, days: number) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** month(YYYY-MM)를 감싸는 달력 범위: 첫 주 일요일 ~ 마지막 주 토요일 */
export function monthGrid(month: string) {
  const first = `${month}-01`;
  const firstDay = new Date(`${first}T00:00:00Z`);
  const next = new Date(firstDay);
  next.setUTCMonth(next.getUTCMonth() + 1);
  const last = addDays(next.toISOString().slice(0, 10), -1);

  const start = addDays(first, -firstDay.getUTCDay());
  const end = addDays(last, 6 - new Date(`${last}T00:00:00Z`).getUTCDay());
  const prev = new Date(firstDay);
  prev.setUTCMonth(prev.getUTCMonth() - 1);
  return {
    start,
    end,
    prevMonth: prev.toISOString().slice(0, 7),
    nextMonth: next.toISOString().slice(0, 7),
  };
}

export function parseMonth(value: unknown) {
  return typeof value === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(value) ? value : todayKst().slice(0, 7);
}

function splitKst(iso: string) {
  const local = isoToKstLocal(iso);
  return { date: local.slice(0, 10), time: local.slice(11, 16) };
}

/** 달력 범위 안의 일정: 할 일, 임장 기록, 상담(중개) 기록, 계약일, 잔금일 */
export async function getCalendarEvents(start: string, end: string): Promise<CalendarEvent[]> {
  const { supabase } = await getSession();
  const from = kstDayStart(start);
  const to = kstDayStart(addDays(end, 1));

  const [tasks, visits, consultations, deals] = await Promise.all([
    supabase
      .from("tasks")
      .select("id, title, type, due_at, done, property:properties(id, title), customer:customers(id, name), assignee:profiles!tasks_assignee_id_fkey(name)")
      .gte("due_at", from)
      .lt("due_at", to)
      .order("due_at"),
    supabase
      .from("property_visits")
      .select("id, visited_at, memo, property:properties(id, title)")
      .gte("visited_at", from)
      .lt("visited_at", to),
    supabase
      .from("consultations")
      .select("id, consulted_at, channel, content, customer:customers(id, name)")
      .gte("consulted_at", from)
      .lt("consulted_at", to),
    supabase
      .from("deals")
      .select("id, stage, contract_date, balance_date, property:properties(title), customer:customers(name)")
      .neq("stage", "취소")
      .or(`and(contract_date.gte.${start},contract_date.lte.${end}),and(balance_date.gte.${start},balance_date.lte.${end})`),
  ]);

  const events: CalendarEvent[] = [];

  for (const t of tasks.data ?? []) {
    const { date, time } = splitKst(t.due_at);
    events.push({
      id: `task-${t.id}`,
      kind: "task",
      date,
      time,
      title: t.title,
      label: t.type,
      detail: [t.property?.title, t.customer?.name, t.assignee && `담당 ${t.assignee.name}`].filter(Boolean).join(" · ") || null,
      href: t.property ? `/properties/${t.property.id}` : t.customer ? `/customers/${t.customer.id}` : null,
      taskId: t.id,
      done: t.done,
    });
  }
  for (const v of visits.data ?? []) {
    const { date, time } = splitKst(v.visited_at);
    events.push({
      id: `visit-${v.id}`,
      kind: "visit",
      date,
      time,
      title: v.property?.title ?? "임장 기록",
      label: "임장 기록",
      detail: v.memo,
      href: v.property ? `/properties/${v.property.id}/visit` : null,
    });
  }
  for (const c of consultations.data ?? []) {
    const { date, time } = splitKst(c.consulted_at);
    events.push({
      id: `consult-${c.id}`,
      kind: "consultation",
      date,
      time,
      title: `${c.customer?.name ?? "고객"} ${c.channel} 상담`,
      label: "중개 상담",
      detail: c.content,
      href: c.customer ? `/customers/${c.customer.id}` : null,
    });
  }
  for (const d of deals.data ?? []) {
    const title = [d.property?.title, d.customer?.name].filter(Boolean).join(" · ") || "거래";
    if (d.contract_date && d.contract_date >= start && d.contract_date <= end) {
      events.push({ id: `contract-${d.id}`, kind: "contract", date: d.contract_date, time: null, title, label: "계약일", detail: d.stage, href: `/contracts/${d.id}` });
    }
    if (d.balance_date && d.balance_date >= start && d.balance_date <= end) {
      events.push({ id: `balance-${d.id}`, kind: "balance", date: d.balance_date, time: null, title, label: "잔금일", detail: d.stage, href: `/contracts/${d.id}` });
    }
  }

  // 날짜만 있는 일정(계약·잔금)을 먼저, 이후 시간순
  return events.sort((a, b) => a.date.localeCompare(b.date) || (a.time ?? "").localeCompare(b.time ?? ""));
}
