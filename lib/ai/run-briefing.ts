import "server-only";
import { geminiJsonFromText } from "@/lib/ai/gemini";
import { openaiJson } from "@/lib/ai/openai";
import type { ResolvedAi } from "@/lib/ai/provider";

export async function runBriefingComment(
  ai: ResolvedAi,
  input: {
    title: string;
    dealType: string;
    propertyType: string;
    region: string;
    price: string;
    area: string;
    direction: string;
    description: string;
    highlights: string;
    followUps: string;
  }
): Promise<string> {
  const system = `당신은 공인중개사가 고객에게 보내는 매물 브리핑 설명을 돕는 도우미입니다.
확인된 정보만 쓰고, 과장·허위·확정 법률 표현을 쓰지 마세요. 존댓말로 2~5문장. JSON만 출력.`;
  const user = `매물:
제목: ${input.title}
거래/유형: ${input.dealType} / ${input.propertyType}
지역: ${input.region || "-"}
가격 요약: ${input.price || "-"}
면적: ${input.area || "-"} / 방향: ${input.direction || "-"}
기존 설명: ${input.description || "-"}
장점: ${input.highlights || "-"}
추가 확인: ${input.followUps || "-"}

JSON: { "comment": "고객용 중개사 설명" }`;

  const raw =
    ai.provider === "openai"
      ? await openaiJson<{ comment?: string }>(ai.openaiKey!, system, user)
      : await geminiJsonFromText<{ comment?: string }>(ai.geminiKey!, system, user);

  return String(raw.comment ?? "").trim();
}
