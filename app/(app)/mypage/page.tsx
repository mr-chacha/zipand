import type { Metadata } from "next";
import Link from "next/link";
import {
  Bell,
  Building2,
  ChevronRight,
  FileText,
  KeyRound,
  LifeBuoy,
  ListChecks,
  MessageSquareText,
  Pencil,
  ShieldCheck,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { CustomerStatusBadge, PropertyStatusBadge } from "@/components/status-badge";
import { TaskBoard } from "@/components/tasks/task-board";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSession } from "@/lib/auth";
import { ROLE_LABELS, VERIFICATION_LABELS } from "@/lib/constants";
import { formatDate, formatDateTime, formatPrice, kstDayStart, todayKst } from "@/lib/format";
import { getOfficeMembers, getPropertyOptions, getTasks, todayRange } from "@/lib/queries";
import { cn } from "@/lib/utils";
import { LogoutButton } from "./logout-button";

export const metadata: Metadata = { title: "마이페이지" };

export default async function MyPage() {
  const { supabase, profile, office } = await getSession();
  const { todayStart, tomorrowStart } = todayRange();
  const monthStart = kstDayStart(`${todayKst().slice(0, 7)}-01`);

  const [tasks, members, propertyOptions, myProperties, myCustomers, consultCount, activity] = await Promise.all([
    getTasks({ assigneeId: profile.id }),
    getOfficeMembers(),
    getPropertyOptions(),
    supabase
      .from("properties")
      .select("id, title, deal_type, price, monthly_rent, status, updated_at", { count: "exact" })
      .eq("manager_id", profile.id)
      .order("updated_at", { ascending: false })
      .limit(5),
    supabase
      .from("customers")
      .select("id, name, status, deal_type, updated_at", { count: "exact" })
      .eq("manager_id", profile.id)
      .order("updated_at", { ascending: false })
      .limit(5),
    supabase
      .from("consultations")
      .select("id", { count: "exact", head: true })
      .eq("created_by", profile.id)
      .gte("consulted_at", monthStart),
    supabase
      .from("property_events")
      .select("id, message, created_at, property:properties(id, title)")
      .eq("actor_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const openTasks = tasks.filter((t) => !t.done).length;
  const stats = [
    { label: "담당 매물", value: myProperties.count ?? 0, icon: Building2, href: "/properties" },
    { label: "담당 고객", value: myCustomers.count ?? 0, icon: Users, href: "/customers" },
    { label: "남은 할 일", value: openTasks, icon: ListChecks, href: "#tasks" },
    { label: "이번 달 상담", value: consultCount.count ?? 0, icon: MessageSquareText, href: "/customers" },
  ];

  const menu = [
    { label: "내 정보 수정", href: "/settings?tab=account", icon: Pencil },
    { label: "비밀번호 변경", href: "/settings?tab=account", icon: KeyRound },
    { label: profile.role === "owner" ? "사무소 정보 수정" : "사무소 정보", href: "/settings?tab=office", icon: Building2 },
    {
      label: profile.role === "owner" ? "구성원 관리 (소속중개사·중개보조원 초대)" : "구성원 보기",
      href: "/settings?tab=members",
      icon: Users,
    },
    { label: "알림", href: "/notifications", icon: Bell },
    { label: "고객센터", href: "/help", icon: LifeBuoy },
    { label: "이용약관", href: "/terms", icon: FileText },
    { label: "개인정보 처리방침", href: "/privacy", icon: ShieldCheck },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="마이페이지" description="내 정보와 담당 업무를 한눈에 확인해요." />

      <Card>
        <CardContent className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <Avatar className="size-16">
            <AvatarFallback className="bg-primary/10 text-xl font-semibold text-primary">
              {profile.name.slice(0, 1)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-lg font-bold">{profile.name}</p>
              <Badge variant="secondary">{ROLE_LABELS[profile.role]}</Badge>
              <Badge
                variant="outline"
                className={cn(profile.verification_status === "verified" ? "text-success" : "text-muted-foreground")}
              >
                <ShieldCheck data-icon="inline-start" />
                자격 {VERIFICATION_LABELS[profile.verification_status]}
              </Badge>
            </div>
            <p className="truncate text-sm text-muted-foreground">
              {profile.email}
              {profile.phone && ` · ${profile.phone}`}
            </p>
            <p className="text-sm text-muted-foreground">
              {office.name} · {formatDate(profile.created_at)} 가입
            </p>
          </div>
          <Link href="/settings?tab=account" className={buttonVariants({ variant: "outline" })}>
            <Pencil data-icon="inline-start" />
            정보 수정
          </Link>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="flex items-center gap-3 rounded-xl border bg-card p-4 hover:border-primary/40">
            <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <s.icon className="size-5" />
            </span>
            <div>
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-xl font-bold tabular-nums">{s.value}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card id="tasks" className="scroll-mt-20">
            <CardHeader>
              <CardTitle>내 할 일</CardTitle>
              <CardDescription>나에게 배정된 일정만 보여요</CardDescription>
            </CardHeader>
            <CardContent>
              <TaskBoard
                tasks={tasks}
                todayStart={todayStart}
                tomorrowStart={tomorrowStart}
                members={members.map((m) => ({ value: m.id, label: m.name }))}
                properties={propertyOptions.map((p) => ({ value: p.id, label: p.title }))}
                emptyText="배정된 할 일이 없어요."
              />
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>담당 매물</CardTitle>
                <CardAction>
                  <Link href="/properties" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                    전체
                  </Link>
                </CardAction>
              </CardHeader>
              <CardContent className="space-y-1">
                {(myProperties.data ?? []).length === 0 && (
                  <p className="py-4 text-center text-sm text-muted-foreground">담당 매물이 없어요.</p>
                )}
                {myProperties.data?.map((p) => (
                  <Link key={p.id} href={`/properties/${p.id}`} className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-muted/50">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{p.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.deal_type} {formatPrice(p)}
                      </p>
                    </div>
                    <PropertyStatusBadge status={p.status} />
                  </Link>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>담당 고객</CardTitle>
                <CardAction>
                  <Link href="/customers" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                    전체
                  </Link>
                </CardAction>
              </CardHeader>
              <CardContent className="space-y-1">
                {(myCustomers.data ?? []).length === 0 && (
                  <p className="py-4 text-center text-sm text-muted-foreground">담당 고객이 없어요.</p>
                )}
                {myCustomers.data?.map((c) => (
                  <Link key={c.id} href={`/customers/${c.id}`} className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-muted/50">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{c.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {c.deal_type ?? "거래 유형 미정"} · {formatDate(c.updated_at)}
                      </p>
                    </div>
                    <CustomerStatusBadge status={c.status} />
                  </Link>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>최근 활동</CardTitle>
              <CardDescription>내가 남긴 매물 변경 이력</CardDescription>
            </CardHeader>
            <CardContent>
              {(activity.data ?? []).length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">활동 기록이 없어요.</p>
              ) : (
                <ol className="relative space-y-3 border-l pl-4">
                  {activity.data?.map((a) => (
                    <li key={a.id} className="relative">
                      <span className="absolute top-1.5 -left-[21px] size-2.5 rounded-full border-2 border-background bg-primary/60" />
                      <p className="text-sm">{a.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {a.property && (
                          <Link href={`/properties/${a.property.id}`} className="hover:underline">
                            {a.property.title}
                          </Link>
                        )}{" "}
                        · {formatDateTime(a.created_at)}
                      </p>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>설정 및 지원</CardTitle>
            </CardHeader>
            <CardContent className="-mx-2 space-y-0.5">
              {menu.map((m) => (
                <Link
                  key={m.label}
                  href={m.href}
                  className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm hover:bg-muted/50"
                >
                  <m.icon className="size-4 text-muted-foreground" />
                  <span className="flex-1">{m.label}</span>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </Link>
              ))}
              <div className="mt-2 border-t px-2 pt-3">
                <LogoutButton />
                <p className="mt-3 text-xs text-muted-foreground">
                  회원 탈퇴는 서비스 준비중이에요. 탈퇴가 필요하면 고객센터로 문의해 주세요.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
