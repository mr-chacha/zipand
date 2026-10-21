import { getCodefConfig } from "@/lib/codef/config";
import type { CodefDocKind, CodefFetchResult, CodefParsedAddress } from "@/lib/codef/types";

type TokenCache = { accessToken: string; expiresAt: number };
let tokenCache: TokenCache | null = null;

/** OAuth2 client_credentials 토큰 */
export async function getCodefAccessToken(): Promise<string> {
  const now = Date.now();
  if (tokenCache && tokenCache.expiresAt > now + 60_000) return tokenCache.accessToken;

  const { clientId, clientSecret, tokenUrl } = getCodefConfig();
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`CODEF 토큰 발급 실패 (${res.status}): ${body.slice(0, 200)}`);
  }
  const json = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!json.access_token) throw new Error("CODEF 토큰 응답에 access_token이 없습니다.");
  tokenCache = {
    accessToken: json.access_token,
    expiresAt: now + (json.expires_in ?? 3600) * 1000,
  };
  return json.access_token;
}

/**
 * 주소로 공부서류 1종 요청.
 * TODO: 상품별 엔드포인트·2Way(주소 복수 선택)·RSA 암호화를 상품 명세에 맞게 구현.
 */
export async function fetchCodefDocument(
  kind: CodefDocKind,
  address: CodefParsedAddress
): Promise<CodefFetchResult> {
  void (await getCodefAccessToken());
  void address;
  throw new Error(
    `CODEF ${kind} 연동은 아직 구현되지 않았습니다. 등기/건축물대장/지적도 상품 명세를 확인한 뒤 lib/codef 에 추가하세요.`
  );
}
