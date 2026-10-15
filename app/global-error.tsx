"use client";

import "./globals.css";

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <html lang="ko">
      <body className="font-sans antialiased">
        <title>오류 | 집앤</title>
        <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-muted/30 p-6 text-center">
          <p className="text-sm font-semibold tracking-widest text-primary">ERROR</p>
          <h1 className="text-2xl font-bold">서비스에 문제가 생겼어요</h1>
          <p className="max-w-md text-sm text-muted-foreground">
            잠시 후 다시 시도해 주세요. 문제가 계속되면 페이지를 새로고침해 주세요.
          </p>
          {error.digest && <p className="font-mono text-xs text-muted-foreground">오류 코드: {error.digest}</p>}
          <button
            type="button"
            onClick={() => unstable_retry()}
            className="mt-2 h-9 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
          >
            다시 시도
          </button>
        </main>
      </body>
    </html>
  );
}
