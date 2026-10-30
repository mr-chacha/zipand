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


function recoverBuildingUse(fields: DocumentAiField[]): DocumentAiField[] {
  const use = fields.find((field) => field.label === "주용도");
  const structure = fields.find((field) => field.label === "주구조");
  if (!use || !structure) return fields;
  const missing = !use.value || use.value === "확인 필요";
  if (!missing) return fields;

  const source = `${structure.evidence_text ?? ""} ${structure.value ?? ""}`;
  const match = source.match(/주용도\s*([가-힣A-Za-z0-9()·\/\-\s]+?)(?=\s*주구조|$)/);
  const recovered = match?.[1]?.trim();
  if (!recovered) return fields;

  return fields.map((field) =>
    field.label === "주용도"
      ? {
          ...field,
          value: recovered,
          evidence_text: structure.evidence_text ?? `주용도 ${recovered}`,
          page: field.page ?? structure.page,
          confidence: Math.max(field.confidence, Math.min(structure.confidence, 90)),
        }
      : field
  );
}

function normalize(raw: RawDoc, docType: DocType): { fields: DocumentAiField[]; signals: DocumentAiSignal[] } {
  const presetLabels = DOC_FIELD_PRESETS[docType] ?? [];
  const allowedLabels = new Set(presetLabels);
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
  fields.sort((a, b) => presetLabels.indexOf(a.label) - presetLabels.indexOf(b.label));
  if (docType === "등기사항증명서" || docType === "건축물대장" || docType === "부동산종합공부") {
    const byLabel = new Map(fields.map((field) => [field.label, field]));
    let normalized = presetLabels.map(
      (label) =>
        byLabel.get(label) ?? {
          label,
          value: "확인 필요",
          evidence_text: null,
          page: null,
          confidence: 0,
        }
    );
    if (docType === "건축물대장") normalized = recoverBuildingUse(normalized);
    return { fields: normalized, signals: [] };
  }
  return { fields, signals };
}

