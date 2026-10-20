"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { DEAL_TYPES, MAINTENANCE_STATUSES, PROPERTY_STATUSES, PROPERTY_TYPES, type PropertyStatus } from "@/lib/constants";
import { FormError, int, lines, num, oneOf, requiredStr, str, toErrorMessage } from "@/lib/form";
import { isPropertyPath, MEDIA_LIMITS } from "@/lib/storage";
import type { ActionState } from "@/types";

function readPropertyForm(fd: FormData) {
  const deal_type = oneOf(fd, "deal_type", DEAL_TYPES, "거래 유형");
  const availableMode = str(fd, "available_mode");
  const maintenanceStatus = MAINTENANCE_STATUSES.find((s) => s === str(fd, "maintenance_status")) ?? null;
  const maintenanceItems =
    maintenanceStatus === "있음"
      ? [
          ...new Set([
            ...fd.getAll("maintenance_items").map(String),
            ...(str(fd, "maintenance_custom") ?? "").split(",").map((s) => s.trim()),
          ]),
        ].filter(Boolean)
      : [];
  return {
    title: requiredStr(fd, "title", "매물명"),
    address: requiredStr(fd, "address", "주소"),
    region: str(fd, "region"),
    building: str(fd, "building"),
    unit: str(fd, "unit"),
    structure: str(fd, "structure"),
    main_use: str(fd, "main_use"),
    deal_type,
    property_type: oneOf(fd, "property_type", PROPERTY_TYPES, "매물 유형"),
    status: oneOf(fd, "status", PROPERTY_STATUSES, "상태"),
    price: int(fd, "price") ?? 0,
    monthly_rent: deal_type === "월세" ? int(fd, "monthly_rent") : null,
    maintenance_status: maintenanceStatus,
    maintenance_fee: maintenanceStatus === "있음" ? int(fd, "maintenance_fee") : null,
    maintenance_items: maintenanceItems,
    area_m2: num(fd, "area_m2"),
    floor: int(fd, "floor"),
    total_floors: int(fd, "total_floors"),
    direction: str(fd, "direction"),
    rooms: int(fd, "rooms"),
    baths: int(fd, "baths"),
    available_from: availableMode === "date" ? str(fd, "available_from") : null,
    available_negotiable: availableMode === "negotiable",
    manager_id: str(fd, "manager_id"),
    description: str(fd, "description"),
    highlights: lines(str(fd, "highlights")),
    internal_memo: str(fd, "internal_memo"),
    landlord_phone: str(fd, "landlord_phone"),
    caretaker_phone: str(fd, "caretaker_phone"),
    tenant_phone: str(fd, "tenant_phone"),
  };
}

