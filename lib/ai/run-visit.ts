import "server-only";
import { geminiJsonFromAudio } from "@/lib/ai/gemini";
import { openaiJson, openaiTranscribe } from "@/lib/ai/openai";
import type { ResolvedAi } from "@/lib/ai/provider";
import type { VisitDraft, VisitFieldDraft } from "@/lib/ai/types";
import { DEFAULT_VISIT_CHECKLIST, VISIT_FIELD_LABELS } from "@/lib/constants";

const SYSTEM = `당신은 한국 공인중개사 임장(현장 방문) 기록 도우미입니다.
현장 음성 메모를 바탕으로 임장 항목 초안만 만듭니다. 통화에 없는 내용은 빈 문자열·빈 배열로 둡니다.
법률·계약 확정 표현을 쓰지 마세요. 반드시 JSON만 출력하세요.`;

function visitUserPrompt(extra: string) {
  return `${extra}

허용 항목 라벨(가능하면 이 중에서): ${VISIT_FIELD_LABELS.join(", ")}
체크리스트 후보: ${DEFAULT_VISIT_CHECKLIST.join(", ")}

JSON:
{
  "transcript": "받아쓰기 전문 또는 핵심 받아쓰기",
  "fields": [{ "label": "방향", "value": "남향" }],
  "checklist_ok": ["수압 확인"],
  "follow_ups": ["임대인에게 입주 가능일 서면 확인"],
  "memo": "내부용 짧은 메모"
}
checklist_ok는 이상 없음을 확인한 항목만. follow_ups는 고객 브리핑에 보여줄 추가 확인 사항.`;
}

function normalizeVisit(raw: Record<string, unknown>, provider: string): VisitDraft {
  const fieldsRaw = Array.isArray(raw.fields) ? raw.fields : [];
  const fields: VisitFieldDraft[] = [];
  for (const f of fieldsRaw) {
    if (!f || typeof f !== "object") continue;
    const label = String((f as { label?: unknown }).label ?? "").trim();
    const value = String((f as { value?: unknown }).value ?? "").trim();
    if (!label || !value) continue;
    fields.push({ label, value });
  }

  const checklist = Array.isArray(raw.checklist_ok)
    ? raw.checklist_ok.map((x) => String(x).trim()).filter(Boolean)
    : [];
  const follow_ups = Array.isArray(raw.follow_ups)
    ? raw.follow_ups.map((x) => String(x).trim()).filter(Boolean)
    : [];

  return {
    transcript: String(raw.transcript ?? "").trim(),
    fields,
    checklist_ok: checklist,
    follow_ups,
    memo: String(raw.memo ?? "").trim(),
    provider,
  };
}

export async function runVisitTranscribe(
  ai: ResolvedAi,
  bytes: Buffer,
  fileName: string,
  mime: string
): Promise<{ transcript: string; provider: string }> {
  if (ai.provider === "openai") {
    const transcript = await openaiTranscribe(ai.openaiKey!, bytes, fileName, mime);
    return { transcript, provider: "openai" };
  }
  const raw = await geminiJsonFromAudio<{ transcript?: string }>(
    ai.geminiKey!,
    "음성 받아쓰기만 수행합니다. JSON만 출력하세요.",
    '첨부 음성을 한국어로 받아쓰세요. JSON: { "transcript": "전문" }',
    bytes,
    fileName,
    mime
  );
  return { transcript: String(raw.transcript ?? "").trim(), provider: "gemini" };
}

export async function runVisitOrganize(
  ai: ResolvedAi,
  bytes: Buffer,
  fileName: string,
  mime: string
): Promise<VisitDraft> {
  if (ai.provider === "openai") {
    const transcript = await openaiTranscribe(ai.openaiKey!, bytes, fileName, mime);
    const raw = await openaiJson<Record<string, unknown>>(
      ai.openaiKey!,
      SYSTEM,
      visitUserPrompt(`임장 음성 받아쓰기:\n${transcript.slice(0, 12000)}`)
    );
    const draft = normalizeVisit(raw, "openai");
    if (!draft.transcript) draft.transcript = transcript;
    return draft;
  }

  const raw = await geminiJsonFromAudio<Record<string, unknown>>(
    ai.geminiKey!,
    SYSTEM,
    visitUserPrompt("첨부 임장 음성 메모를 듣고 필드를 채우세요."),
    bytes,
    fileName,
    mime
  );
  return normalizeVisit(raw, "gemini");
}
