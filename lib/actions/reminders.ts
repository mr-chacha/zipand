"use server";

import { getUpcomingReminders } from "@/lib/reminders";
import type { Reminder } from "@/lib/reminder-types";

/** 클라이언트 스케줄러용. 로그인 세션 기준 다가오는 알림 목록 */
export async function fetchUpcomingReminders(): Promise<Reminder[]> {
  return getUpcomingReminders(30);
}
