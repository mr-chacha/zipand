const DIGITS = ["", "일", "이", "삼", "사", "오", "육", "칠", "팔", "구"];
const SMALL_UNITS = ["", "십", "백", "천"];
const BIG_UNITS = ["", "만", "억", "조", "경"];

export function formatNumberInput(value: string) {
  const d = value.replace(/\D/g, "").replace(/^0+(?=\d)/, "").slice(0, 15);
  return d.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/** 소수 입력: 숫자와 소수점 하나만, 소수 둘째 자리까지 */
export function formatDecimalInput(value: string) {
  const [int = "", ...rest] = value.replace(/[^\d.]/g, "").split(".");
  const intPart = int.replace(/^0+(?=\d)/, "").slice(0, 7);
  return rest.length ? `${intPart || "0"}.${rest.join("").slice(0, 2)}` : intPart;
}

/** ㎡ → "25.68평" */
export function m2ToPyeongText(value: string) {
  const m2 = Number(value);
  if (!Number.isFinite(m2) || m2 <= 0) return "";
  return `${(m2 / 3.3058).toFixed(2)}평`;
}

function groupToHangul(n: number) {
  let out = "";
  String(n)
    .split("")
    .reverse()
    .forEach((ch, i) => {
      const digit = Number(ch);
      if (!digit) return;
      out = `${digit === 1 && i > 0 ? "" : DIGITS[digit]}${SMALL_UNITS[i]}${out}`;
    });
  return out;
}

/** 만원 단위 금액을 한글로 읽는다. 10000 → "일억원", 52500 → "오억이천오백만원" */
export function manwonToHangul(manwon: number) {
  if (!Number.isFinite(manwon) || manwon <= 0) return "";
  let rest = Math.floor(manwon);
  let out = "";
  for (let i = 1; rest > 0 && i < BIG_UNITS.length; i++) {
    const group = rest % 10000;
    if (group) out = `${groupToHangul(group)}${BIG_UNITS[i]}${out}`;
    rest = Math.floor(rest / 10000);
  }
  return `${out}원`;
}

/** 원 단위 금액을 한글로 읽는다. 100000000 → "일억원", 15000 → "일만오천원" */
export function wonToHangul(won: number) {
  if (!Number.isFinite(won) || won <= 0) return "";
  let rest = Math.floor(won);
  let out = "";
  for (let i = 0; rest > 0 && i < BIG_UNITS.length; i++) {
    const group = rest % 10000;
    if (group) out = `${groupToHangul(group)}${BIG_UNITS[i]}${out}`;
    rest = Math.floor(rest / 10000);
  }
  return `${out}원`;
}
