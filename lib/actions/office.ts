"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { FormError, str, toErrorMessage } from "@/lib/form";
import { searchRegistry, type RegistryOffice } from "@/lib/office-registry";
import type { ActionState } from "@/types";

export type RegistrySearchState = ActionState & { items?: RegistryOffice[]; total?: number; searched?: boolean };

export async function searchOfficeRegistry(_prev: RegistrySearchState | null, fd: FormData): Promise<RegistrySearchState> {
  const { profile } = await getSession();
  if (profile.role !== "owner") return { error: "사무소 등록은 대표만 할 수 있어요." };
  try {
    const name = str(fd, "name");
    const regNo = str(fd, "reg_no");
    const representative = str(fd, "representative");
    if (!name && !regNo && !representative) throw new FormError("사무소명, 개설등록번호, 대표자명 중 하나 이상 입력해 주세요.");
    const { items, total } = await searchRegistry({ name, regNo, representative });
    return { items, total, searched: true };
  } catch (e) {
    return { error: toErrorMessage(e) };
  }
}

/** 선택한 개설등록번호를 공공데이터에서 다시 조회해 확인된 정보로 사무소를 등록한다 */
export async function registerOffice(regNo: string, next: string | null): Promise<ActionState> {
  const { supabase, profile, office } = await getSession();
  if (profile.role !== "owner") return { error: "사무소 등록은 대표만 할 수 있어요." };
  try {
    const { items } = await searchRegistry({ regNo });
    const found = items.find((o) => o.regNo === regNo);
    if (!found) throw new FormError("공공데이터에서 해당 사무소를 찾지 못했어요. 다시 조회해 주세요.");
    const { error } = await supabase
      .from("offices")
      .update({
        name: found.name,
        registration_no: found.regNo,
        representative: found.representative,
        address: found.roadAddress ?? found.lotAddress,
        phone: office.phone ?? found.phone,
        registered_at: new Date().toISOString(),
        registry_data: found as unknown as never,
      })
      .eq("id", office.id);
    if (error) throw error;
  } catch (e) {
    return { error: toErrorMessage(e) };
  }
  revalidatePath("/", "layout");
  redirect(next && next.startsWith("/") && !next.startsWith("//") ? next : "/settings?tab=office");
}
