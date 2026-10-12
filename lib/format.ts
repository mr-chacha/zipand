import type { Property } from "@/types";

/** 만원 단위 금액을 "3억 5,000" 형태로 표기 */
export function formatManwon(value: number) {
  const eok = Math.floor(value / 10000);
  const rest = value % 10000;
  if (eok === 0) return `${rest.toLocaleString("ko-KR")}만`;
  if (rest === 0) return `${eok}억`;
  return `${eok}억 ${rest.toLocaleString("ko-KR")}`;
}

export function formatPrice(property: Pick<Property, "dealType" | "price" | "monthlyRent">) {
  if (property.dealType === "월세") {
    return `${formatManwon(property.price)} / ${property.monthlyRent ?? 0}`;
  }
  return formatManwon(property.price);
}

export function toPyeong(areaM2: number) {
  return (areaM2 / 3.3058).toFixed(1);
}

export function formatDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