function system(docType: string) {
  const documentRules =
    docType === "등기사항증명서"
      ? `
등기사항증명서는 표제부·갑구·을구를 끝까지 읽고 접수번호와 말소 표시를 내부적으로 대조하세요.
현재 유효한 소유권 및 소유권 외 권리만 정리하세요.
말소되었거나 말소사항 포함본에만 남은 권리를 현재 유효한 권리처럼 적지 마세요.
fields에는 반드시 다음 9개 라벨만 사용하고 이 순서로 작성하세요:
1. 등기요약
2. 소재지
3. 갑구의 등기목적
4. 갑구의 등기원인
5. 갑구의 권리자 및 기타사항
6. 을구의 등기목적
7. 을구의 등기원인
8. 을구의 권리자 및 기타사항
9. 등기열람 날짜
순위번호는 어느 값에도 적지 마세요. signals는 반드시 빈 배열로 반환하세요.
"등기요약"은 현재 소유자, 갑구의 유효한 처분제한, 을구의 유효한 권리와 채권최고액을 간결하게 요약하세요.
갑구와 을구에 현재 유효한 사항이 여러 개면 같은 라벨의 value 안에서 줄바꿈으로 구분하세요.
"갑구의 등기원인"과 "을구의 등기원인"에는 원문 등기원인 칸의 원인일자와 원인명을 반드시 함께 적으세요. 날짜를 생략하고 "매매", "설정계약"처럼 원인명만 적으면 안 됩니다. 예: "2026년 1월 27일 매매", "2026년 3월 13일 설정계약".
"을구의 권리자 및 기타사항"은 가장 중요한 항목입니다. 현재 유효한 권리마다 채권최고액, 채무자, 근저당권자 또는 해당 권리자를 원문 그대로 빠짐없이 적으세요.
원문에 해당 구가 없거나 유효한 사항이 없다고 명시된 경우에만 "해당 사항 없음"으로 적고, 판독이 불명확하면 "확인 필요"로 적으세요.
"등기열람 날짜"는 문서에 표시된 열람일시 또는 발급일을 적고 시간까지 있으면 함께 적으세요.
권리의 우선순위나 법적 효력을 추정하지 마세요.`
      : docType === "건축물대장"
        ? `
건축물대장 원문 전체를 읽고 지정된 항목만 추출하세요. 등기부등본의 표제부·갑구·을구 용어는 쓰지 마세요.
fields에는 반드시 다음 9개 라벨만 사용하고 이 순서로 작성하세요:
1. 소재지
2. 주용도
3. 주구조
4. 면적
5. 연면적
6. 용적률
7. 건폐율
8. 사용승인일자
9. 위반건축물 여부
signals는 반드시 빈 배열로 반환하세요.
"주용도", "주구조", "연면적", "용적률", "건폐율", "사용승인일자", "위반건축물 여부"는 건물 공통 항목입니다. 원문 표의 해당 칸 값을 그대로 쓰세요.
매물 동·호가 주어지면 "면적"만 해당 동·호 전용면적을 우선하세요. 해당 동·호 면적을 못 찾으면 문서에 있는 대표 전용면적을 쓰고, 판독이 불명확하면 "확인 필요"로 적으세요.
동·호별 칸이 없다고 해서 "주용도"를 "확인 필요"로 비우지 마세요.
건축물대장 표에서 "주용도"는 "주구조" 바로 왼쪽입니다. 예: "주용도 공동주택(아파트) 주구조 철근콘크리트벽식구조".
"주구조"를 찾았다면 같은 행·같은 근거 문구의 "주용도"도 반드시 채우세요.
"면적"은 전용면적(㎡)을 적으세요.
"사용승인일자"는 원문 날짜를 그대로 적으세요.
"위반건축물 여부"는 원문 표시를 기준으로 "해당 없음", "위반" 등으로 적으세요.
용도지역·용도지구·용도구역, 허가일, 발급일, 건축면적은 추출하지 마세요.`
        : docType === "부동산종합공부"
          ? `
부동산종합공부(일사편리·KRAS 통합 열람 등) 원문에서 지정된 항목만 추출하세요.
fields에는 반드시 다음 7개 라벨만 사용하고 이 순서로 작성하세요:
1. 토지 소재지
2. 토지 지목
3. 토지 면적
4. 개별공시지가
5. 건축물 건폐율
6. 건축물 용적률
7. 용도지역
signals는 반드시 빈 배열로 반환하세요.
"토지 소재지"는 토지 소재지·대지위치 등 주소 칸 값을 그대로 적으세요.
"토지 지목"은 지목(대, 전, 답 등)을 적으세요.
"토지 면적"은 토지(필지) 면적(㎡)을 적으세요. 건축 연면적·전용면적과 혼동하지 마세요.
"개별공시지가"는 원/㎡ 단위로 원문 그대로 적으세요.
"건축물 건폐율", "건축물 용적률"은 건축물 기본정보 칸의 건폐율·용적률(%)을 적으세요.
"용도지역"은 토지이용계획 탭·칸의 지역·지구 지정(예: 제3종일반주거지역, 준주거지역)을 적으세요. 여러 개면 줄바꿈 또는 · 로 구분하세요.
소유자, 주용도, 구조, 발급일, 건축면적, 연면적은 추출하지 마세요.
원문에 없으면 "확인 필요"로 적으세요.`
          : docType === "토지이용계획확인서"
            ? `
용도지역, 용도지구, 용도구역과 문서에 명시된 행위제한·도시계획 관련 확인 사항을 원문 기준으로 추출하세요.
건축물의 구조·주용도나 등기 권리관계를 추정하지 마세요.`
            : docType === "토지대장"
              ? `
지목, 면적, 소유자, 발급일을 원문 그대로 추출하고 변동 이력과 현재 값이 섞이지 않게 구분하세요.`
              : `
확인설명서에 옮길 수 있는 프리셋 항목만 원문 그대로 추출하고 다른 서류의 내용을 추정하지 마세요.`;

  return `당신은 한국 부동산 공부서류(${docType}) 정리 도우미입니다.
원문에 있는 사실만 추출하고, 없으면 넣지 마세요. 법률 확정 판단을 하지 마세요.
evidence_text에는 결과를 직접 뒷받침하는 짧고 정확한 원문 구절을 넣으세요.
confidence는 원문이 해당 결과를 얼마나 명확하게 뒷받침하는지 0~100 정수로 표시하세요.
page는 근거가 있는 PDF 쪽 번호이며 알 수 없으면 null로 표시하세요.${documentRules}
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
  input: {
    docType: DocType;
    fileName: string;
    mime: string;
    bytes: Buffer;
    textHint: string;
    propertyBuilding?: string | null;
    propertyUnit?: string | null;
  }
): Promise<{ fields: DocumentAiField[]; signals: DocumentAiSignal[] }> {
  const { docType, fileName, mime, bytes, textHint, propertyBuilding, propertyUnit } = input;
  const dong = propertyBuilding?.trim() ?? "";
  const ho = propertyUnit?.trim() ?? "";
  const unitHint =
    docType === "건축물대장"
      ? dong || ho
        ? `대상 매물 동·호: ${[dong && `${dong}동`, ho && `${ho}호`].filter(Boolean).join(" ")}\n면적은 해당 동·호 전용면적을 우선하고, 주용도·주구조·연면적·용적률·건폐율·사용승인일자는 건물 공통 칸 값을 사용하세요.`
        : "대상 매물 동·호가 없습니다. 원문의 건물 공통 칸(주용도·주구조 등)과 대표 면적을 추출하세요."
      : "";

  // Gemini는 복잡한 등기의 전체 페이지·말소 표시를 직접 대조하게 원본 PDF를 우선 전달한다.
  if (docType === "등기사항증명서" && ai.provider === "gemini") {
    try {
      const raw = await geminiJsonFromFile<RawDoc>(
        ai.geminiKey!,
        system(docType),
        userPrompt(docType, `문서 유형: ${docType}\n파일: ${fileName}\n첨부 원문의 모든 페이지를 읽고 현재 유효한 권리를 중심으로 정리하세요.`),
        bytes,
        fileName,
        mime || "application/pdf"
      );
      return normalize(raw, docType);
    } catch (fileError) {
      // 인터넷등기소의 보호·특수 인코딩 PDF는 Gemini 문서 입력이 400으로 거부될 수 있다.
      // PDF 텍스트를 읽을 수 있으면 같은 기준으로 텍스트 분석을 자동 재시도한다.
      if (textHint.trim().length < 80) throw fileError;
      const raw = await geminiJsonFromText<RawDoc>(
        ai.geminiKey!,
        system(docType),
        userPrompt(
          docType,
          `문서 유형: ${docType}\n파일: ${fileName}\nPDF 원문 첨부를 읽지 못해 추출 텍스트로 분석합니다.\n\n원문 텍스트:\n${textHint.slice(0, 60_000)}`
        )
      );
      return normalize(raw, docType);
    }
  }

  if (textHint.trim().length >= 80) {
    const maxTextLength =
      docType === "등기사항증명서" || docType === "건축물대장" || docType === "부동산종합공부" ? 60_000 : 14_000;
    const prompt = userPrompt(
      docType,
      `문서 유형: ${docType}\n파일: ${fileName}${unitHint ? `\n${unitHint}` : ""}\n\n원문 텍스트:\n${textHint.slice(0, maxTextLength)}`
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
      userPrompt(
        docType,
        `문서 유형: ${docType}\n파일: ${fileName}${unitHint ? `\n${unitHint}` : ""}\n첨부 원문을 읽고 항목을 추출하세요.`
      ),
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
