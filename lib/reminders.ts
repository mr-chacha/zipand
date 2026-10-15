import "server-only";
import { addDays } from "@/lib/calendar";
import { getSession } from "@/lib/auth";
import { todayKst } from "@/lib/format";
import {
  DATE_ONLY_EVENT_HOUR,
  REMINDER_LEAD_MINUTES,
  type Reminder,
} from "@/lib/reminder-types";

export type { Reminder, ReminderKind } from "@/lib/reminder-types";
export { DATE_ONLY_EVENT_HOUR, REMINDER_LEAD_MINUTES } from "@/lib/reminder-types";

function atKst(date: string, hour: number, minute = 0) {
  return new Date(
    `${date}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00+09:00`
  );
}

function withLead(eventAt: Date, leadMinutes = REMINDER_LEAD_MINUTES) {
  return new Date(eventAt.getTime() - leadMinutes * 60_000);
}

/**
 * 다가오는 알림 대상: 미완료 할 일 + 계약일·잔금일(당일 오전 9시 기준).
 * 목록·스케줄러 공용. `daysAhead`일 이내만.
 */
export async function getUpcomingReminders(daysAhead = 30): Promise<Reminder[]> {
  const { supabase } = await getSession();
  const start = todayKst();
  const end = addDays(start, daysAhead);
  const now = Date.now();
  const fromIso = new Date().toISOString();
  const toIso = atKst(addDays(end, 1), 0).toISOString();

  const [tasks, deals] = await Promise.all([
    supabase
      .from("tasks")
      .select("id, title, type, due_at, property:properties(id, title), customer:customers(id, name)")
      .eq("done", false)
      .gte("due_at", fromIso)
      .lt("due_at", toIso)
      .order("due_at"),
    supabase
      .from("deals")
      .select("id, stage, contract_date, balance_date, property:properties(title), customer:customers(name)")
      .neq("stage", "취소")
      .or(`and(contract_date.gte.${start},contract_date.lte.${end}),and(balance_date.gte.${start},balance_date.lte.${end})`),
  ]);

  const reminders: Reminder[] = [];

  for (const t of tasks.data ?? []) {
    const eventAt = new Date(t.due_at);
    const notifyAt = withLead(eventAt);
    reminders.push({
      key: `task-${t.id}`,
      kind: "task",
      title: t.title,
      label: t.type,
      detail: [t.property?.title, t.customer?.name].filter(Boolean).join(" · ") || null,
      href: t.property ? `/properties/${t.property.id}` : t.customer ? `/customers/${t.customer.id}` : "/dashboard",
      eventAt: eventAt.toISOString(),
      notifyAt: notifyAt.toISOString(),
    });
  }

  for (const d of deals.data ?? []) {
    const title = [d.property?.title, d.customer?.name].filter(Boolean).join(" · ") || "거래";
    const href = `/contracts/${d.id}`;

    if (d.contract_date && d.contract_date >= start && d.contract_date <= end) {
      const eventAt = atKst(d.contract_date, DATE_ONLY_EVENT_HOUR);
      if (eventAt.getTime() >= now) {
        reminders.push({
          key: `contract-${d.id}`,
          kind: "contract",
          title,
          label: "계약일",
          detail: d.stage,
          href,
          eventAt: eventAt.toISOString(),
          notifyAt: withLead(eventAt).toISOString(),
        });
      }
    }
    if (d.balance_date && d.balance_date >= start && d.balance_date <= end) {
      const eventAt = atKst(d.balance_date, DATE_ONLY_EVENT_HOUR);
      if (eventAt.getTime() >= now) {
        reminders.push({
          key: `balance-${d.id}`,
          kind: "balance",
          title,
          label: "잔금일",
          detail: d.stage,
          href,
          eventAt: eventAt.toISOString(),
          notifyAt: withLead(eventAt).toISOString(),
        });
      }
    }
  }

  return reminders.sort((a, b) => a.eventAt.localeCompare(b.eventAt));
}
