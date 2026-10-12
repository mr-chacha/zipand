export function str(fd: FormData, key: string) {
  const v = fd.get(key);
  if (typeof v !== "string") return null;
  const trimmed = v.trim();
  return trimmed === "" ? null : trimmed;
}

export function requiredStr(fd: FormData, key: string, label: string) {
  const v = str(fd, key);
  if (!v) throw new FormError(`${label}을(를) 입력해 주세요.`);
  return v;
}

export function int(fd: FormData, key: string) {
  const v = str(fd, key);
  if (v === null) return null;
  const n = Number(v.replace(/,/g, ""));
  if (!Number.isFinite(n)) throw new FormError("숫자 형식이 올바르지 않습니다.");
  return Math.round(n);
}

export function num(fd: FormData, key: string) {
  const v = str(fd, key);
  if (v === null) return null;
  const n = Number(v.replace(/,/g, ""));
  if (!Number.isFinite(n)) throw new FormError("숫자 형식이 올바르지 않습니다.");
  return n;
}

export function oneOf<T extends readonly string[]>(fd: FormData, key: string, options: T, label: string): T[number] {
  const v = str(fd, key);
  if (!v || !options.includes(v)) throw new FormError(`${label}을(를) 선택해 주세요.`);
  return v as T[number];
}

/** datetime-local 입력값(한국 시간)을 ISO 문자열로 변환 */
export function kstLocalToIsoSafe(value: string) {
  const d = new Date(`${value.length === 16 ? `${value}:00` : value}+09:00`);
  if (Number.isNaN(d.getTime())) throw new FormError("날짜·시간 형식이 올바르지 않습니다.");
  return d.toISOString();
}

export function lines(value: string | null) {
  return (value ?? "")
    .split(/\n|,/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** 사용자에게 그대로 보여줄 수 있는 검증 오류 */
export class FormError extends Error {}

export function toErrorMessage(error: unknown) {
  if (error instanceof FormError) return error.message;
  if (error && typeof error === "object" && "message" in error) {
    const message = String((error as { message: unknown }).message);
    if (message.includes("row-level security")) return "권한이 없습니다.";
    return message;
  }
  return "요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.";
}
