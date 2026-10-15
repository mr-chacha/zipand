import { getSession } from "@/lib/auth";
import { hasDefaultName } from "@/lib/profile";

export type SetupStepKey = "profile" | "office" | "property" | "briefing" | "invite";

export interface SetupStep {
  key: SetupStepKey;
  title: string;
  /** 대시보드에서 이 단계를 안내할 문구 */
  prompt: string;
  done: boolean;
  /** 사무소 등록 전이라 진행할 수 없는 단계. 건너뛰고 다음 단계로 갈 수 있다 */
  locked: boolean;
}

/**
 * 단계별 시작하기 진행 상태. 단계는 순서대로만 진행하고, 현재 단계는 아직 끝나지 않은 첫 단계다.
 * 대표는 사무소 정보·구성원 초대까지 5단계, 구성원은 3단계.
 */
export async function getSetupProgress() {
  const { supabase, profile, office } = await getSession();
  const isOwner = profile.role === "owner";
  const unregistered = office.registered_at === null;

  const [properties, briefings, invites, members] = await Promise.all([
    supabase.from("properties").select("id", { count: "exact", head: true }),
    supabase.from("briefings").select("id", { count: "exact", head: true }),
    isOwner ? supabase.from("office_invites").select("id", { count: "exact", head: true }) : null,
    isOwner ? supabase.from("profiles").select("id", { count: "exact", head: true }) : null,
  ]);

  const steps: SetupStep[] = [
    {
      key: "profile",
      title: "내 정보",
      prompt: "내 정보를 입력해서 프로필 설정을 완료해 주세요.",
      done: !hasDefaultName(profile) && Boolean(profile.phone),
      locked: false,
    },
    {
      key: "office",
      title: "사무소 정보",
      prompt: "우리 사무소를 조회하고 사업자등록정보로 인증해서 사무소 등록을 완료해 주세요.",
      done: office.registered_at !== null,
      locked: false,
    },
    {
      key: "property",
      title: "첫 매물 등록",
      prompt: "첫 매물을 등록해 보세요. 필수 정보만 입력해도 돼요.",
      done: (properties.count ?? 0) > 0,
      locked: false,
    },
    {
      key: "briefing",
      title: "고객 브리핑 공유",
      prompt: "등록한 매물로 고객에게 보낼 브리핑 링크를 만들어 보세요.",
      done: (briefings.count ?? 0) > 0,
      locked: unregistered,
    },
    {
      key: "invite",
      title: "구성원 초대",
      prompt: "함께 일하는 소속중개사·중개보조원을 초대해 보세요.",
      done: (members?.count ?? 0) > 1 || (invites?.count ?? 0) > 0,
      locked: unregistered,
    },
  ].filter((step): step is SetupStep => isOwner || (step.key !== "office" && step.key !== "invite"));

  const firstOpen = steps.findIndex((step) => !step.done && !step.locked);

  return {
    steps,
    /** 진행할 단계 (모두 끝났으면 마지막 단계) */
    currentIndex: firstOpen === -1 ? steps.length - 1 : firstOpen,
    /** 마지막 단계에서 완료(또는 건너뛰기)를 눌렀다 */
    finished: Boolean(profile.setup_completed_at),
    allDone: firstOpen === -1,
  };
}
