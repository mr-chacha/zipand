import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export type Bucket = "property-photos" | "property-videos" | "visit-audio" | "documents";

/** 버킷 설정(supabase/migrations)과 맞춘 업로드 제한 */
export const MEDIA_LIMITS = {
  photo: { accept: "image/jpeg,image/png,image/webp,image/heic", maxBytes: 10 * 1024 * 1024, maxCount: 20 },
  video: { accept: "video/mp4,video/quicktime,video/webm", maxBytes: 50 * 1024 * 1024, maxCount: 5 },
} as const;

/** 같은 매물 폴더({office_id}/{property_id}/)에 있는 경로만 허용한다 */
export function isPropertyPath(path: string, officeId: string, propertyId: string) {
  return path.startsWith(`${officeId}/${propertyId}/`) && !path.includes("..");
}

/** 비공개 버킷 파일의 서명 URL을 경로별로 반환 */
export async function signedUrls(
  supabase: SupabaseClient<Database>,
  bucket: Bucket,
  paths: string[],
  expiresIn = 60 * 60
): Promise<Record<string, string>> {
  if (paths.length === 0) return {};
  const { data } = await supabase.storage.from(bucket).createSignedUrls(paths, expiresIn);
  const map: Record<string, string> = {};
  data?.forEach((item) => {
    if (item.path && item.signedUrl) map[item.path] = item.signedUrl;
  });
  return map;
}

export function buildStoragePath(officeId: string, propertyId: string, fileName: string) {
  const ext = fileName.includes(".") ? fileName.split(".").pop()!.toLowerCase() : "bin";
  return `${officeId}/${propertyId}/${crypto.randomUUID()}.${ext}`;
}
