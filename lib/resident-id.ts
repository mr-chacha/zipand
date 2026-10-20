/** 주민등록번호 형식·체크섬 검증 (진위확인 API와 별개) */

export function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

/** 주민등록번호 13자리 체크섬. 유효하면 true */
export function isValidResidentId(rrn: string) {
  const d = digitsOnly(rrn);
  if (!/^\d{13}$/.test(d)) return false;
  const weights = [2, 3, 4, 5, 6, 7, 8, 9, 2, 3, 4, 5];
  const sum = weights.reduce((acc, w, i) => acc + Number(d[i]) * w, 0);
  const check = (11 - (sum % 11)) % 10;
  return check === Number(d[12]);
}

export function formatResidentIdDisplay(front: string, back: string) {
  const f = digitsOnly(front).slice(0, 6);
  const b = digitsOnly(back).slice(0, 7);
  if (!f && !b) return "";
  return b ? `${f}-${b}` : f;
}
