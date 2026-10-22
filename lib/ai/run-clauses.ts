import "server-only";
import { geminiJsonFromText } from "@/lib/ai/gemini";
import { openaiJson } from "@/lib/ai/openai";
import type { ResolvedAi } from "@/lib/ai/provider";
import type { ClauseSuggestion } from "@/lib/ai/types";
import { CLAUSE_LIBRARY } from "@/lib/clauses";

export async function runClauseSuggestions(
  ai: ResolvedAi,
  input: {
    dealType: string;
    stage: string;
    propertyTitle: string;
    notes: string;
    existingClauses: string[];
  }
): Promise<ClauseSuggestion[]> {
  const library = CLAUSE_LIBRARY.map(
    (c) => `- [${c.id}] ${c.category}/${c.title}: ${c.premise} | body: ${c.body.slice(0, 120)}…`
  ).join("\n");

  const system = `당신은 한국 부동산 중개 특약 초안 도우미입니다.
라이브러리 특약을 우선 추천하고, 필요하면 짧은 초안을 만듭니다.
법률 확정·강제가 아니라 검토용 초안임을 전제로 합니다. JSON만 출력.`;

  const user = `거래: ${input.dealType} / 단계: ${input.stage}
매물: ${input.propertyTitle}
참고: ${input.notes || "(없음)"}
이미 있는 특약:
${input.existingClauses.length ? input.existingClauses.map((c, i) => `${i + 1}. ${c}`).join("\n") : "(없음)"}

라이브러리:
${library}

JSON:
{ "suggestions": [{ "title": "", "body": "특약 전문", "reason": "추천 이유 한 줄", "expert_review": false }] }
최대 5개. 이미 있는 특약과 중복하지 마세요. body는 계약서에 넣을 수 있는 완전한 문장.`;

  const raw =
    ai.provider === "openai"
      ? await openaiJson<{ suggestions?: unknown[] }>(ai.openaiKey!, system, user)
      : await geminiJsonFromText<{ suggestions?: unknown[] }>(ai.geminiKey!, system, user);

  const list = Array.isArray(raw.suggestions) ? raw.suggestions : [];
  const out: ClauseSuggestion[] = [];
  for (const s of list) {
    if (!s || typeof s !== "object") continue;
    const o = s as Record<string, unknown>;
    const body = String(o.body ?? "").trim();
    if (!body) continue;
    out.push({
      title: String(o.title ?? "추천 특약").trim() || "추천 특약",
      body,
      reason: String(o.reason ?? "").trim(),
      expert_review: Boolean(o.expert_review),
    });
    if (out.length >= 5) break;
  }
  return out;
}
