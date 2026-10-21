import "server-only";
import OpenAI from "openai";
import { FormError } from "@/lib/errors";

export function openaiClient(apiKey: string) {
  return new OpenAI({ apiKey });
}

export async function openaiTranscribe(apiKey: string, bytes: Buffer, fileName: string, mime: string) {
  const client = openaiClient(apiKey);
  const file = new File([new Uint8Array(bytes)], fileName, { type: mime || "audio/mpeg" });
  try {
    const result = await client.audio.transcriptions.create({
      model: "gpt-4o-mini-transcribe",
      file,
      language: "ko",
    });
    const text = typeof result === "object" && result && "text" in result ? String(result.text) : String(result);
    if (!text.trim()) throw new FormError("음성을 글자로 바꾸지 못했어요. 녹음 품질을 확인해 주세요.");
    return text.trim();
  } catch (e) {
    if (e instanceof FormError) throw e;
    const msg = e instanceof Error ? e.message : String(e);
    throw new FormError(`OpenAI 받아쓰기 실패: ${msg}`);
  }
}

export async function openaiJson<T>(apiKey: string, system: string, user: string): Promise<T> {
  const client = openaiClient(apiKey);
  try {
    const res = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });
    const raw = res.choices[0]?.message?.content;
    if (!raw) throw new FormError("AI 응답이 비어 있어요.");
    return JSON.parse(raw) as T;
  } catch (e) {
    if (e instanceof FormError) throw e;
    const msg = e instanceof Error ? e.message : String(e);
    throw new FormError(`OpenAI 요청 실패: ${msg}`);
  }
}
