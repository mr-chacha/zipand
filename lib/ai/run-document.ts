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

function confidence(value: unknown) {
  const number = Math.round(Number(value));
  return Number.isFinite(number) ? Math.max(0, Math.min(100, number)) : 50;
}

function page(value: unknown) {
  const number = Math.round(Number(value));
  return Number.isFinite(number) && number > 0 ? number : null;
}

function normalize(raw: RawDoc, docType: DocType): { fields: DocumentAiField[]; signals: DocumentAiSignal[] } {
  const allowedLabels = new Set(DOC_FIELD_PRESETS[docType] ?? []);
  const seenLabels = new Set<string>();
  const fields: DocumentAiField[] = [];
  for (const f of raw.fields ?? []) {
    if (!f || typeof f !== "object") continue;
    const o = f as Record<string, unknown>;
    const label = String(o.label ?? "").trim();
    const value = String(o.value ?? "").trim();
    if (!label || !value || !allowedLabels.has(label) || seenLabels.has(label)) continue;
    seenLabels.add(label);
    fields.push({
      label,
      value,
      evidence_text: o.evidence_text != null ? String(o.evidence_text).trim() || null : null,
      page: page(o.page),
      confidence: confidence(o.confidence),
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
      page: page(o.page),
      confidence: confidence(o.confidence),
    });
  }
  return { fields, signals };
}

function system(docType: string) {
  const registryRules =
    docType === "등기사항증명서"
      ? `
등기사항증명서는 표제부·갑구·을구를 끝까지 읽고 순위번호, 접수번호, 말소 표시를 함께 대조하세요.
현재 유효한 소유권 및 소유권 외 권리를 중심으로 정리하되, 가압류·압류·가처분·경매개시·근저당권·전세권 등 계약 전에 확인할 권리는 signals에 빠뜨리지 마세요.
말소되었거나 말소사항 포함본에만 남은 권리를 현재 유효한 권리처럼 적지 마세요.
"AI 요약"은 소유자, 현재 유효한 제한물권·처분제한, 채권최고액 등 핵심을 5문장 이내로 요약하세요.
권리의 우선순위나 법적 효력을 추정하지 말고 불명확하면 반드시 "확인 필요"로 표시하세요.`
      : "";

  return `당신은 한국 부동산 공부서류(${docType}) 정리 도우미입니다.
원문에 있는 사실만 추출하고, 없으면 넣지 마세요. 법률 확정 판단을 하지 마세요.
evidence_text에는 결과를 직접 뒷받침하는 짧고 정확한 원문 구절을 넣으세요.
confidence는 원문이 해당 결과를 얼마나 명확하게 뒷받침하는지 0~100 정수로 표시하세요.
page는 근거가 있는 PDF 쪽 번호이며 알 수 없으면 null로 표시하세요.${registryRules}
JSON만 출력하세요.`;
}

function userPrompt(docType: DocType, extra: string) {
  const presets = DOC_FIELD_PRESETS[docType] ?? DOC_FIELD_PRESETS.등기사항증명서;
  return `${extra}

추출 후보 라벨: ${presets.join(", ")}
확인 사항 level: ${SIGNAL_LEVELS.join("|")}

JSON:
{
  "fields": [{ "label": "", "value": "", "evidence_text": "", "page": 1, "confidence": 90 }],
  "signals": [{ "level": "확인 필요", "title": "", "description": "", "evidence_text": "", "page": 1, "confidence": 90, "next_action": "" }]
}`;
}

export async function runDocumentAiExtract(
  ai: ResolvedAi,
  input: { docType: DocType; fileName: string; mime: string; bytes: Buffer; textHint: string }
): Promise<{ fields: DocumentAiField[]; signals: DocumentAiSignal[] }> {
  const { docType, fileName, mime, bytes, textHint } = input;

  // Gemini는 복잡한 등기의 전체 페이지·말소 표시를 직접 대조하게 원본 PDF를 우선 전달한다.
  if (docType === "등기사항증명서" && ai.provider === "gemini") {
    const raw = await geminiJsonFromFile<RawDoc>(
      ai.geminiKey!,
      system(docType),
      userPrompt(docType, `문서 유형: ${docType}\n파일: ${fileName}\n첨부 원문의 모든 페이지를 읽고 현재 유효한 권리를 중심으로 정리하세요.`),
      bytes,
      fileName,
      mime || "application/pdf"
    );
    return normalize(raw, docType);
  }

  if (textHint.trim().length >= 80) {
    const maxTextLength = docType === "등기사항증명서" ? 60_000 : 14_000;
    const prompt = userPrompt(
      docType,
      `문서 유형: ${docType}\n파일: ${fileName}\n\n원문 텍스트:\n${textHint.slice(0, maxTextLength)}`
    );
    const raw =
      ai.provider === "openai"
        ? await openaiJson<RawDoc>(ai.openaiKey!, system(docType), prompt)
        : await geminiJsonFromText<RawDoc>(ai.geminiKey!, system(docType), prompt);
    return normalize(raw, docType);
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
    return normalize(raw, docType);
  }

  throw new FormError(
    "스캔·이미지 PDF는 Gemini 엔진에서 AI 추출할 수 있어요. 설정에서 Gemini를 고르거나, 텍스트 PDF로 올려 주세요."
  );
}
