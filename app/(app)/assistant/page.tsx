import type { Metadata } from "next";
import { Bot, FileSearch, MessageSquareText, Mic, PenLine, Smartphone, Sparkles } from "lucide-react";
import { ComingSoonScreen } from "@/components/coming-soon";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "AI 실무 도우미" };

const features = [
  { icon: Mic, title: "AI 임장 정리", description: "현장 음성 메모를 받아쓰고 방향·채광·수리 필요 항목으로 정리해요.", manual: "임장 기록에서 직접 입력" },
  { icon: FileSearch, title: "AI 문서 분석", description: "등기·건축물대장에서 핵심 항목을 추출하고 원문 근거를 연결해요.", manual: "문서 상세에서 직접 정리" },
  { icon: Sparkles, title: "AI 브리핑 작성", description: "확인된 정보만으로 고객 맞춤 매물 설명을 작성해요.", manual: "브리핑에서 설명 편집" },
  { icon: MessageSquareText, title: "상담 요약 · 문자 초안", description: "통화 녹음을 요약하고 고객에게 보낼 문자를 만들어요.", manual: "고객 상세에서 상담 기록" },
  { icon: PenLine, title: "특약 추천 · 계약서 초안", description: "거래 조건에 맞는 특약과 계약서·확인설명서 초안을 작성해요.", manual: "특약 라이브러리 사용" },
  { icon: Smartphone, title: "모바일 앱", description: "현장에서 사진·음성을 바로 남기고 오프라인에서도 기록해요.", manual: "모바일 웹으로 접속" },
];

export default function AssistantPage() {
  return (
    <ComingSoonScreen
      icon={Bot}
      title="AI 실무 도우미를 준비하고 있어요"
      description="AI와 모바일 앱 기능은 서비스 준비중이에요. 출시 전까지는 각 메뉴에서 같은 작업을 직접 입력하고 검토할 수 있어요."
      alternatives={[
        { label: "매물 관리로 이동", href: "/properties" },
        { label: "문서 관리", href: "/documents" },
      ]}
    >
      <div className="grid gap-3 text-left sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <Card key={f.title} size="sm">
            <CardHeader>
              <f.icon className="mb-1 size-5 text-primary" />
              <CardTitle>{f.title}</CardTitle>
              <CardDescription>{f.description}</CardDescription>
              <p className="pt-1 text-xs text-primary">지금은: {f.manual}</p>
            </CardHeader>
          </Card>
        ))}
      </div>
    </ComingSoonScreen>
  );
}
