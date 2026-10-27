import "server-only";
import { GoogleGenerativeAI } from "@google/generative-ai";
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
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: FLASH,
    generationConfig: { responseMimeType: "application/json", temperature: 0.2 },
    systemInstruction: system,
  });
  try {
    const result = await model.generateContent(user);
    const raw = result.response.text();
    if (!raw.trim()) throw new FormError("AI 응답이 비어 있어요.");
    return JSON.parse(raw) as T;
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
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: FLASH,
    generationConfig: { responseMimeType: "application/json", temperature: 0.2 },
    systemInstruction: system,
  });
  try {
    const result = await model.generateContent([
      { text: user },
      {
        inlineData: {
          mimeType: mimeFor(fileName, mime),
          data: bytes.toString("base64"),
        },
      },
    ]);
    const raw = result.response.text();
    if (!raw.trim()) throw new FormError("음성을 이해하지 못했어요. 녹음 품질을 확인해 주세요.");
    return JSON.parse(raw) as T;
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
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: FLASH,
    generationConfig: { responseMimeType: "application/json", temperature: 0.1 },
    systemInstruction: system,
  });
  try {
    const result = await model.generateContent([
      { text: user },
      {
        inlineData: {
          mimeType: mimeFor(fileName, mime),
          data: bytes.toString("base64"),
        },
      },
    ]);
    const raw = result.response.text();
    if (!raw.trim()) throw new FormError("문서에서 항목을 찾지 못했어요.");
    return JSON.parse(raw) as T;
  } catch (e) {
    if (e instanceof FormError) throw e;
    const msg = e instanceof Error ? e.message : String(e);
    throw new FormError(`Gemini 문서 요청 실패: ${msg}`);
  }
}
