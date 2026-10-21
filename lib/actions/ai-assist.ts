"use server";

import { revalidatePath } from "next/cache";
import { consumeAiCredit } from "@/lib/ai/credits";
import { matchPropertiesForDraft } from "@/lib/ai/match-properties";
import { phoneFromFilename } from "@/lib/ai/phone";
import { resolveAiProvider } from "@/lib/ai/provider";
import { runConsultationFromAudio } from "@/lib/ai/run-consult";
import { runAdCopy, runLocationDraft } from "@/lib/ai/run-text";
import type { ConsultationDraft, LocationDraft, PropertyMatch } from "@/lib/ai/types";
import { getSession } from "@/lib/auth";
import { DEAL_TYPES } from "@/lib/constants";
import { FormError } from "@/lib/errors";
import { str, toErrorMessage } from "@/lib/form";
import { isPropertyPath } from "@/lib/storage";

const AUDIO_MAX = 25 * 1024 * 1024;

async function loadAudioBytes(
  supabase: Awaited<ReturnType<typeof getSession>>["supabase"],
  bucket: "consultation-audio",
  path: string
) {
  const { data, error } = await supabase.storage.from(bucket).download(path);
  if (error || !data) throw new FormError("녹음 파일을 불러오지 못했어요.");
  const buf = Buffer.from(await data.arrayBuffer());
  if (buf.byteLength > AUDIO_MAX) throw new FormError("AI 분석은 25MB 이하 녹음만 가능해요.");
  return buf;
}

export type AnalyzeCallResult =
  | { ok: true; draft: ConsultationDraft; matches: PropertyMatch[]; phoneFromFile: string | null }
  | { ok: false; error: string };

/** 스토리지에 올린 통화 녹음 경로로 고객·상담 초안 생성 (신규 등록·기존 고객 공통) */
export async function analyzeCallAudio(audioPath: string, audioName: string): Promise<AnalyzeCallResult> {
  try {
    const { supabase, office } = await getSession();
    if (!audioPath.startsWith(`${office.id}/`) || audioPath.includes("..")) {
      throw new FormError("녹음 파일 경로가 올바르지 않아요.");
    }
    const ai = resolveAiProvider(office.ai_provider);
    await consumeAiCredit(supabase, office, 1);
    const bytes = await loadAudioBytes(supabase, "consultation-audio", audioPath);
    const mime = audioName.toLowerCase().endsWith(".m4a") ? "audio/mp4" : "audio/mpeg";
    const draft = await runConsultationFromAudio(ai, bytes, audioName || "call.m4a", mime);
    const phoneFromFile = phoneFromFilename(audioName);

    const { data: properties } = await supabase
      .from("properties")
      .select("id, title, deal_type, region, address, price, monthly_rent, status")
      .limit(80);
    const matches = matchPropertiesForDraft(properties ?? [], draft);

    return { ok: true, draft, matches, phoneFromFile };
  } catch (e) {
    return { ok: false, error: toErrorMessage(e) };
  }
}

/** 기존 상담 녹음 요약 → 상담 content·고객 필드 반영용 초안 */
export async function analyzeConsultation(consultationId: string): Promise<AnalyzeCallResult> {
  try {
    const { supabase, office } = await getSession();
    const { data: row, error } = await supabase
      .from("consultations")
      .select("id, customer_id, audio_path, audio_name")
      .eq("id", consultationId)
      .single();
    if (error || !row?.audio_path) throw new FormError("상담 녹음이 없어요.");
    if (!isPropertyPath(row.audio_path, office.id, row.customer_id)) {
      throw new FormError("녹음 파일 경로가 올바르지 않아요.");
    }
    return analyzeCallAudio(row.audio_path, row.audio_name ?? "call.m4a");
  } catch (e) {
    return { ok: false, error: toErrorMessage(e) };
  }
}

export type ApplyConsultResult = { ok: true; message: string } | { ok: false; error: string };

/** 검토한 초안을 고객·상담에 반영 */
export async function applyConsultationDraft(
  customerId: string,
  consultationId: string | null,
  draft: ConsultationDraft,
  applyCustomerFields: boolean
): Promise<ApplyConsultResult> {
  try {
    const { supabase } = await getSession();
    if (applyCustomerFields) {
      const { error } = await supabase
        .from("customers")
        .update({
          updated_at: new Date().toISOString(),
          ...(draft.name ? { name: draft.name } : {}),
          ...(draft.phone ? { phone: draft.phone } : {}),
          ...(draft.deal_type && (DEAL_TYPES as readonly string[]).includes(draft.deal_type)
            ? { deal_type: draft.deal_type }
            : {}),
          ...(draft.regions ? { regions: draft.regions } : {}),
          ...(draft.budget_min != null ? { budget_min: draft.budget_min } : {}),
          ...(draft.budget_max != null ? { budget_max: draft.budget_max } : {}),
          ...(draft.move_in_date ? { move_in_date: draft.move_in_date } : {}),
          ...(draft.must_have ? { must_have: draft.must_have } : {}),
          ...(draft.exclude ? { exclude: draft.exclude } : {}),
          ...(draft.memo ? { memo: draft.memo } : {}),
        })
        .eq("id", customerId);
      if (error) throw error;
    }

    const content = [
      draft.summary,
      draft.transcript_excerpt ? `\n[근거 발화]\n${draft.transcript_excerpt}` : "",
      `\n(AI 초안 · ${draft.provider} · 사용자 검토 필요)`,
    ]
      .filter(Boolean)
      .join("\n");

    if (consultationId) {
      const { error } = await supabase.from("consultations").update({ content }).eq("id", consultationId);
      if (error) throw error;
    }

    revalidatePath(`/customers/${customerId}`);
    revalidatePath("/customers");
    return { message: "AI 초안을 반영했어요. 내용이 맞는지 한 번 더 확인해 주세요.", ok: true };
  } catch (e) {
    return { ok: false, error: toErrorMessage(e) };
  }
}

export type AdCopyResult = { ok: true; description: string; highlights: string } | { ok: false; error: string };

export async function suggestPropertyAdCopy(fd: FormData): Promise<AdCopyResult> {
  try {
    const { supabase, office } = await getSession();
    const ai = resolveAiProvider(office.ai_provider);
    await consumeAiCredit(supabase, office, 1);
    const result = await runAdCopy(ai, {
      title: str(fd, "title") ?? "",
      address: str(fd, "address") ?? "",
      dealType: str(fd, "deal_type") ?? "",
      propertyType: str(fd, "property_type") ?? "",
      price: str(fd, "price") ?? "",
      monthlyRent: str(fd, "monthly_rent") ?? "",
      area: str(fd, "area_m2") ?? "",
      highlights: str(fd, "highlights") ?? "",
    });
    return {
      ok: true,
      description: result.description?.trim() || "",
      highlights: result.highlights?.trim() || "",
    };
  } catch (e) {
    return { ok: false, error: toErrorMessage(e) };
  }
}

export type LocationResult = { ok: true; fields: LocationDraft } | { ok: false; error: string };

export async function suggestDisclosureLocation(address: string): Promise<LocationResult> {
  try {
    const { supabase, office } = await getSession();
    const trimmed = address.trim();
    if (!trimmed) throw new FormError("입지를 채우려면 주소가 필요해요.");
    const ai = resolveAiProvider(office.ai_provider);
    await consumeAiCredit(supabase, office, 1);
    const fields = await runLocationDraft(ai, trimmed);
    return { ok: true, fields };
  } catch (e) {
    return { ok: false, error: toErrorMessage(e) };
  }
}
