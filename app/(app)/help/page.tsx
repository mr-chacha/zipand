import type { Metadata } from "next";
import Link from "next/link";
import { FileText, LifeBuoy, Megaphone, MessageCircleQuestion } from "lucide-react";
import { ComingSoonBadge, ComingSoonScreen } from "@/components/coming-soon";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "고객센터" };

const items = [
  { icon: Megaphone, title: "공지사항", description: "업데이트와 점검 일정을 알려드려요.", comingSoon: true },
  { icon: MessageCircleQuestion, title: "자주 묻는 질문", description: "사용법과 요금 관련 질문을 모았어요.", comingSoon: true },
  { icon: LifeBuoy, title: "1:1 문의", description: "문의를 남기면 담당자가 답변드려요.", comingSoon: true },
  { icon: FileText, title: "이용약관 · 개인정보 처리방침", description: "서비스 이용 조건과 개인정보 처리 기준이에요.", href: "/terms" },
];

export default function HelpPage() {
  return (
    <ComingSoonScreen
      icon={LifeBuoy}
      title="고객센터를 준비하고 있어요"
      description="공지사항, 자주 묻는 질문, 1:1 문의는 곧 열려요. 약관과 개인정보 처리방침은 지금 확인할 수 있어요."
    >
      <div className="grid gap-3 text-left sm:grid-cols-2">
        {items.map((item) => {
          const content = (
            <Card className="h-full transition-colors hover:border-primary/40">
              <CardHeader>
                <item.icon className="mb-1 size-5 text-primary" />
                <CardTitle className="flex items-center gap-2">
                  {item.title}
                  {item.comingSoon && <ComingSoonBadge />}
                </CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </CardHeader>
            </Card>
          );
          return item.href ? (
            <Link key={item.title} href={item.href}>
              {content}
            </Link>
          ) : (
            <div key={item.title} className="opacity-80">
              {content}
            </div>
          );
        })}
      </div>
    </ComingSoonScreen>
  );
}
