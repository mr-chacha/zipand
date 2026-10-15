"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { normalizeBusinessNo, validateBusiness } from "@/lib/business-registry";
import { FormError, requiredStr, str, toErrorMessage } from "@/lib/form";
import { findRegistryOffice, searchRegistry, type RegistryOffice } from "@/lib/office-registry";
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

/** 조회로 확인되지 않는 사무소: 업로드한 등록증·사업자등록증으로 관리자 심사를 신청한다 */
export async function submitOfficeVerification(_prev: ActionState | null, fd: FormData): Promise<ActionState> {
  const { supabase, profile, office } = await getSession();
  if (profile.role !== "owner") return { error: "사무소 등록은 대표만 할 수 있어요." };
  try {
    if (office.registered_at) throw new FormError("이미 등록된 사무소예요.");
    const licensePath = requiredStr(fd, "license_doc_path", "중개사무소 등록증");
    const businessPath = requiredStr(fd, "business_doc_path", "사업자등록증");
    if (![licensePath, businessPath].every((p) => p.startsWith(`${office.id}/`))) {
      throw new FormError("파일 업로드 경로가 올바르지 않아요. 다시 시도해 주세요.");
    }
    const businessNo = str(fd, "business_no");
    const { error } = await supabase.from("office_verification_requests").insert({
      office_name: requiredStr(fd, "office_name", "사무소명"),
      registration_no: str(fd, "registration_no"),
      business_no: businessNo ? normalizeBusinessNo(businessNo) : null,
      license_doc_path: licensePath,
      business_doc_path: businessPath,
    });
    if (error) throw error;
  } catch (e) {
    return { error: toErrorMessage(e) };
  }
  revalidatePath("/", "layout");
  return { message: "서류를 제출했어요. 관리자가 확인 후 사무소 등록을 완료해 드릴게요." };
}

/** 등록된 사무소(개설등록·사업자 인증)를 취소한다. 다른 사무소로 다시 등록할 때 사용 */
export async function unregisterOffice(): Promise<ActionState> {
  const { supabase, profile } = await getSession();
  if (profile.role !== "owner") return { error: "사무소 등록 취소는 대표만 할 수 있어요." };
  const { error } = await supabase.rpc("unregister_office");
  if (error) return { error: toErrorMessage(error) };
  revalidatePath("/", "layout");
  return { message: "사무소 등록을 취소했어요. 우리 사무소를 다시 조회해 등록해 주세요." };
}

/**
 * 사무소 등록(인증).
 * 1) 개설등록번호를 공공데이터에서 다시 조회 → 2) 입력한 사업자등록번호·개업일자와 개설등록 대표자명을 국세청 진위확인
 * → 3) 둘 다 통과하면 서버 비밀값으로 register_office RPC 호출 (DB는 RPC로만 등록 상태를 바꿀 수 있다)
 */
export async function registerOffice(_prev: ActionState | null, fd: FormData): Promise<ActionState> {
  const { supabase, profile, office } = await getSession();
  if (profile.role !== "owner") return { error: "사무소 등록은 대표만 할 수 있어요." };
  if (office.registered_at) return { error: "이미 등록된 사무소예요. 다른 사무소로 바꾸려면 등록을 먼저 취소해 주세요." };
  const next = str(fd, "next");
  try {
    const regNo = requiredStr(fd, "reg_no", "개설등록번호");
    const businessNo = normalizeBusinessNo(requiredStr(fd, "business_no", "사업자등록번호"));
    if (businessNo.length !== 10) throw new FormError("사업자등록번호 10자리를 입력해 주세요.");
    const startDigits = requiredStr(fd, "start_date", "개업일자").replace(/\D/g, "");
    if (startDigits.length !== 8) throw new FormError("개업일자를 8자리(예: 2020-01-31)로 입력해 주세요.");
    const startDate = `${startDigits.slice(0, 4)}-${startDigits.slice(4, 6)}-${startDigits.slice(6)}`;

    const found = await findRegistryOffice(regNo);
    if (!found.representative) {
      throw new FormError("공공데이터에 대표자명이 없어 확인할 수 없어요. 고객센터로 문의해 주세요.");
    }

    const check = await validateBusiness({ businessNo, startDate, representative: found.representative });
    if (!check.valid) {
      throw new FormError(
        `사업자등록정보가 확인되지 않았어요. 사업자등록번호·개업일자가 맞는지, 사업자등록증의 대표자가 개설등록 대표자(${found.representative})와 같은지 확인해 주세요.`
      );
    }
    if (check.statusCode === "03") throw new FormError("폐업한 사업자로 확인돼 등록할 수 없어요.");

    const secret = process.env.OFFICE_REGISTRATION_SECRET;
    if (!secret) throw new FormError("사무소 등록 설정이 완료되지 않았어요. 관리자에게 문의해 주세요.");

    const { error } = await supabase.rpc("register_office", {
      p_secret: secret,
      p_registration_no: found.regNo,
      p_name: found.name,
      p_representative: found.representative,
      p_address: found.roadAddress ?? found.lotAddress ?? "",
      p_phone: str(fd, "phone") ?? found.phone ?? "",
      p_business_no: businessNo,
      p_registry: { ...found, businessStatus: check.status, businessStartDate: startDate, verifiedAt: new Date().toISOString() },
    });
    if (error) throw error;
  } catch (e) {
    return { error: toErrorMessage(e) };
  }
  revalidatePath("/", "layout");
  redirect(next && next.startsWith("/") && !next.startsWith("//") ? next : "/settings?tab=office");
}
