import "server-only";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { FormError } from "@/lib/errors";

const FLASH = "gemini-2.5-flash-lite";

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
