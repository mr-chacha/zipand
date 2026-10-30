import "server-only";
import { GoogleGenAI } from "@google/genai";
import { FormError } from "@/lib/errors";

const FLASH = process.env.GEMINI_MODEL?.trim() || "gemini-3.5-flash-lite";

function mimeFor(fileName: string, fallback: string) {
  const ext = fileName.split(".").pop()?.toLowerCase();
  const map: Record<string, string> = {
    m4a: "audio/mp4",
    mp4: "audio/mp4",
    mp3: "audio/mpeg",
    mpeg: "audio/mpeg",
    wav: "audio/wav",
    webm: "audio/webm",
    amr: "audio/amr",
    ogg: "audio/ogg",
    aac: "audio/aac",
    pdf: "application/pdf",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
  };
  return (ext && map[ext]) || fallback || "audio/mp4";
}

export async function geminiJsonFromText<T>(apiKey: string, system: string, user: string): Promise<T> {
  try {
    const client = new GoogleGenAI({ apiKey });
    const result = await client.interactions.create({
      model: FLASH,
      system_instruction: system,
      input: user,
      response_format: { type: "text", mime_type: "application/json" },
    });
    const raw = result.output_text ?? "";
    if (!raw.trim()) throw new FormError("AI 응답이 비어 있어요.");
    return parseJson<T>(raw);
  } catch (e) {
    if (e instanceof FormError) throw e;
    const msg = e instanceof Error ? e.message : String(e);
    throw new FormError(`Gemini 요청 실패: ${msg}`);
  }
}

/** 오디오 + 지시로 JSON 한 번에 (받아쓰기·추출) */
export async function geminiJsonFromAudio<T>(
  apiKey: string,
  system: string,
  user: string,
  bytes: Buffer,
  fileName: string,
  mime: string
): Promise<T> {
  try {
    const client = new GoogleGenAI({ apiKey });
    const result = await client.interactions.create({
      model: FLASH,
      system_instruction: system,
      input: [
        { type: "text", text: user },
        {
          type: "audio",
          data: bytes.toString("base64"),
          mime_type: mimeFor(fileName, mime),
        },
      ],
      response_format: { type: "text", mime_type: "application/json" },
    });
    const raw = result.output_text ?? "";
    if (!raw.trim()) throw new FormError("음성을 이해하지 못했어요. 녹음 품질을 확인해 주세요.");
    return parseJson<T>(raw);
  } catch (e) {
    if (e instanceof FormError) throw e;
    const msg = e instanceof Error ? e.message : String(e);
    throw new FormError(`Gemini 오디오 요청 실패: ${msg}`);
  }
}

/** PDF·이미지 등 파일을 첨부해 JSON 추출 */
export async function geminiJsonFromFile<T>(
  apiKey: string,
  system: string,
  user: string,
  bytes: Buffer,
  fileName: string,
  mime: string
): Promise<T> {
  try {
    const mimeType = mimeFor(fileName, mime);
    const input =
      mimeType === "application/pdf"
        ? {
            type: "document" as const,
            data: bytes.toString("base64"),
            mime_type: mimeType,
          }
        : {
            type: "image" as const,
            data: bytes.toString("base64"),
            mime_type: mimeType,
          };
    const client = new GoogleGenAI({ apiKey });
    const result = await client.interactions.create({
      model: FLASH,
      system_instruction: system,
      input: [{ type: "text", text: user }, input],
      response_format: { type: "text", mime_type: "application/json" },
    });
    const raw = result.output_text ?? "";
    if (!raw.trim()) throw new FormError("문서에서 항목을 찾지 못했어요.");
    return parseJson<T>(raw);
  } catch (e) {
    if (e instanceof FormError) throw e;
    const msg = e instanceof Error ? e.message : String(e);
    throw new FormError(`Gemini 문서 요청 실패: ${msg}`);
  }
}

function parseJson<T>(raw: string): T {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");
  return JSON.parse(cleaned) as T;
}
