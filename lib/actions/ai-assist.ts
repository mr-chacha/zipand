"use server";

import { revalidatePath } from "next/cache";
import { consumeAiCredit } from "@/lib/ai/credits";
import { matchPropertiesForDraft } from "@/lib/ai/match-properties";
import { phoneFromFilename } from "@/lib/ai/phone";
import { resolveAiProvider } from "@/lib/ai/provider";
import { runBriefingComment } from "@/lib/ai/run-briefing";
import { runClauseSuggestions } from "@/lib/ai/run-clauses";
import { runConsultationFromAudio } from "@/lib/ai/run-consult";
import { runAdCopy, runLocationDraft } from "@/lib/ai/run-text";
import { runVisitOrganize, runVisitTranscribe } from "@/lib/ai/run-visit";
import type {
  ClauseSuggestion,
  ConsultationDraft,
  LocationDraft,
  PropertyMatch,
  VisitDraft,
} from "@/lib/ai/types";
import { getSession } from "@/lib/auth";
import { DEAL_TYPES } from "@/lib/constants";
import { FormError } from "@/lib/errors";
import { str, toErrorMessage } from "@/lib/form";
import { isPropertyPath } from "@/lib/storage";

const AUDIO_MAX = 25 * 1024 * 1024;

function audioMime(fileName: string) {
  const n = fileName.toLowerCase();
  if (n.endsWith(".m4a") || n.endsWith(".mp4")) return "audio/mp4";
  if (n.endsWith(".wav")) return "audio/wav";
  if (n.endsWith(".webm")) return "audio/webm";
  if (n.endsWith(".amr")) return "audio/amr";
  if (n.endsWith(".ogg")) return "audio/ogg";
  return "audio/mpeg";
}

async function loadAudioBytes(
  supabase: Awaited<ReturnType<typeof getSession>>["supabase"],
  bucket: "consultation-audio" | "visit-audio",
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
    const mime = audioMime(audioName);
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

export type VisitTranscribeResult = { ok: true; transcript: string } | { ok: false; error: string };
export type VisitOrganizeResult = { ok: true; draft: VisitDraft } | { ok: false; error: string };

/** 임장 음성 → 받아쓰기만 */
export async function transcribeVisitAudio(
  propertyId: string,
  audioPath: string,
  audioName: string
): Promise<VisitTranscribeResult> {
  try {
    const { supabase, office } = await getSession();
    if (!isPropertyPath(audioPath, office.id, propertyId)) {
      throw new FormError("녹음 파일 경로가 올바르지 않아요.");
    }
    const ai = resolveAiProvider(office.ai_provider);
    await consumeAiCredit(supabase, office, 1);
    const bytes = await loadAudioBytes(supabase, "visit-audio", audioPath);
    const { transcript } = await runVisitTranscribe(ai, bytes, audioName || "visit.m4a", audioMime(audioName));
    if (!transcript) throw new FormError("받아쓴 내용이 없어요. 녹음 품질을 확인해 주세요.");
    return { ok: true, transcript };
  } catch (e) {
    return { ok: false, error: toErrorMessage(e) };
  }
}

/** 임장 음성 → 항목·체크리스트·메모 초안 */
export async function organizeVisitAudio(
  propertyId: string,
  audioPath: string,
  audioName: string
): Promise<VisitOrganizeResult> {
  try {
    const { supabase, office } = await getSession();
    if (!isPropertyPath(audioPath, office.id, propertyId)) {
      throw new FormError("녹음 파일 경로가 올바르지 않아요.");
    }
    const ai = resolveAiProvider(office.ai_provider);
    await consumeAiCredit(supabase, office, 1);
    const bytes = await loadAudioBytes(supabase, "visit-audio", audioPath);
    const draft = await runVisitOrganize(ai, bytes, audioName || "visit.m4a", audioMime(audioName));
    return { ok: true, draft };
  } catch (e) {
    return { ok: false, error: toErrorMessage(e) };
  }
}

export type BriefingCommentResult = { ok: true; comment: string } | { ok: false; error: string };

export async function suggestBriefingComment(propertyId: string): Promise<BriefingCommentResult> {
  try {
    const { supabase, office } = await getSession();
    const ai = resolveAiProvider(office.ai_provider);
    await consumeAiCredit(supabase, office, 1);

    const { data: property, error } = await supabase
      .from("properties")
      .select("title, deal_type, property_type, region, price, monthly_rent, area_m2, direction, description, highlights")
      .eq("id", propertyId)
      .single();
    if (error || !property) throw new FormError("매물을 찾을 수 없어요.");

    const { data: visit } = await supabase
      .from("property_visits")
      .select("follow_ups")
      .eq("property_id", propertyId)
      .order("visited_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const price =
      property.deal_type === "월세"
        ? `보증 ${property.price ?? "-"} / 월 ${property.monthly_rent ?? "-"}`
        : String(property.price ?? "-");

    const comment = await runBriefingComment(ai, {
      title: property.title,
      dealType: property.deal_type,
      propertyType: property.property_type,
      region: property.region ?? "",
      price,
      area: property.area_m2 != null ? String(property.area_m2) : "",
      direction: property.direction ?? "",
      description: property.description ?? "",
      highlights: (property.highlights ?? []).join(", "),
      followUps: (visit?.follow_ups ?? []).join("\n"),
    });
    if (!comment) throw new FormError("설명을 만들지 못했어요. 매물 정보를 조금 더 채운 뒤 다시 시도해 주세요.");
    return { ok: true, comment };
  } catch (e) {
    return { ok: false, error: toErrorMessage(e) };
  }
}

export type ClauseSuggestResult = { ok: true; suggestions: ClauseSuggestion[] } | { ok: false; error: string };

export async function suggestDealClauses(dealId: string): Promise<ClauseSuggestResult> {
  try {
    const { supabase, office } = await getSession();
    const ai = resolveAiProvider(office.ai_provider);
    await consumeAiCredit(supabase, office, 1);

    const { data: deal, error } = await supabase
      .from("deals")
      .select("id, stage, memo, prep_note, terms_note, loan_note, property:properties(title, deal_type)")
      .eq("id", dealId)
      .single();
    if (error || !deal) throw new FormError("거래를 찾을 수 없어요.");

    const { data: clauses } = await supabase.from("deal_clauses").select("body").eq("deal_id", dealId);
    const property = Array.isArray(deal.property) ? deal.property[0] : deal.property;

    const suggestions = await runClauseSuggestions(ai, {
      dealType: property?.deal_type ?? "",
      stage: deal.stage,
      propertyTitle: property?.title ?? "",
      notes: [deal.memo, deal.prep_note, deal.terms_note, deal.loan_note].filter(Boolean).join("\n"),
      existingClauses: (clauses ?? []).map((c) => c.body),
    });
    if (!suggestions.length) throw new FormError("추천할 특약을 찾지 못했어요. 거래 메모를 보강한 뒤 다시 시도해 주세요.");
    return { ok: true, suggestions };
  } catch (e) {
    return { ok: false, error: toErrorMessage(e) };
  }
}
