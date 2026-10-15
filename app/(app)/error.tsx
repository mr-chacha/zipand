"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RefreshCw, TriangleAlert } from "lucide-react";
import { StatusScreen } from "@/components/status-screen";
import { Button, buttonVariants } from "@/components/ui/button";

export default function AppError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <StatusScreen
      icon={TriangleAlert}
      title="화면을 불러오지 못했어요"
      description={
        <>
          일시적인 문제일 수 있어요. 잠시 후 다시 시도해 주세요.
          {error.digest && <span className="mt-2 block font-mono text-xs">오류 코드: {error.digest}</span>}
        </>
      }
      actions={
        <>
          <Button onClick={() => unstable_retry()}>
            <RefreshCw data-icon="inline-start" />
            다시 시도
          </Button>
          <Link href="/dashboard" className={buttonVariants({ variant: "outline" })}>
            대시보드
          </Link>
        </>
      }
    />
  );
}
