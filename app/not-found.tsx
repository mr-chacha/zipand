import type { Metadata } from "next";
import Link from "next/link";
import { MapPinOff } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { StatusScreen } from "@/components/status-screen";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = { title: "페이지를 찾을 수 없어요" };

export default function NotFound() {
  return (
    <div className="relative">
      <Logo className="absolute top-6 left-6" />
      <StatusScreen
        fullScreen
        icon={MapPinOff}
        code="404"
        title="페이지를 찾을 수 없어요"
        description="주소가 잘못되었거나, 삭제되어 더 이상 볼 수 없는 페이지예요."
        actions={
          <>
            <Link href="/dashboard" className={buttonVariants()}>
              대시보드로 이동
            </Link>
            <Link href="/login" className={buttonVariants({ variant: "outline" })}>
              로그인
            </Link>
          </>
        }
      />
    </div>
  );
}
