import type { Metadata } from "next";
import Link from "next/link";
import { ComingSoonButton } from "@/components/coming-soon";
import { Logo } from "@/components/layout/logo";
import { Separator } from "@/components/ui/separator";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "로그인" };

const errorMessages: Record<string, string> = {
  confirm: "인증 링크가 만료되었거나 올바르지 않습니다. 다시 시도해 주세요.",
  profile: "계정 정보를 찾을 수 없거나 비활성화된 계정입니다. 사무소 대표에게 문의해 주세요.",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next, error } = await searchParams;

  return (
    <div className="space-y-8">
      <Logo className="lg:hidden" />
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">로그인</h1>
        <p className="text-sm text-muted-foreground">집앤 계정으로 로그인하세요.</p>
      </div>

      <LoginForm
        next={typeof next === "string" ? next : undefined}
        initialError={typeof error === "string" ? errorMessages[error] : undefined}
      />

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <Separator className="flex-1" />
        또는
        <Separator className="flex-1" />
      </div>

      <div className="grid gap-2">
        <ComingSoonButton size="lg" className="w-full" icon={false}>
          카카오로 계속하기
        </ComingSoonButton>
        <ComingSoonButton size="lg" className="w-full" icon={false}>
          Google로 계속하기
        </ComingSoonButton>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        아직 계정이 없나요?{" "}
        <Link href="/signup" className="font-medium text-primary hover:underline">
          회원가입
        </Link>
      </p>
    </div>
  );
}
