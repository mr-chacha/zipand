/** 회원가입·비밀번호 변경 공통 규칙. 클라이언트 안내와 서버 검증에 함께 쓴다. */
export const PASSWORD_RULES = [
  { label: "8자 이상", test: (pw: string) => pw.length >= 8 },
  { label: "영문 포함", test: (pw: string) => /[A-Za-z]/.test(pw) },
  { label: "숫자 포함", test: (pw: string) => /\d/.test(pw) },
] as const;

/** 규칙을 만족하지 않으면 오류 메시지, 만족하면 null */
export function validatePassword(password: string, confirm: string | null): string | null {
  if (!PASSWORD_RULES.every((rule) => rule.test(password))) {
    return "비밀번호는 영문과 숫자를 포함해 8자 이상이어야 해요.";
  }
  if (password !== confirm) return "비밀번호 확인이 일치하지 않아요.";
  return null;
}
