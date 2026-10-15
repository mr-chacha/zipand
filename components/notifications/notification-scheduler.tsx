"use client";

import { useEffect, useRef, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { fetchUpcomingReminders } from "@/lib/actions/reminders";
import {
  getNotificationPermission,
  requestNotificationPermission,
  syncReminderSchedules,
  type NotificationPermissionState,
} from "@/lib/notifications-client";
import { REMINDER_LEAD_MINUTES, REMINDERS_CHANGED_EVENT } from "@/lib/reminder-types";

/** 로그인 앱 영역에 마운트. 일정 변경·포커스 시 10분 전 알림을 다시 맞춘다 */
export function NotificationScheduler() {
  const router = useRouter();
  const timers = useRef(new Map<string, number>());

  useEffect(() => {
    let cancelled = false;

    const sync = async () => {
      try {
        const list = await fetchUpcomingReminders();
        if (cancelled) return;
        await syncReminderSchedules(list, timers.current);
      } catch {
        // 비로그인·네트워크 오류는 무시 (다음 포커스에서 재시도)
      }
    };

    void sync();

    const onChange = () => void sync();
    const onVisibility = () => {
      if (document.visibilityState === "visible") void sync();
    };
    window.addEventListener(REMINDERS_CHANGED_EVENT, onChange);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onChange);

    let removeAction: (() => void) | undefined;
    if (Capacitor.isNativePlatform()) {
      void LocalNotifications.addListener("localNotificationActionPerformed", (event) => {
        const href = event.notification.extra?.href;
        if (typeof href === "string" && href) router.push(href);
      }).then((handle) => {
        removeAction = () => void handle.remove();
      });
    }

    const interval = window.setInterval(() => void sync(), 5 * 60_000);

    const activeTimers = timers.current;
    return () => {
      cancelled = true;
      window.removeEventListener(REMINDERS_CHANGED_EVENT, onChange);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onChange);
      window.clearInterval(interval);
      removeAction?.();
      for (const id of activeTimers.values()) window.clearTimeout(id);
      activeTimers.clear();
    };
  }, [router]);

  return null;
}

/** 알림 페이지용: 권한 상태 표시·요청 */
export function NotificationPermissionCard() {
  const [permission, setPermission] = useState<NotificationPermissionState | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void getNotificationPermission().then(setPermission);
  }, []);

  const request = async () => {
    setBusy(true);
    try {
      const next = await requestNotificationPermission();
      setPermission(next);
      window.dispatchEvent(new Event(REMINDERS_CHANGED_EVENT));
    } finally {
      setBusy(false);
    }
  };

  if (permission === null) return null;

  if (permission === "granted") {
    return (
      <p className="rounded-lg border bg-card px-3 py-2 text-sm text-muted-foreground">
        일정 알림이 켜져 있어요. 등록된 일정 {REMINDER_LEAD_MINUTES}분 전에 알림이 뜹니다. 계약일·잔금일은
        당일 오전 9시 기준이에요.
      </p>
    );
  }

  if (permission === "unsupported") {
    return (
      <p className="rounded-lg border bg-card px-3 py-2 text-sm text-muted-foreground">
        이 환경에서는 시스템 알림을 지원하지 않아요. 아래 목록에서 일정을 확인할 수 있어요.
      </p>
    );
  }

  if (permission === "denied") {
    return (
      <p className="rounded-lg border border-destructive/30 bg-card px-3 py-2 text-sm text-muted-foreground">
        알림이 차단되어 있어요. 기기·브라우저 설정에서 집앤 알림을 허용해 주세요.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border bg-card px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        일정 {REMINDER_LEAD_MINUTES}분 전에 알림을 받으려면 권한을 허용해 주세요.
      </p>
      <Button type="button" disabled={busy} onClick={() => void request()} className="app:w-full">
        알림 허용
      </Button>
    </div>
  );
}
