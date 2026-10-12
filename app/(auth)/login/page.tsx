import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/layout/logo";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "로그인" };

export default function LoginPage() {
  return (
    <div className="space-y-8">
      <Logo className="lg:hidden" />
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">로그인</h1>
        <p className="text-sm text-muted-foreground">집앤드 계정으로 로그인하세요.</p>
      </div>

      <form className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">이메일</Label>
          <Input id="email" type="email" placeholder="broker@example.com" />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">비밀번호</Label>
            <Link href="#" className="text-xs text-muted-foreground hover:text-foreground">
              비밀번호 찾기
            </Link>
          </div>
          <Input id="password" type="password" />
        </div>
        <Link href="/dashboard" className={cn(buttonVariants({ size: "lg" }), "w-full")}>
          로그인
        </Link>
      </form>

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <Separator className="flex-1" />
        또는
        <Separator className="flex-1" />
      </div>

      <div className="grid gap-2">
        <Button variant="outline" size="lg" className="w-full bg-[#FEE500] text-black hover:bg-[#FEE500]/90">
          카카오로 계속하기
        </Button>
        <Button variant="outline" size="lg" className="w-full">
          Google로 계속하기
        </Button>
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
