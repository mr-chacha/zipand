import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export type Bucket = "property-photos" | "visit-audio" | "documents";

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
