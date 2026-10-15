import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Check, Lock } from "lucide-react";
import { OfficeRequiredNotice } from "@/components/office-gate";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createProperty } from "@/lib/actions/properties";
import { getSession } from "@/lib/auth";
import type { RegistryOffice } from "@/lib/office-registry";
import { hasDefaultName, hasDefaultOfficeName } from "@/lib/profile";
import { getOfficeMembers, getPropertyOptions } from "@/lib/queries";
import { getSetupProgress, type SetupStep } from "@/lib/setup";
import { cn } from "@/lib/utils";
import { PropertyForm } from "../properties/property-form";
import { BriefingStep, InviteStep, OfficeStep, ProfileStep, StepFooter } from "./setup-steps";

export const metadata: Metadata = { title: "시작하기" };

const DESCRIPTIONS: Record<SetupStep["key"], string> = {
  profile: "고객과 동료에게 보이는 내 정보예요.",
  office: "공공데이터포털에 등록된 공인중개사사무소 정보에서 우리 사무소를 찾아 등록해요.",
  property: "필수 정보만 먼저 입력하고, 사진과 상세 정보는 나중에 보완할 수 있어요.",
  briefing: "등록한 매물로 고객에게 보낼 브리핑 링크를 만들어 보세요.",
  invite: "함께 일하는 소속중개사·중개보조원을 초대해요. 혼자 일한다면 나중에 해도 돼요.",
};

function Stepper({ steps, viewing }: { steps: SetupStep[]; viewing: number }) {
  return (
    <ol className="flex items-center gap-2">
      {steps.map((step, i) => {
        const active = i === viewing;
        return (
          <li key={step.key} className="flex flex-1 items-center gap-2">
            <span
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                active && "border-primary bg-primary text-primary-foreground",
                !active && step.done && "border-primary/40 bg-primary/10 text-primary",
                !active && !step.done && "text-muted-foreground"
              )}
            >
              {step.done && !active ? (
                <Check className="size-3.5" />
              ) : step.locked && !active ? (
                <Lock className="size-3.5" />
              ) : (
                i + 1
              )}
            </span>
            <span className={cn("hidden text-xs sm:inline", active ? "font-semibold" : "text-muted-foreground")}>
              {step.title}
            </span>
            {i < steps.length - 1 && <span className="h-px flex-1 bg-border" />}
          </li>
        );
      })}
    </ol>
  );
}

export default async function SetupPage({ searchParams }: PageProps<"/setup">) {
  const { step: stepParam } = await searchParams;
  const [{ supabase, profile, office }, progress] = await Promise.all([getSession(), getSetupProgress()]);
  if (progress.finished) redirect("/mypage");

  const { steps, currentIndex } = progress;
  const requested = Number(stepParam) - 1;
  // 아직 열리지 않은 단계로는 갈 수 없다
  if (!Number.isInteger(requested) || requested < 0 || requested > currentIndex) {
    redirect(`/setup?step=${currentIndex + 1}`);
  }

  const step = steps[requested];
  const href = (index: number) => (index >= 0 && index < steps.length ? `/setup?step=${index + 1}` : undefined);
  const nav = { prevHref: href(requested - 1), nextHref: href(requested + 1) };

  /** 매물 등록 폼은 자체 카드로 구성돼 있어 단계 카드 밖에 둔다 */
  const fullForm = step.key === "property" && !step.done;
  let content: React.ReactNode;
  switch (step.key) {
    case "profile":
      content = (
        <ProfileStep
          {...nav}
          name={hasDefaultName(profile) ? "" : profile.name}
          phone={profile.phone ?? ""}
          licenseNo={profile.license_no ?? ""}
          showLicense={office.registered_at !== null}
        />
      );
      break;
    case "office":
      content = (
        <OfficeStep
          {...nav}
          office={{
            name: hasDefaultOfficeName(office) ? "" : office.name,
            phone: office.phone ?? profile.phone ?? "",
            representative: office.representative ?? profile.name,
            registration_no: office.registration_no ?? "",
            address: office.address ?? "",
          }}
          registry={office.registered_at && office.registry_data ? (office.registry_data as unknown as RegistryOffice) : null}
        />
      );
      break;
    case "property": {
      if (step.done) {
        const properties = await getPropertyOptions();
        content = (
          <div className="space-y-4">
            <p className="rounded-lg bg-muted/50 px-3 py-2 text-sm">
              매물 {properties.length}건을 등록했어요. 추가 등록과 수정은 매물 관리에서 할 수 있어요.
            </p>
            <StepFooter {...nav} canNext />
          </div>
        );
      } else {
        const members = await getOfficeMembers();
        content = (
          <PropertyForm
            action={createProperty}
            members={members}
            currentUserId={profile.id}
            officeId={office.id}
            cancelHref={nav.prevHref ?? "/dashboard"}
            cancelLabel="이전"
            submitLabel="저장하고 다음"
            redirectTo={nav.nextHref ?? "/setup"}
            hideAutoFill
          />
        );
      }
      break;
    }
    case "briefing": {
      if (step.locked) {
        content = (
          <div className="space-y-4">
            <OfficeRequiredNotice kind="briefing" isOwner={profile.role === "owner"} next={`/setup?step=${requested + 1}`} compact />
            <StepFooter {...nav} canNext />
          </div>
        );
        break;
      }
      const properties = await getPropertyOptions();
      content = <BriefingStep {...nav} properties={properties} done={step.done} />;
      break;
    }
    case "invite": {
      if (step.locked) {
        content = (
          <div className="space-y-4">
            <OfficeRequiredNotice kind="invite" isOwner next={`/setup?step=${requested + 1}`} compact />
            <StepFooter prevHref={nav.prevHref} canNext />
          </div>
        );
        break;
      }
      const { data: invites } = await supabase
        .from("office_invites")
        .select("id, email, role, token")
        .is("accepted_at", null)
        .order("created_at", { ascending: false });
      content = (
        <InviteStep
          prevHref={nav.prevHref}
          invites={invites ?? []}
          done={step.done}
          siteUrl={process.env.NEXT_PUBLIC_SITE_URL ?? ""}
        />
      );
      break;
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">집앤 시작하기</h1>
        <p className="text-sm text-muted-foreground">
          {steps.length}단계 중 {requested + 1}단계 · 하나씩 입력하면 바로 업무를 시작할 수 있어요.
        </p>
      </div>
      <Stepper steps={steps} viewing={requested} />
      <Card>
        <CardHeader>
          <CardTitle>
            {requested + 1}. {step.title}
          </CardTitle>
          <CardDescription>{DESCRIPTIONS[step.key]}</CardDescription>
        </CardHeader>
        {!fullForm && <CardContent>{content}</CardContent>}
      </Card>
      {fullForm && content}
    </div>
  );
}
