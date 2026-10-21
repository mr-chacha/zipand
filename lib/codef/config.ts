/**
 * CODEF 자격증명·엔드포인트 (서버 전용).
 * 클라이언트에 노출하지 말 것 — NEXT_PUBLIC_ 금지.
 */

function req(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`${name} 환경변수가 없습니다.`);
  return v;
}

export function getCodefConfig() {
  const sandbox = (process.env.CODEF_USE_SANDBOX ?? "true").toLowerCase() !== "false";
  return {
    clientId: req("CODEF_CLIENT_ID"),
    clientSecret: req("CODEF_CLIENT_SECRET"),
    publicKey: process.env.CODEF_PUBLIC_KEY?.trim() ?? "",
    ePrepayNo: process.env.CODEF_EPREPAY_NO?.trim() ?? "",
    ePrepayPass: process.env.CODEF_EPREPAY_PASS?.trim() ?? "",
    sandbox,
    /** OAuth 토큰 (샌드박스·정식 동일 호스트) */
    tokenUrl: "https://oauth.codef.io/oauth/token",
    /**
     * API 베이스
     * - 데모/개발: https://development.codef.io
     * - 정식: https://api.codef.io
     */
    apiBase: sandbox ? "https://development.codef.io" : "https://api.codef.io",
  };
}

export function hasCodefCredentials() {
  return Boolean(process.env.CODEF_CLIENT_ID?.trim() && process.env.CODEF_CLIENT_SECRET?.trim());
}