export async function logPropertyEvent(propertyId: string, message: string) {
  const { supabase, profile } = await getSession();
  await supabase.from("property_events").insert({ property_id: propertyId, actor_id: profile.id, message });
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * 등록 폼에서 미리 올린 사진·동영상 경로. 브라우저가 매물 id를 먼저 만들고
 * Storage에 업로드한 뒤 경로만 넘긴다.
 */
function readMediaPaths(fd: FormData, key: string, officeId: string, propertyId: string) {
  return fd
    .getAll(key)
    .filter((v): v is string => typeof v === "string")
    .filter((path) => isPropertyPath(path, officeId, propertyId));
}

export async function createProperty(_prev: ActionState | null, fd: FormData): Promise<ActionState> {
  const { supabase, profile, office } = await getSession();
  const requestedId = str(fd, "id");
  const id = requestedId && UUID.test(requestedId) ? requestedId : crypto.randomUUID();
  const photoPaths = readMediaPaths(fd, "photo_paths", office.id, id);
  const videoPaths = readMediaPaths(fd, "video_paths", office.id, id);
  const videoNames = fd.getAll("video_names").map(String);
  const videoSizes = fd.getAll("video_sizes").map(Number);

  try {
    if (photoPaths.length > MEDIA_LIMITS.photo.maxCount) {
      throw new FormError(`사진은 매물당 최대 ${MEDIA_LIMITS.photo.maxCount}장까지 등록할 수 있어요.`);
    }
    const values = readPropertyForm(fd);
    const { error } = await supabase
      .from("properties")
      .insert({ ...values, id, manager_id: values.manager_id ?? profile.id, created_by: profile.id });
    if (error) throw error;

    if (photoPaths.length) {
      const { error: photoError } = await supabase
        .from("property_photos")
        .insert(photoPaths.map((storage_path, i) => ({ property_id: id, storage_path, sort_order: i })));
      if (photoError) throw photoError;
    }
    if (videoPaths.length) {
      const { error: videoError } = await supabase.from("property_videos").insert(
        videoPaths.map((storage_path, i) => ({
          property_id: id,
          storage_path,
          file_name: videoNames[i] ?? null,
          size_bytes: Number.isFinite(videoSizes[i]) ? videoSizes[i] : null,
          sort_order: i,
        }))
      );
      if (videoError) throw videoError;
    }

    const media = [photoPaths.length && `사진 ${photoPaths.length}장`, videoPaths.length && `동영상 ${videoPaths.length}개`]
      .filter(Boolean)
      .join(", ");
    await logPropertyEvent(id, media ? `매물 등록 (${media})` : "매물 등록");
  } catch (e) {
    await Promise.all([
      photoPaths.length && supabase.storage.from("property-photos").remove(photoPaths),
      videoPaths.length && supabase.storage.from("property-videos").remove(videoPaths),
    ]);
    return { error: toErrorMessage(e) };
  }
  revalidatePath("/", "layout");
  const next = str(fd, "redirect_to");
  redirect(next?.startsWith("/setup") ? next : `/properties/${id}`);
}

export async function updateProperty(id: string, _prev: ActionState | null, fd: FormData): Promise<ActionState> {
  const { supabase } = await getSession();
  try {
    const values = readPropertyForm(fd);
    const { error } = await supabase.from("properties").update(values).eq("id", id);
    if (error) throw error;
    await logPropertyEvent(id, "매물 정보 수정");
  } catch (e) {
    return { error: toErrorMessage(e) };
  }
  revalidatePath("/properties");
  redirect(`/properties/${id}`);
}

export async function updatePropertyStatus(id: string, status: PropertyStatus): Promise<ActionState> {
  const { supabase } = await getSession();
  if (!PROPERTY_STATUSES.includes(status)) return { error: "올바르지 않은 상태입니다." };
  const { error } = await supabase.from("properties").update({ status }).eq("id", id);
  if (error) return { error: toErrorMessage(error) };
  await logPropertyEvent(id, `상태 변경: ${status}`);
  revalidatePath(`/properties/${id}`);
  return { message: "상태를 변경했어요." };
}

export async function deleteProperty(id: string): Promise<ActionState> {
  const { supabase } = await getSession();

  const [photos, videos, docs, visits] = await Promise.all([
    supabase.from("property_photos").select("storage_path").eq("property_id", id),
    supabase.from("property_videos").select("storage_path").eq("property_id", id),
    supabase.from("documents").select("storage_path").eq("property_id", id),
    supabase.from("property_visits").select("audio_path").eq("property_id", id),
  ]);

  const { error } = await supabase.from("properties").delete().eq("id", id);
  if (error) return { error: toErrorMessage(error) };

  const photoPaths = photos.data?.map((p) => p.storage_path) ?? [];
  const videoPaths = videos.data?.map((v) => v.storage_path) ?? [];
  const docPaths = docs.data?.map((d) => d.storage_path) ?? [];
  const audioPaths = visits.data?.map((v) => v.audio_path).filter((p): p is string => Boolean(p)) ?? [];
  await Promise.all([
    photoPaths.length && supabase.storage.from("property-photos").remove(photoPaths),
    videoPaths.length && supabase.storage.from("property-videos").remove(videoPaths),
    docPaths.length && supabase.storage.from("documents").remove(docPaths),
    audioPaths.length && supabase.storage.from("visit-audio").remove(audioPaths),
  ]);

  revalidatePath("/properties");
  redirect("/properties");
}

export async function addPropertyPhotos(propertyId: string, paths: string[]): Promise<ActionState> {
  const { supabase } = await getSession();
  const { count } = await supabase
    .from("property_photos")
    .select("id", { count: "exact", head: true })
    .eq("property_id", propertyId);
  if ((count ?? 0) + paths.length > MEDIA_LIMITS.photo.maxCount) {
    await supabase.storage.from("property-photos").remove(paths);
    return { error: `사진은 매물당 최대 ${MEDIA_LIMITS.photo.maxCount}장까지 등록할 수 있어요.` };
  }

  const { error } = await supabase.from("property_photos").insert(
    paths.map((storage_path, i) => ({ property_id: propertyId, storage_path, sort_order: (count ?? 0) + i }))
  );
  if (error) {
    await supabase.storage.from("property-photos").remove(paths);
    return { error: toErrorMessage(error) };
  }
  await logPropertyEvent(propertyId, `사진 ${paths.length}장 추가`);
  revalidatePath(`/properties/${propertyId}`);
  return { message: "사진을 추가했어요." };
}

export async function deletePropertyPhoto(photoId: string): Promise<ActionState> {
  const { supabase } = await getSession();
  const { data: photo } = await supabase
    .from("property_photos")
    .select("storage_path, property_id")
    .eq("id", photoId)
    .single();
  if (!photo) return { error: "사진을 찾을 수 없습니다." };

  const { error } = await supabase.from("property_photos").delete().eq("id", photoId);
  if (error) return { error: toErrorMessage(error) };
  await supabase.storage.from("property-photos").remove([photo.storage_path]);
  revalidatePath(`/properties/${photo.property_id}`);
  return { message: "사진을 삭제했어요." };
}

export async function setCoverPhoto(photoId: string, propertyId: string): Promise<ActionState> {
  const { supabase } = await getSession();
  const { data: photos } = await supabase
    .from("property_photos")
    .select("id")
    .eq("property_id", propertyId)
    .order("sort_order")
    .order("created_at");
  if (!photos) return { error: "사진을 찾을 수 없습니다." };

  const ordered = [photoId, ...photos.map((p) => p.id).filter((id) => id !== photoId)];
  await Promise.all(
    ordered.map((id, i) => supabase.from("property_photos").update({ sort_order: i }).eq("id", id))
  );
  revalidatePath(`/properties/${propertyId}`);
  return { message: "대표 사진으로 지정했어요." };
}

export async function addPropertyVideos(
  propertyId: string,
  videos: { path: string; name: string; size: number }[]
): Promise<ActionState> {
  const { supabase, office } = await getSession();
  const valid = videos.filter((v) => isPropertyPath(v.path, office.id, propertyId));
  if (!valid.length) return { error: "추가할 동영상이 없어요." };

  const { count } = await supabase
    .from("property_videos")
    .select("id", { count: "exact", head: true })
    .eq("property_id", propertyId);
  const { error } = await supabase.from("property_videos").insert(
    valid.map((v, i) => ({
      property_id: propertyId,
      storage_path: v.path,
      file_name: v.name,
      size_bytes: v.size,
      sort_order: (count ?? 0) + i,
    }))
  );
  if (error) {
    await supabase.storage.from("property-videos").remove(valid.map((v) => v.path));
    return { error: toErrorMessage(error) };
  }
  await logPropertyEvent(propertyId, `동영상 ${valid.length}개 추가`);
  revalidatePath(`/properties/${propertyId}`);
  return { message: `동영상 ${valid.length}개를 추가했어요.` };
}

export async function deletePropertyVideo(videoId: string): Promise<ActionState> {
  const { supabase } = await getSession();
  const { data: video } = await supabase
    .from("property_videos")
    .select("storage_path, property_id")
    .eq("id", videoId)
    .single();
  if (!video) return { error: "동영상을 찾을 수 없어요." };

  const { error } = await supabase.from("property_videos").delete().eq("id", videoId);
  if (error) return { error: toErrorMessage(error) };
  await supabase.storage.from("property-videos").remove([video.storage_path]);
  await logPropertyEvent(video.property_id, "동영상 삭제");
  revalidatePath(`/properties/${video.property_id}`);
  return { message: "동영상을 삭제했어요." };
}
