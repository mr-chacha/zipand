const TIME_ZONE = "Asia/Seoul";

/** 만원 단위 금액을 "3억 5,000" 형태로 표기 */
export function formatManwon(value: number | null | undefined) {
  if (value === null || value === undefined) return "-";
  const eok = Math.floor(value / 10000);
  const rest = value % 10000;
  if (eok === 0) return `${rest.toLocaleString("ko-KR")}만`;
  if (rest === 0) return `${eok}억`;
  return `${eok}억 ${rest.toLocaleString("ko-KR")}`;
}

export function formatPrice(p: { deal_type: string; price: number; monthly_rent?: number | null }) {
  if (p.deal_type === "월세") return `${formatManwon(p.price)} / ${p.monthly_rent ?? 0}`;
  return formatManwon(p.price);
}

export function formatBudget(min: number | null, max: number | null) {
  if (min === null && max === null) return "-";
  if (min !== null && max !== null) return `${formatManwon(min)} ~ ${formatManwon(max)}`;
  return min !== null ? `${formatManwon(min)} 이상` : `${formatManwon(max)} 이하`;
}

export function toPyeong(areaM2: number | null | undefined) {
  if (!areaM2) return "-";
  return (Number(areaM2) / 3.3058).toFixed(1);
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(new Date(value))
    .replace(/\.\s?/g, "-")
    .replace(/-$/, "");
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: TIME_ZONE,
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

export function formatTime(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

export function formatFileSize(bytes: number | null | undefined) {
  if (!bytes) return "-";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))}KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

export function isPast(value: string) {
  return new Date(value).getTime() < Date.now();
}

/** 한국 시간 기준 YYYY-MM-DD */
export function todayKst(offsetDays = 0) {
  const d = new Date(Date.now() + offsetDays * 86400000);
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(d);
}

/** 한국 시간 날짜(YYYY-MM-DD)의 시작 시각 ISO 문자열 */
export function kstDayStart(date: string) {
  return new Date(`${date}T00:00:00+09:00`).toISOString();
}

/** ISO 문자열을 datetime-local 입력값(한국 시간)으로 변환 */
export function isoToKstLocal(value: string | null | undefined) {
  const d = value ? new Date(value) : new Date();
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour") === "24" ? "00" : get("hour")}:${get("minute")}`;
}
