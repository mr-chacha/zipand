/** 사용자에게 그대로 보여줄 수 있는 검증 오류 */
export class FormError extends Error {}

export const DEFAULT_ERROR_MESSAGE = "요청을 처리하지 못했어요. 잠시 후 다시 시도해 주세요.";

/** Supabase Auth 오류 코드 → 안내 문구 (https://supabase.com/docs/guides/auth/debugging/error-codes) */
const AUTH_ERRORS: Record<string, string> = {
  invalid_credentials: "이메일 또는 비밀번호가 올바르지 않아요.",
  email_not_confirmed: "이메일 인증이 완료되지 않았어요. 받은 메일의 인증 링크를 눌러주세요.",
  user_already_exists: "이미 가입된 이메일이에요.",
  email_exists: "이미 가입된 이메일이에요.",
  email_address_invalid: "사용할 수 없는 이메일 주소예요. 실제로 메일을 받을 수 있는 주소를 입력해 주세요.",
  email_address_not_authorized: "이 이메일 주소로는 메일을 보낼 수 없어요. 다른 주소를 입력해 주세요.",
  over_email_send_rate_limit: "인증 메일 발송 한도를 넘었어요. 잠시 후 다시 시도해 주세요.",
  over_request_rate_limit: "요청이 너무 많아요. 잠시 후 다시 시도해 주세요.",
  over_sms_send_rate_limit: "문자 발송 한도를 넘었어요. 잠시 후 다시 시도해 주세요.",
  weak_password: "더 안전한 비밀번호를 입력해 주세요. 영문과 숫자를 포함해 8자 이상이어야 해요.",
  same_password: "현재 비밀번호와 다른 비밀번호를 입력해 주세요.",
  signup_disabled: "현재 회원가입을 받지 않고 있어요.",
  email_provider_disabled: "이메일 가입이 비활성화되어 있어요.",
  provider_disabled: "지원하지 않는 로그인 방식이에요.",
  user_banned: "이용이 제한된 계정이에요. 관리자에게 문의해 주세요.",
  user_not_found: "계정을 찾을 수 없어요.",
  session_expired: "로그인이 만료됐어요. 다시 로그인해 주세요.",
  session_not_found: "로그인이 만료됐어요. 다시 로그인해 주세요.",
  refresh_token_not_found: "로그인이 만료됐어요. 다시 로그인해 주세요.",
  refresh_token_already_used: "로그인이 만료됐어요. 다시 로그인해 주세요.",
  bad_jwt: "로그인이 만료됐어요. 다시 로그인해 주세요.",
  no_authorization: "로그인이 필요해요.",
  reauthentication_needed: "보안을 위해 다시 로그인해 주세요.",
  otp_expired: "인증 링크가 만료됐어요. 다시 요청해 주세요.",
  flow_state_expired: "인증 시간이 지났어요. 처음부터 다시 시도해 주세요.",
  captcha_failed: "보안 확인에 실패했어요. 다시 시도해 주세요.",
  validation_failed: "입력값 형식이 올바르지 않아요.",
  request_timeout: "응답이 지연되고 있어요. 잠시 후 다시 시도해 주세요.",
};

/** Postgres / PostgREST 오류 코드 → 안내 문구 */
const DB_ERRORS: Record<string, string> = {
  "23505": "이미 등록된 정보예요.",
  "23503": "연결된 데이터가 있거나 대상이 없어 처리할 수 없어요.",
  "23502": "필수 항목이 비어 있어요.",
  "23514": "입력값이 허용 범위를 벗어났어요.",
  "22001": "입력값이 너무 길어요.",
  "22003": "숫자가 허용 범위를 벗어났어요.",
  "22007": "날짜 형식이 올바르지 않아요.",
  "22008": "날짜 형식이 올바르지 않아요.",
  "22P02": "입력 형식이 올바르지 않아요.",
  "42501": "권한이 없어요.",
  PGRST116: "요청한 정보를 찾을 수 없어요.",
  PGRST301: "로그인이 만료됐어요. 다시 로그인해 주세요.",
};

const HANGUL = /[가-힣]/;

function pick(error: object, key: string) {
  const value = (error as Record<string, unknown>)[key];
  return value === undefined || value === null ? undefined : String(value);
}

function storageMessage(message: string, status: string | undefined) {
  const lower = message.toLowerCase();
  if (lower.includes("mime type")) return "지원하지 않는 파일 형식이에요.";
  if (status === "413" || lower.includes("maximum allowed size") || lower.includes("payload too large")) {
    return "파일 크기가 너무 커요.";
  }
  if (lower.includes("already exists")) return "같은 이름의 파일이 이미 있어요.";
  if (lower.includes("object not found") || lower.includes("bucket not found")) return "파일을 찾을 수 없어요.";
  return null;
}

/**
 * 모든 오류를 한국어 안내 문구로 바꾼다. 영어 원문은 사용자에게 노출하지 않는다.
 * Supabase(Auth·DB·Storage), 네트워크, 직접 던진 FormError를 처리한다.
 */
export function toErrorMessage(error: unknown): string {
  if (error instanceof FormError) return error.message;
  if (!error || typeof error !== "object") return DEFAULT_ERROR_MESSAGE;

  const message = pick(error, "message") ?? "";
  const code = pick(error, "code");
  const name = pick(error, "name") ?? "";
  const status = pick(error, "statusCode") ?? pick(error, "status");

  if (name.startsWith("Auth") && code && AUTH_ERRORS[code]) return AUTH_ERRORS[code];
  if (code && DB_ERRORS[code]) return DB_ERRORS[code];

  // DB 함수의 raise exception(P0001)은 한국어로 작성해 그대로 노출한다
  if (code === "P0001" && HANGUL.test(message)) return message;

  const lower = message.toLowerCase();
  if (lower.includes("row-level security") || lower.includes("permission denied")) return "권한이 없어요.";
  if (lower.includes("jwt expired") || lower.includes("invalid jwt")) return "로그인이 만료됐어요. 다시 로그인해 주세요.";
  if (lower.includes("failed to fetch") || lower.includes("fetch failed") || lower.includes("network")) {
    return "네트워크 연결을 확인하고 다시 시도해 주세요.";
  }
  if (lower.includes("timeout") || lower.includes("timed out")) return "응답이 지연되고 있어요. 잠시 후 다시 시도해 주세요.";

  const storage = storageMessage(message, status);
  if (storage) return storage;

  if (HANGUL.test(message)) return message;

  console.error("[unmapped error]", { name, code, status, message });
  return DEFAULT_ERROR_MESSAGE;
}
