import Link from "next/link";
import { CalendarPlus, ChevronRight, Plus, UserPlus } from "lucide-react";
import { ScheduleCalendar } from "@/components/calendar/schedule-calendar";
import { GatedLink } from "@/components/office-gate";
import { PropertyThumbnail } from "@/components/property-thumbnail";
import { CustomerStatusBadge, PropertyStatusBadge } from "@/components/status-badge";
import { TaskDialog } from "@/components/tasks/task-board";
import { getSession } from "@/lib/auth";
import { addDays, getCalendarEvents, monthGrid } from "@/lib/calendar";
import { CUSTOMER_CLOSED_STATUSES } from "@/lib/constants";
import { formatDate, formatPrice, todayKst } from "@/lib/format";
import { getOfficeGate } from "@/lib/office-gate";
import { getCustomerOptions, getOfficeMembers, getPropertyList, getPropertyOptions } from "@/lib/queries";
import { GettingStarted } from "./getting-started";

const actionClass = "flex flex-col items-center gap-2 rounded-xl border bg-card px-2 py-4 text-sm font-medium active:bg-muted";
const iconClass = "flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground";

/** 안드로이드 앱 홈: 매물 등록·고객 등록·일정 추가 중심 */
export async function AppDashboard({ month }: { month: string }) {
  const { supabase, profile } = await getSession();
  const grid = monthGrid(month);
  const days: string[] = [];
  for (let d = grid.start; d <= grid.end; d = addDays(d, 1)) days.push(d);

  const [events, members, propertyOptions, customerOptions, recentProperties, recentCustomers, customerCount, gate] = await Promise.all([
    getCalendarEvents(grid.start, grid.end),
    getOfficeMembers(),
    getPropertyOptions(),
    getCustomerOptions(),
    getPropertyList(3),
    supabase.from("customers").select("id, name, status, deal_type, regions, updated_at").order("updated_at", { ascending: false }).limit(3),
    supabase
      .from("customers")
      .select("id", { count: "exact", head: true })
      .not("status", "in", `(${CUSTOMER_CLOSED_STATUSES.map((s) => `"${s}"`).join(",")})`),
    getOfficeGate(),
  ]);

  const today = todayKst();
  const todayEvents = events.filter((e) => e.date === today && !e.done).length;
  const stats = [
    { label: "오늘 일정", value: todayEvents, href: "#schedule" },
    { label: "등록 매물", value: propertyOptions.length, href: "/properties" },
    { label: "관리 중 고객", value: customerCount.count ?? 0, href: "/customers" },
  ];
  const options = {
    members: members.map((m) => ({ value: m.id, label: m.name })),
    properties: propertyOptions.map((p) => ({ value: p.id, label: p.title })),
    customers: customerOptions.map((c) => ({ value: c.id, label: c.name })),
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold">안녕하세요, {profile.name}님</h1>
        <p className="text-sm text-muted-foreground">오늘 일정 {todayEvents}건이 있어요</p>
      </div>

      <GettingStarted />

      <div className="grid grid-cols-3 gap-2">
        <GatedLink href="/properties/new" kind="property" blocked={gate.blocked.property} isOwner={gate.isOwner} className={actionClass}>
          <span className={iconClass}>
            <Plus className="size-5" />
          </span>
          매물 등록
        </GatedLink>
        <GatedLink href="/customers/new" kind="customer" blocked={gate.blocked.customer} isOwner={gate.isOwner} className={actionClass}>
          <span className={iconClass}>
            <UserPlus className="size-5" />
          </span>
          고객 등록
        </GatedLink>
        <TaskDialog
          {...options}
          defaultDue={`${today}T10:00`}
          title="일정 추가"
          description="임장, 상담, 계약, 중도금·잔금, 연락 등 일정을 기록해요."
          trigger={
            <button type="button" className={actionClass}>
              <span className={iconClass}>
                <CalendarPlus className="size-5" />
              </span>
              일정 추가
            </button>
          }
        />
      </div>

      <div className="grid grid-cols-3 divide-x rounded-xl border bg-card">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="px-3 py-3 text-center">
            <p className="text-xl font-bold tabular-nums">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </Link>
        ))}
      </div>

      <section id="schedule" className="scroll-mt-16 space-y-2">
        <h2 className="font-semibold">일정</h2>
        <div className="rounded-xl border bg-card p-3">
          <ScheduleCalendar
            month={month}
            prevMonth={grid.prevMonth}
            nextMonth={grid.nextMonth}
            days={days}
            today={today}
            events={events}
            {...options}
          />
        </div>
      </section>

      <section className="space-y-2">
        <SectionTitle title="최근 매물" href="/properties" />
        <div className="divide-y rounded-xl border bg-card">
          {recentProperties.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">등록된 매물이 없어요.</p>}
          {recentProperties.map((p) => (
            <Link key={p.id} href={`/properties/${p.id}`} className="flex items-center gap-3 p-3">
              <PropertyThumbnail type={p.property_type} src={p.thumbUrl} alt={p.title} className="size-14 shrink-0 rounded-lg" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{p.title}</p>
                <p className="text-xs text-muted-foreground">
                  {p.property_type} · {p.deal_type}
                </p>
                <p className="text-sm font-semibold text-primary">{formatPrice(p)}</p>
              </div>
              <PropertyStatusBadge status={p.status} />
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <SectionTitle title="최근 고객" href="/customers" />
        <div className="divide-y rounded-xl border bg-card">
          {(recentCustomers.data ?? []).length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">등록된 고객이 없어요.</p>}
          {recentCustomers.data?.map((c) => (
            <Link key={c.id} href={`/customers/${c.id}`} className="flex items-center gap-3 p-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                {c.name.slice(0, 1)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{c.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {[c.deal_type, c.regions].filter(Boolean).join(" · ") || "조건 미입력"} · {formatDate(c.updated_at)}
                </p>
              </div>
              <CustomerStatusBadge status={c.status} />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function SectionTitle({ title, href }: { title: string; href: string }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="font-semibold">{title}</h2>
      <Link href={href} className="flex items-center text-xs text-muted-foreground">
        전체 <ChevronRight className="size-3.5" />
      </Link>
    </div>
  );
}
