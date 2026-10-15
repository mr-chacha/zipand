import type { Metadata } from "next";
import Link from "next/link";
import { Bell } from "lucide-react";
import { NotificationPermissionCard } from "@/components/notifications/notification-scheduler";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/format";
import { getUpcomingReminders, REMINDER_LEAD_MINUTES } from "@/lib/reminders";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "알림" };

const KIND_CHIP: Record<string, string> = {
  task: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  contract: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
  balance: "bg-rose-500/10 text-rose-700 dark:text-rose-300",
};

export default async function NotificationsPage() {
  const reminders = await getUpcomingReminders(30);

  return (
    <div className="space-y-6">
      <PageHeader
        title="알림"
        description={`등록된 일정 ${REMINDER_LEAD_MINUTES}분 전에 알림이 와요. 계약일·잔금일은 당일 오전 9시 기준이에요.`}
      />

      <NotificationPermissionCard />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="size-4" />
            다가오는 일정
          </CardTitle>
          <CardDescription>앞으로 30일 · 알림 시각은 일정 {REMINDER_LEAD_MINUTES}분 전</CardDescription>
        </CardHeader>
        <CardContent>
          {reminders.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              알림 대상 일정이 없어요. 대시보드에서 일정을 추가하거나 계약관리에 계약일·잔금일을 입력해 주세요.
            </p>
          ) : (
            <ul className="space-y-2">
              {reminders.map((r) => {
                const content = (
                  <>
                    <Badge variant="outline" className={cn("text-[10px]", KIND_CHIP[r.kind])}>
                      {r.label}
                    </Badge>
                    <p className="font-medium">{r.title}</p>
                    {r.detail && <p className="text-xs text-muted-foreground">{r.detail}</p>}
                    <p className="text-xs text-muted-foreground">
                      일정 {formatDateTime(r.eventAt)} · 알림 {formatDateTime(r.notifyAt)}
                    </p>
                  </>
                );
                return (
                  <li key={r.key}>
                    {r.href ? (
                      <Link
                        href={r.href}
                        className="block space-y-1 rounded-lg border bg-card p-3 transition-colors hover:bg-muted/50"
                      >
                        {content}
                      </Link>
                    ) : (
                      <div className="space-y-1 rounded-lg border bg-card p-3">{content}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
