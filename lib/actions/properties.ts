"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { DEAL_TYPES, PROPERTY_STATUSES, PROPERTY_TYPES, type PropertyStatus } from "@/lib/constants";
import { int, lines, num, oneOf, requiredStr, str, toErrorMessage } from "@/lib/form";
import type { ActionState } from "@/types";

function readPropertyForm(fd: FormData) {
  const deal_type = oneOf(fd, "deal_type", DEAL_TYPES, "거래 유형");
  return {
    title: requiredStr(fd, "title", "매물명"),
    address: requiredStr(fd, "address", "주소"),
    region: str(fd, "region"),
    deal_type,
    property_type: oneOf(fd, "property_type", PROPERTY_TYPES, "매물 유형"),
    status: oneOf(fd, "status", PROPERTY_STATUSES, "상태"),
    price: int(fd, "price") ?? 0,
    monthly_rent: deal_type === "월세" ? int(fd, "monthly_rent") : null,
    maintenance_fee: int(fd, "maintenance_fee"),
    area_m2: num(fd, "area_m2"),
    floor: int(fd, "floor"),
    total_floors: int(fd, "total_floors"),
    direction: str(fd, "direction"),
    rooms: int(fd, "rooms"),
    baths: int(fd, "baths"),
    available_from: str(fd, "available_from"),
    manager_id: str(fd, "manager_id"),
    description: str(fd, "description"),
    highlights: lines(str(fd, "highlights")),
    internal_memo: str(fd, "internal_memo"),
  };
}

export async function logPropertyEvent(propertyId: string, message: string) {
  const { supabase, profile } = await getSession();
  await supabase.from("property_events").insert({ property_id: propertyId, actor_id: profile.id, message });
}

export async function createProperty(_prev: ActionState | null, fd: FormData): Promise<ActionState> {
  const { supabase, profile } = await getSession();
  let id: string;
  try {
    const values = readPropertyForm(fd);
    const { data, error } = await supabase
      .from("properties")
      .insert({ ...values, manager_id: values.manager_id ?? profile.id, created_by: profile.id })
      .select("id")
      .single();
    if (error) throw error;
    id = data.id;
    await logPropertyEvent(id, "매물 등록");
  } catch (e) {
    return { error: toErrorMessage(e) };
  }
  revalidatePath("/properties");
  redirect(`/properties/${id}`);
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

  const [photos, docs, visits] = await Promise.all([
    supabase.from("property_photos").select("storage_path").eq("property_id", id),
    supabase.from("documents").select("storage_path").eq("property_id", id),
    supabase.from("property_visits").select("audio_path").eq("property_id", id),
  ]);

  const { error } = await supabase.from("properties").delete().eq("id", id);
  if (error) return { error: toErrorMessage(error) };

  const photoPaths = photos.data?.map((p) => p.storage_path) ?? [];
  const docPaths = docs.data?.map((d) => d.storage_path) ?? [];
  const audioPaths = visits.data?.map((v) => v.audio_path).filter((p): p is string => Boolean(p)) ?? [];
  await Promise.all([
    photoPaths.length && supabase.storage.from("property-photos").remove(photoPaths),
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
