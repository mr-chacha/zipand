import type { Metadata } from "next";
import Link from "next/link";
import { Upload } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "회원가입" };

const steps = ["계정 정보", "중개사 인증", "사무소 정보"];

export default function SignupPage() {
  return (
    <div className="space-y-8">
      <Logo className="lg:hidden" />
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">회원가입</h1>
        <p className="text-sm text-muted-foreground">
          중개사 인증을 완료하면 모든 기능을 사용할 수 있어요.
        </p>
      </div>

      <ol className="flex items-center gap-2 text-xs">
        {steps.map((step, i) => (
          <li key={step} className="flex flex-1 items-center gap-2">
            <span
              className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-full font-medium",
                i === 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}
            >
              {i + 1}
            </span>
            <span className={cn(i === 0 ? "font-medium" : "text-muted-foreground")}>{step}</span>
            {i < steps.length - 1 && <span className="h-px flex-1 bg-border" />}
          </li>
        ))}
      </ol>

      <form className="space-y-6">
        <section className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">이름</Label>
            <Input id="name" placeholder="홍길동" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">이메일</Label>
            <Input id="email" type="email" placeholder="broker@example.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">비밀번호</Label>
            <Input id="password" type="password" placeholder="8자 이상, 영문·숫자 조합" />
          </div>
        </section>

        <section className="space-y-4 rounded-lg border border-dashed p-4">
          <p className="text-sm font-medium">중개사 인증 (다음 단계 미리보기)</p>
          <div className="space-y-2">
            <Label htmlFor="license">개설등록번호</Label>
            <Input id="license" placeholder="예: 11440-2026-00000" disabled />
          </div>
          <div className="flex items-center gap-3 rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
            <Upload className="size-4" />
            자동 확인이 어려우면 등록증 사본을 제출해 관리자 확인을 받을 수 있어요. 제출 서류는 인증 후 파기됩니다.
          </div>
        </section>

        <div className="space-y-3 text-sm">
          <label className="flex items-center gap-2">
            <Checkbox />
            [필수] 서비스 이용약관 동의
          </label>
          <label className="flex items-center gap-2">
            <Checkbox />
            [필수] 개인정보 수집·이용 동의
          </label>
          <label className="flex items-center gap-2">
            <Checkbox />
            [선택] 실무 콘텐츠·혜택 알림 수신
          </label>
        </div>

        <Link href="/dashboard" className={cn(buttonVariants({ size: "lg" }), "w-full")}>
          다음
        </Link>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        이미 계정이 있나요?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          로그인
        </Link>
      </p>
    </div>
  );
}
