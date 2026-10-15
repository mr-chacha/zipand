/// <reference types="@capacitor/local-notifications" />
import type { CapacitorConfig } from "@capacitor/cli";

/**
 * 앱은 배포된 집앤 웹을 WebView로 띄운다(Next.js 서버 액션·SSR 사용으로 정적 번들 불가).
 * - 개발: 에뮬레이터에서 호스트 PC의 `npm run dev`(10.0.2.2:3000)
 * - 배포: `CAP_SERVER_URL=https://… npx cap sync android`
 */
const serverUrl = process.env.CAP_SERVER_URL ?? "http://10.0.2.2:3000";

const config: CapacitorConfig = {
  appId: "kr.zipand.app",
  appName: "집앤",
  webDir: "mobile/www",
  appendUserAgent: "ZipandApp",
  backgroundColor: "#ffffff",
  server: {
    url: serverUrl,
    cleartext: serverUrl.startsWith("http://"),
  },
  plugins: {
    SystemBars: { insetsHandling: "native" },
    LocalNotifications: {
      iconColor: "#0f766e",
    },
  },
};

export default config;
