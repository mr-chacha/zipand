import { DEAL_TYPES, type DealType } from "@/lib/constants";
import type { ConsultationDraft } from "@/lib/ai/types";

type RawConsult = {
  name?: string | null;
  deal_type?: string | null;
  regions?: string | null;
  budget_min?: number | string | null;
  budget_max?: number | string | null;
  move_in_date?: string | null;
  must_have?: string | null;
  exclude?: string | null;
  memo?: string | null;
  summary?: string | null;
  sms_draft?: string | null;
  transcript_excerpt?: string | null;
};

function numOrNull(v: number | string | null | undefined): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(String(v).replace(/,/g, ""));
  return Number.isFinite(n) ? Math.round(n) : null;
}

function strOrNull(v: string | null | undefined) {
  const t = v?.trim();
  return t ? t : null;
}

export function normalizeConsultationDraft(
  raw: RawConsult,
  phoneFromFile: string | null,
  provider: string
): ConsultationDraft {
  const deal = strOrNull(raw.deal_type);
  const deal_type = deal && (DEAL_TYPES as readonly string[]).includes(deal) ? (deal as DealType) : null;
  let move_in_date = strOrNull(raw.move_in_date);
  if (move_in_date && !/^\d{4}-\d{2}-\d{2}$/.test(move_in_date)) move_in_date = null;

  return {
    name: strOrNull(raw.name),
    phone: phoneFromFile,
    deal_type,
    regions: strOrNull(raw.regions),
    budget_min: numOrNull(raw.budget_min),
    budget_max: numOrNull(raw.budget_max),
    move_in_date,
    must_have: strOrNull(raw.must_have),
    exclude: strOrNull(raw.exclude),
    memo: strOrNull(raw.memo),
    summary: strOrNull(raw.summary) ?? "요약을 만들지 못했어요.",
    sms_draft: strOrNull(raw.sms_draft) ?? "",
    transcript_excerpt: strOrNull(raw.transcript_excerpt),
    provider,
  };
}

export const CONSULT_SYSTEM = `당신은 한국 공인중개사 사무소의 상담 기록 도우미입니다.
통화 내용을 바탕으로 고객 관리 필드 초안만 만듭니다. 추측하지 말고, 통화에 없는 항목은 null로 둡니다.
법률·계약 확정 표현을 쓰지 마세요. 반드시 JSON만 출력하세요.`;

export function consultUserPrompt(extra: string) {
  return `${extra}

다음 JSON 스키마로만 답하세요:
{
  "name": "고객 호칭/이름 또는 null",
  "deal_type": "매매|전세|월세|null",
  "regions": "희망 지역 쉼표 구분 또는 null",
  "budget_min": 만원단위정수또는null,
  "budget_max": 만원단위정수또는null,
  "move_in_date": "YYYY-MM-DD 또는 null",
  "must_have": "필수 조건 또는 null",
  "exclude": "제외 조건 또는 null",
  "memo": "기타 메모 또는 null",
  "summary": "상담 요약 3~8문장",
  "sms_draft": "고객에게 보낼 짧은 문자 초안(존댓말)",
  "transcript_excerpt": "핵심 발화 2~5줄 또는 null"
}
예산은 한국 부동산 관행상 만원 단위 정수로 환산하세요(예: 5억 → 50000).`;
}
