/** 파일명에 있는 한국 전화번호만 추출 (음성·메타데이터는 보지 않음) */

const PHONE_RE =
  /(?<!\d)(01[016789]\d{7,8}|0\d{1,2}\d{7,8}|01[016789][-\s.]?\d{3,4}[-\s.]?\d{4}|0\d{1,2}[-\s.]?\d{3,4}[-\s.]?\d{4})(?!\d)/;

export function phoneFromFilename(fileName: string): string | null {
  const base = fileName.split(/[/\\]/).pop() ?? fileName;
  const m = base.match(PHONE_RE);
  if (!m) return null;
  const digits = m[1].replace(/\D/g, "");
  if (digits.length < 9 || digits.length > 11) return null;
  return formatKrPhone(digits);
}

export function formatKrPhone(digits: string) {
  if (digits.startsWith("02") && digits.length >= 9) {
    return `02-${digits.slice(2, digits.length - 4)}-${digits.slice(-4)}`;
  }
  if (digits.length === 11) return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  if (digits.length === 10) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  return digits;
}
