import "server-only";
import { CONSULT_SYSTEM, consultUserPrompt, normalizeConsultationDraft } from "@/lib/ai/consult-parse";
import { geminiJsonFromAudio } from "@/lib/ai/gemini";
import { openaiJson, openaiTranscribe } from "@/lib/ai/openai";
import { phoneFromFilename } from "@/lib/ai/phone";
import type { ResolvedAi } from "@/lib/ai/provider";
import type { ConsultationDraft } from "@/lib/ai/types";

export async function runConsultationFromAudio(
  ai: ResolvedAi,
  bytes: Buffer,
  fileName: string,
  mime: string
): Promise<ConsultationDraft> {
  const phone = phoneFromFilename(fileName);

  if (ai.provider === "openai") {
    const transcript = await openaiTranscribe(ai.openaiKey!, bytes, fileName, mime);
    const raw = await openaiJson<Record<string, unknown>>(
      ai.openaiKey!,
      CONSULT_SYSTEM,
      consultUserPrompt(`통화 받아쓰기:\n${transcript.slice(0, 12000)}`)
    );
    const draft = normalizeConsultationDraft(raw, phone, "openai");
    if (!draft.transcript_excerpt) draft.transcript_excerpt = transcript.slice(0, 500);
    return draft;
  }

  const raw = await geminiJsonFromAudio<Record<string, unknown>>(
    ai.geminiKey!,
    CONSULT_SYSTEM,
    consultUserPrompt("첨부 통화 녹음을 듣고 필드를 채우세요."),
    bytes,
    fileName,
    mime
  );
  return normalizeConsultationDraft(raw, phone, "gemini");
}
