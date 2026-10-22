"use server";

import { revalidatePath } from "next/cache";
import { hasAiAccess } from "@/lib/ai/access";
import { getSession } from "@/lib/auth";
import {
  AI_PROVIDERS,
  BILLING_MODES,
  CREDIT_PACKS,
  PLANS,
  type AiProviderId,
  type BillingModeId,
  type PlanId,
} from "@/lib/constants";
import { FormError, toErrorMessage } from "@/lib/form";
import type { ActionState } from "@/types";

/** 클라이언트에서 AI 사용 가능 뱃지용 */
export async function getAiAccessState(): Promise<{ available: boolean }> {
  const { office } = await getSession();
  return { available: hasAiAccess(office) };
}

const OWNER_ONLY = "대표만 변경할 수 있어요.";

function asProvider(v: string): AiProviderId {
  if (AI_PROVIDERS.some((p) => p.id === v)) return v as AiProviderId;
  throw new FormError("AI 엔진을 선택해 주세요.");
}

function asBillingMode(v: string): BillingModeId {
  if (BILLING_MODES.some((m) => m.id === v)) return v as BillingModeId;
  throw new FormError("과금 방식을 선택해 주세요.");
}

function asPlanId(v: string): PlanId {
  if (PLANS.some((p) => p.id === v)) return v as PlanId;
  throw new FormError("요금제를 선택해 주세요.");
}

async function requireOwnerOffice() {
  const session = await getSession();
  if (session.profile.role !== "owner") throw new FormError(OWNER_ONLY);
  return session;
}

export async function setAiProvider(provider: string): Promise<ActionState> {
  try {
    const { supabase, office } = await requireOwnerOffice();
    const ai_provider = asProvider(provider);
    const { error } = await supabase.from("offices").update({ ai_provider }).eq("id", office.id);
    if (error) throw error;
  } catch (e) {
    return { error: toErrorMessage(e) };
  }
  revalidatePath("/settings");
  revalidatePath("/assistant");
  return { message: "AI 엔진을 저장했어요." };
}

export async function setBillingMode(mode: string): Promise<ActionState> {
  try {
    const { supabase, office } = await requireOwnerOffice();
    const billing_mode = asBillingMode(mode);
    const { error } = await supabase.from("offices").update({ billing_mode }).eq("id", office.id);
    if (error) throw error;
  } catch (e) {
    return { error: toErrorMessage(e) };
  }
  revalidatePath("/settings");
  revalidatePath("/assistant");
  return { message: "과금 방식을 저장했어요." };
}

export async function setPlanId(planId: string): Promise<ActionState> {
  try {
    const { supabase, office } = await requireOwnerOffice();
    if (office.billing_mode !== "subscription") {
      throw new FormError("구독제를 먼저 선택한 뒤 요금제를 고를 수 있어요.");
    }
    const plan_id = asPlanId(planId);
    const { error } = await supabase.from("offices").update({ plan_id }).eq("id", office.id);
    if (error) throw error;
  } catch (e) {
    return { error: toErrorMessage(e) };
  }
  revalidatePath("/settings");
  return { message: "요금제를 저장했어요. 결제는 준비중이에요." };
}

/** 결제 연동 전: 테스트용으로 크레딧만 올려 둔다 */
export async function addTestCredits(packId: string): Promise<ActionState> {
  try {
    const { supabase, office } = await requireOwnerOffice();
    if (office.billing_mode !== "credits") {
      throw new FormError("토큰·크레딧 충전 방식을 먼저 선택해 주세요.");
    }
    const pack = CREDIT_PACKS.find((p) => p.id === packId);
    if (!pack) throw new FormError("충전 팩을 선택해 주세요.");
    const next = (office.ai_credit_balance ?? 0) + pack.credits;
    const { error } = await supabase.from("offices").update({ ai_credit_balance: next }).eq("id", office.id);
    if (error) throw error;
  } catch (e) {
    return { error: toErrorMessage(e) };
  }
  revalidatePath("/settings");
  return { message: "테스트 크레딧을 넣었어요. (실제 결제는 준비중)" };
}
