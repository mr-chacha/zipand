import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Logo } from "@/components/layout/logo";

const points = [
  "사진·음성으로 남기는 스마트 임장 기록",
  "원문 근거와 함께 보는 공부서류 AI 분석",
  "클릭 몇 번으로 만드는 고객용 매물 브리핑",
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-primary p-10 text-primary-foreground lg:flex">
        <Logo className="[&>span:first-child]:bg-primary-foreground [&>span:first-child]:text-primary" />
        <div className="space-y-6">
          <h2 className="text-3xl leading-snug font-bold">
            임장부터 계약 준비까지,
            <br />
            중개사의 반복 업무를 줄여드려요
          </h2>
          <ul className="space-y-3 text-primary-foreground/90">
            {points.map((point) => (
              <li key={point} className="flex items-center gap-2">
                <CheckCircle2 className="size-5" />
                {point}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-primary-foreground/70">
          AI 분석 결과는 업무 보조 자료이며, 최종 확인·설명 책임은 중개사에게 있습니다.
        </p>
      </div>
      <div className="flex flex-col items-center justify-center gap-8 p-6">
        <div className="w-full max-w-md">{children}</div>
        <nav className="flex gap-4 text-xs text-muted-foreground">
          <Link href="/terms" className="hover:text-foreground">
            이용약관
          </Link>
          <Link href="/privacy" className="font-medium hover:text-foreground">
            개인정보 처리방침
          </Link>
        </nav>
      </div>
    </div>
  );
}
