import { FormError, toErrorMessage } from "@/lib/errors";
import { createClient } from "@/lib/supabase/client";
import { buildStoragePath, type Bucket } from "@/lib/storage";

/** 브라우저에서 Storage로 직접 업로드 (서버 액션 본문 크기 제한 회피). folderId는 매물 또는 고객 id */
export async function uploadToStorage(bucket: Bucket, officeId: string, folderId: string, file: File) {
  const supabase = createClient();
  const path = buildStoragePath(officeId, folderId, file.name);
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    contentType: file.type || undefined,
    upsert: false,
  });
  if (error) throw new FormError(toErrorMessage(error));
  return path;
}

/** 업로드 도중 실패했을 때 이미 올라간 파일 정리 */
export async function removeFromStorage(bucket: Bucket, paths: string[]) {
  if (!paths.length) return;
  await createClient().storage.from(bucket).remove(paths);
}
