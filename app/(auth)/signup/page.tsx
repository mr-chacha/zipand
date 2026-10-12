import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/layout/logo";
import { ROLE_LABELS } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = { title: "회원가입" };

export default async function SignupPage({ searchParams }: PageProps<"/signup">) {
  const { invite: inviteParam } = await searchParams;
  const inviteToken = typeof inviteParam === "string" ? inviteParam : null;

  let invite: { office_name: string; email: string; role: string } | null = null;
  if (inviteToken) {
    const supabase = await createClient();
    const { data } = await supabase.rpc("get_invite", { invite_token: inviteToken });
    invite = data?.[0] ?? null;
  }

  return (
    <div className="space-y-8">
      <Logo className="lg:hidden" />
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">회원가입</h1>
        {invite ? (
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">{invite.office_name}</strong>에서{" "}
            {ROLE_LABELS[invite.role]}(으)로 초대했어요.
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            가입하면 내 중개사무소 워크스페이스가 만들어지고, 대표로 등록돼요.
          </p>
        )}
      </div>

      {inviteToken && !invite ? (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          초대 링크가 만료되었거나 이미 사용되었습니다. 사무소 대표에게 새 초대를 요청해 주세요.
        </p>
      ) : (
        <SignupForm inviteToken={invite ? inviteToken : null} inviteEmail={invite?.email} />
      )}

      <p className="text-center text-sm text-muted-foreground">
        이미 계정이 있나요?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          로그인
        </Link>
      </p>
    </div>
  );
}
