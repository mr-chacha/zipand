import "server-only";
import { headers } from "next/headers";

/** capacitor.config.ts의 `appendUserAgent`와 같은 값 */
const APP_USER_AGENT = "ZipandApp";

/** 안드로이드 앱(WebView)에서 들어온 요청인지 */
export async function isAppRequest() {
  const ua = (await headers()).get("user-agent") ?? "";
  return ua.includes(APP_USER_AGENT);
}
