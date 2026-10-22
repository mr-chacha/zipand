/**
 * TODO(문서 AI 추출): 당분간 문서 상세 UI에서 비활성.
 * extractDocumentFieldsAi → 이 모듈. UI 복구 시 document-review 참고.
 */
import "server-only";
import { geminiJsonFromFile, geminiJsonFromText } from "@/lib/ai/gemini";
import { openaiJson } from "@/lib/ai/openai";
import type { ResolvedAi } from "@/lib/ai/provider";
import type { DocumentAiField, DocumentAiSignal } from "@/lib/ai/types";
import { DOC_FIELD_PRESETS, SIGNAL_LEVELS, type DocType } from "@/lib/constants";
import { FormError } from "@/lib/errors";

type RawDoc = {
  fields?: unknown[];
  signals?: unknown[];
};

function normalize(raw: RawDoc): { fields: DocumentAiField[]; signals: DocumentAiSignal[] } {
  const fields: DocumentAiField[] = [];
  for (const f of raw.fields ?? []) {
    if (!f || typeof f !== "object") continue;
    const o = f as Record<string, unknown>;
    const label = String(o.label ?? "").trim();
    const value = String(o.value ?? "").trim();
    if (!label || !value) continue;
    fields.push({
      label,
      value,
      evidence_text: o.evidence_text != null ? String(o.evidence_text).trim() || null : null,
    });
  }
  const signals: DocumentAiSignal[] = [];
  for (const s of raw.signals ?? []) {
    if (!s || typeof s !== "object") continue;
    const o = s as Record<string, unknown>;
    const title = String(o.title ?? "").trim();
    if (!title) continue;
    const levelRaw = String(o.level ?? "확인 필요");
    const level = (SIGNAL_LEVELS as readonly string[]).includes(levelRaw)
      ? (levelRaw as DocumentAiSignal["level"])
      : "확인 필요";
    signals.push({
      level,
      title,
      description: o.description != null ? String(o.description).trim() || null : null,
      evidence_text: o.evidence_text != null ? String(o.evidence_text).trim() || null : null,
      next_action: o.next_action != null ? String(o.next_action).trim() || null : null,
    });
  }
  return { fields, signals };
}

function system(docType: string) {
  return `당신은 한국 부동산 공부서류(${docType}) 정리 도우미입니다.
원문에 있는 사실만 추출하고, 없으면 넣지 마세요. 법률 확정 판단을 하지 마세요.
evidence_text에는 근거가 되는 짧은 원문 구절을 넣으세요. JSON만 출력.`;
}

function userPrompt(docType: DocType, extra: string) {
  const presets = DOC_FIELD_PRESETS[docType] ?? DOC_FIELD_PRESETS.등기사항증명서;
  return `${extra}

추출 후보 라벨: ${presets.join(", ")}
확인 사항 level: ${SIGNAL_LEVELS.join("|")}

JSON:
{
  "fields": [{ "label": "", "value": "", "evidence_text": "" }],
  "signals": [{ "level": "확인 필요", "title": "", "description": "", "evidence_text": "", "next_action": "" }]
}`;
}

export async function runDocumentAiExtract(
  ai: ResolvedAi,
  input: { docType: DocType; fileName: string; mime: string; bytes: Buffer; textHint: string }
): Promise<{ fields: DocumentAiField[]; signals: DocumentAiSignal[] }> {
  const { docType, fileName, mime, bytes, textHint } = input;

  if (textHint.trim().length >= 80) {
    const prompt = userPrompt(docType, `문서 유형: ${docType}\n파일: ${fileName}\n\n원문 텍스트:\n${textHint.slice(0, 14000)}`);
    const raw =
      ai.provider === "openai"
        ? await openaiJson<RawDoc>(ai.openaiKey!, system(docType), prompt)
        : await geminiJsonFromText<RawDoc>(ai.geminiKey!, system(docType), prompt);
    return normalize(raw);
  }

  if (ai.provider === "gemini") {
    const raw = await geminiJsonFromFile<RawDoc>(
      ai.geminiKey!,
      system(docType),
      userPrompt(docType, `문서 유형: ${docType}\n파일: ${fileName}\n첨부 원문을 읽고 항목을 추출하세요.`),
      bytes,
      fileName,
      mime || "application/pdf"
    );
    return normalize(raw);
  }

  throw new FormError(
    "스캔·이미지 PDF는 Gemini 엔진에서 AI 추출할 수 있어요. 설정에서 Gemini를 고르거나, 텍스트 PDF로 올려 주세요."
  );
}
