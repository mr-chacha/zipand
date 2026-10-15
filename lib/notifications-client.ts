import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import type { Reminder } from "@/lib/reminder-types";
import { REMINDER_LEAD_MINUTES } from "@/lib/reminder-types";

const CHANNEL_ID = "schedule-reminders";
const KEYS_STORAGE = "zipand:scheduled-reminder-keys";
const WEB_FIRED_STORAGE = "zipand:web-fired-reminders";

/** Capacitor LocalNotifications id는 32-bit 정수여야 한다 */
export function reminderNotificationId(key: string) {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) % 2147483646 || 1;
}

function loadKeys(): string[] {
  try {
    const raw = localStorage.getItem(KEYS_STORAGE);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function saveKeys(keys: string[]) {
  localStorage.setItem(KEYS_STORAGE, JSON.stringify(keys));
}

function loadFired(): Set<string> {
  try {
    const raw = localStorage.getItem(WEB_FIRED_STORAGE);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function markFired(key: string) {
  const set = loadFired();
  set.add(key);
  // 최근 200개만 유지
  const list = [...set].slice(-200);
  localStorage.setItem(WEB_FIRED_STORAGE, JSON.stringify(list));
}

export type NotificationPermissionState = "granted" | "denied" | "prompt" | "unsupported";

export function isNativeApp() {
  return Capacitor.isNativePlatform() || /ZipandApp/.test(navigator.userAgent);
}

export async function getNotificationPermission(): Promise<NotificationPermissionState> {
  if (isNativeApp()) {
    try {
      const { display } = await LocalNotifications.checkPermissions();
      if (display === "granted") return "granted";
      if (display === "denied") return "denied";
      return "prompt";
    } catch {
      return "unsupported";
    }
  }
  if (typeof Notification === "undefined") return "unsupported";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  return "prompt";
}

export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  if (isNativeApp()) {
    try {
      await ensureChannel();
      const { display } = await LocalNotifications.requestPermissions();
      if (display === "granted") return "granted";
      if (display === "denied") return "denied";
      return "prompt";
    } catch {
      return "unsupported";
    }
  }
  if (typeof Notification === "undefined") return "unsupported";
  const result = await Notification.requestPermission();
  if (result === "granted") return "granted";
  if (result === "denied") return "denied";
  return "prompt";
}

async function ensureChannel() {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await LocalNotifications.createChannel({
      id: CHANNEL_ID,
      name: "일정 알림",
      description: "등록된 일정 10분 전 알림",
      importance: 5,
      visibility: 1,
      vibration: true,
    });
  } catch {
    // 채널이 이미 있으면 무시
  }
}

function bodyFor(r: Reminder) {
  const when = new Date(r.eventAt).toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const bits = [`${REMINDER_LEAD_MINUTES}분 후 · ${when}`, r.detail].filter(Boolean);
  return bits.join(" · ");
}

/** 앱: OS 로컬 알림으로 스케줄. 웹: 열린 동안 setTimeout으로 알림 */
export async function syncReminderSchedules(
  reminders: Reminder[],
  webTimers: Map<string, number>
): Promise<{ scheduled: number; permission: NotificationPermissionState }> {
  const now = Date.now();
  const upcoming = reminders.filter((r) => new Date(r.notifyAt).getTime() > now);
  let permission = await getNotificationPermission();
  if (permission === "prompt") {
    permission = await requestNotificationPermission();
  }
  if (permission !== "granted") {
    return { scheduled: 0, permission };
  }

  if (isNativeApp() && Capacitor.isNativePlatform()) {
    await ensureChannel();
    const prev = loadKeys();
    const prevIds = prev.map(reminderNotificationId);
    if (prevIds.length) {
      await LocalNotifications.cancel({ notifications: prevIds.map((id) => ({ id })) });
    }
    const nextKeys = upcoming.map((r) => r.key);
    if (upcoming.length) {
      await LocalNotifications.schedule({
        notifications: upcoming.map((r) => ({
          id: reminderNotificationId(r.key),
          title: `[${r.label}] ${r.title}`,
          body: bodyFor(r),
          schedule: { at: new Date(r.notifyAt), allowWhileIdle: true },
          channelId: CHANNEL_ID,
          extra: { href: r.href, key: r.key },
        })),
      });
    }
    saveKeys(nextKeys);
    return { scheduled: upcoming.length, permission };
  }

  // 웹: 기존 타이머 정리 후 재등록 (탭이 열려 있을 때만 동작)
  for (const id of webTimers.values()) window.clearTimeout(id);
  webTimers.clear();
  const fired = loadFired();
  let count = 0;
  for (const r of upcoming) {
    if (fired.has(r.key)) continue;
    const delay = new Date(r.notifyAt).getTime() - Date.now();
    if (delay <= 0 || delay > 2_147_483_647) continue;
    const timer = window.setTimeout(() => {
      webTimers.delete(r.key);
      if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
      if (loadFired().has(r.key)) return;
      try {
        const n = new Notification(`[${r.label}] ${r.title}`, {
          body: bodyFor(r),
          tag: r.key,
          data: { href: r.href },
        });
        n.onclick = () => {
          window.focus();
          if (r.href) window.location.href = r.href;
          n.close();
        };
        markFired(r.key);
      } catch {
        // 브라우저가 Notification 생성을 막은 경우
      }
    }, delay);
    webTimers.set(r.key, timer);
    count += 1;
  }
  return { scheduled: count, permission };
}
