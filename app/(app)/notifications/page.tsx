import type { Metadata } from "next";
import { Bell } from "lucide-react";
import { ComingSoonScreen } from "@/components/coming-soon";

export const metadata: Metadata = { title: "알림" };

export default function NotificationsPage() {
  return (
    <ComingSoonScreen
      icon={Bell}
      title="알림 센터를 준비하고 있어요"
      description="임장·연락 일정, 브리핑 열람, 문서 검토 요청을 한곳에서 받아보는 기능이에요. 지금은 대시보드의 할 일에서 일정을 확인할 수 있어요."
      alternatives={[
        { label: "대시보드 할 일 보기", href: "/dashboard" },
        { label: "마이페이지", href: "/mypage" },
      ]}
    />
  );
}
