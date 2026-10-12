import { createClient } from "@/lib/supabase/client";
import { buildStoragePath, type Bucket } from "@/lib/storage";

/** 브라우저에서 Storage로 직접 업로드 (서버 액션 본문 크기 제한 회피) */
export async function uploadToStorage(bucket: Bucket, officeId: string, propertyId: string, file: File) {
  const supabase = createClient();
  const path = buildStoragePath(officeId, propertyId, file.name);
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    contentType: file.type || undefined,
    upsert: false,
  });
  if (error) {
    if (error.message.includes("mime type")) throw new Error("지원하지 않는 파일 형식입니다.");
    if (error.message.toLowerCase().includes("size")) throw new Error("파일 크기가 너무 큽니다.");
    throw new Error(error.message);
  }
  return path;
}
