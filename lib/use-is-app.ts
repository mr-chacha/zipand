"use client";

import { useSyncExternalStore } from "react";

/** capacitor.config.ts의 `appendUserAgent`와 같은 값 (서버는 lib/app-mode.ts) */
const APP_USER_AGENT = "ZipandApp";

const noopSubscribe = () => () => {};

/** 안드로이드 앱(WebView)에서 열렸는지. 서버 렌더링 중에는 false */
export function useIsApp() {
  return useSyncExternalStore(
    noopSubscribe,
    () => navigator.userAgent.includes(APP_USER_AGENT),
    () => false
  );
}
