import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo } from "@/components/layout/logo";
import { getSession } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/constants";
import { hasDefaultName, hasDefaultOfficeName } from "@/lib/profile";
import { OnboardingForm } from "./onboarding-form";

export const metadata: Metadata = { title: "시작하기" };

export default async function OnboardingPage() {
  const { profile, office } = await getSession();
  if (profile.onboarded_at) redirect("/dashboard");

  const isOwner = profile.role === "owner";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 p-6">
      <div className="w-full max-w-md space-y-6">
        <Logo />
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">가입을 환영해요!</h1>
          <p className="text-sm text-muted-foreground">
            {isOwner
              ? "두 가지만 알려주시면 바로 시작할 수 있어요. 나머지는 필요할 때 입력해도 돼요."
              : `${office.name}에 ${ROLE_LABELS[profile.role]}(으)로 합류했어요. 동료들이 알아볼 수 있게 이름을 알려주세요.`}
          </p>
        </div>
        <OnboardingForm
          isOwner={isOwner}
          defaultName={hasDefaultName(profile) ? "" : profile.name}
          defaultOfficeName={hasDefaultOfficeName(office) ? "" : office.name}
          defaultPhone={profile.phone ?? ""}
        />
      </div>
    </div>
  );
}
