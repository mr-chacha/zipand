import "server-only";
import { FormError } from "@/lib/errors";
import type { AiProviderId } from "@/lib/constants";

export type ResolvedAi = {
  provider: AiProviderId;
  openaiKey?: string;
  geminiKey?: string;
};

export function resolveAiProvider(officeProvider: string | null): ResolvedAi {
  const provider = officeProvider === "gemini" || officeProvider === "openai" ? officeProvider : null;
  if (!provider) {
    throw new FormError("설정 → AI·요금에서 AI 엔진(GPT 또는 제미나이)을 먼저 선택해 주세요.");
  }
  const openaiKey = process.env.OPENAI_API_KEY?.trim() || undefined;
  const geminiKey = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY)?.trim() || undefined;

  if (provider === "openai" && !openaiKey) {
    throw new FormError("OpenAI API 키가 없어요. .env.local에 OPENAI_API_KEY를 넣어 주세요.");
  }
  if (provider === "gemini" && !geminiKey) {
    throw new FormError("Gemini API 키가 없어요. .env.local에 GEMINI_API_KEY를 넣어 주세요.");
  }
  return { provider, openaiKey, geminiKey };
}
