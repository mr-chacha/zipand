import "server-only";
import { extractText, getDocumentProxy } from "unpdf";

/** PDF 바이트에서 텍스트 추출. 스캔(이미지) PDF는 빈 문자열이 될 수 있음. */
export async function extractPdfText(data: ArrayBuffer | Uint8Array): Promise<string> {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  if (bytes.byteLength === 0) return "";
  const pdf = await getDocumentProxy(bytes);
  const { text } = await extractText(pdf, { mergePages: true });
  return typeof text === "string" ? text : "";
}
