/** 일정 시각 몇 분 전에 알림을 띄울지 */
export const REMINDER_LEAD_MINUTES = 10;
/** 계약일·잔금일 기준 시각 (한국 시간) */
export const DATE_ONLY_EVENT_HOUR = 9;

export type ReminderKind = "task" | "contract" | "balance";

export type Reminder = {
  key: string;
  kind: ReminderKind;
  title: string;
  label: string;
  detail: string | null;
  href: string | null;
  /** 일정 시각 (ISO) */
  eventAt: string;
  /** 알림 시각 = eventAt − REMINDER_LEAD_MINUTES (ISO) */
  notifyAt: string;
};

/** 일정 변경 후 클라이언트 스케줄러가 다시 맞추도록 보내는 이벤트 */
export const REMINDERS_CHANGED_EVENT = "zipand:reminders-changed";

export function notifyRemindersChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(REMINDERS_CHANGED_EVENT));
  }
}
