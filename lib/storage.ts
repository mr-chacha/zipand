import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { randomUuid } from "@/lib/uuid";

export type Bucket =
  | "property-photos"
  | "property-videos"
  | "visit-audio"
  | "consultation-audio"
  | "documents"
  | "office-verification"
  | "office-docs";

/** 버킷 설정(supabase/migrations)과 맞춘 업로드 제한 */
export const MEDIA_LIMITS = {
  photo: { accept: "image/jpeg,image/png,image/webp,image/heic", maxBytes: 10 * 1024 * 1024, maxCount: 10 },
  video: { accept: "video/mp4,video/quicktime,video/webm", maxBytes: 50 * 1024 * 1024, maxCount: 5 },
} as const;

/** 같은 폴더({office_id}/{property_id 또는 customer_id}/)에 있는 경로만 허용한다 */
export function isPropertyPath(path: string, officeId: string, folderId: string) {
  return path.startsWith(`${officeId}/${folderId}/`) && !path.includes("..");
}

/**
 * 발급한 서명 URL을 재사용한다. 매번 새 토큰이 붙으면 URL이 달라져
 * 같은 사진도 브라우저 캐시를 못 쓰고 다시 내려받기 때문이다.
 * 경로는 RLS를 거친 조회 결과에서만 오므로 다른 사무소에 노출되지 않는다.
 */
const urlCache = new Map<string, { url: string; expiresAt: number }>();
const URL_CACHE_LIMIT = 5000;
/** 남은 유효시간이 이보다 짧으면 새로 발급한다 */
const MIN_REMAINING_MS = 15 * 60 * 1000;

function pruneUrlCache(now: number) {
  for (const [key, entry] of urlCache) {
    if (entry.expiresAt - now < MIN_REMAINING_MS) urlCache.delete(key);
  }
  while (urlCache.size > URL_CACHE_LIMIT) urlCache.delete(urlCache.keys().next().value!);
}

/** 비공개 버킷 파일의 서명 URL을 경로별로 반환 */
export async function signedUrls(
  supabase: SupabaseClient<Database>,
  bucket: Bucket,
  paths: string[],
  expiresIn = 60 * 60
): Promise<Record<string, string>> {
  if (paths.length === 0) return {};
  const now = Date.now();
  const map: Record<string, string> = {};
  const missing: string[] = [];
  for (const path of new Set(paths)) {
    const cached = urlCache.get(`${bucket}/${path}`);
    if (cached && cached.expiresAt - now >= MIN_REMAINING_MS) map[path] = cached.url;
    else missing.push(path);
  }
  if (missing.length === 0) return map;

  const { data } = await supabase.storage.from(bucket).createSignedUrls(missing, expiresIn);
  const expiresAt = now + expiresIn * 1000;
  data?.forEach((item) => {
    if (!item.path || !item.signedUrl) return;
    map[item.path] = item.signedUrl;
    urlCache.set(`${bucket}/${item.path}`, { url: item.signedUrl, expiresAt });
  });
  pruneUrlCache(now);
  return map;
}

export function buildStoragePath(officeId: string, propertyId: string, fileName: string) {
  const ext = fileName.includes(".") ? fileName.split(".").pop()!.toLowerCase() : "bin";
  return `${officeId}/${propertyId}/${randomUuid()}.${ext}`;
}
