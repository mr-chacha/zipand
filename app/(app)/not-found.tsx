import Link from "next/link";
import { SearchX } from "lucide-react";
import { StatusScreen } from "@/components/status-screen";
import { buttonVariants } from "@/components/ui/button";

export default function AppNotFound() {
  return (
    <StatusScreen
      icon={SearchX}
      code="404"
      title="찾는 정보가 없어요"
      description="삭제되었거나 다른 사무소의 정보라 볼 수 없어요. 목록에서 다시 찾아보세요."
      actions={
        <>
          <Link href="/dashboard" className={buttonVariants()}>
            대시보드
          </Link>
          <Link href="/properties" className={buttonVariants({ variant: "outline" })}>
            매물 목록
          </Link>
          <Link href="/customers" className={buttonVariants({ variant: "outline" })}>
            고객 목록
          </Link>
        </>
      }
    />
  );
}
