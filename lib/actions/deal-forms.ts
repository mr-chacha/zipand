"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isAppRequest } from "@/lib/app-mode";
import { getSession } from "@/lib/auth";
import { getContractTemplate } from "@/lib/contract-templates";
import {
  DEAL_FORM_KINDS,
  buildDealFormDefaults,
  defaultTitle,
  formFieldKeys,
  newContractNo,
  readFormDataRecord,
  type DealFormKind,
} from "@/lib/deal-forms";
import { oneOf, requiredStr, str, toErrorMessage } from "@/lib/form";
import type { ActionState } from "@/types";
import type { Json } from "@/lib/supabase/database.types";

function revalidateFormPaths(dealId: string, formId?: string) {
  revalidatePath("/contracts/documents");
  revalidatePath(`/contracts/${dealId}`);
  revalidatePath(`/contracts/${dealId}/forms`);
  if (formId) revalidatePath(`/contracts/${dealId}/forms/${formId}`);
}

async function requireWebWrite() {
  if (await isAppRequest()) {
    throw new Error("서식 작성·수정은 웹에서만 할 수 있어요. 앱에서는 확정된 서식을 공유할 수 있어요.");
  }
}

async function loadPrefill(dealId: string) {
  const { supabase, profile, office } = await getSession();
  const { data: deal, error } = await supabase
    .from("deals")
    .select(
      "id, amount, monthly_rent, down_payment, balance_date, contract_date, move_in_date, lessor_name, lessor_phone, lessor_account, lessee_name, lessee_phone, terms_note, property:properties(title, address, deal_type, property_type)"
    )
    .eq("id", dealId)
    .single();
  if (error) throw error;
  const { data: clauses } = await supabase.from("deal_clauses").select("body").eq("deal_id", dealId).order("sort_order");
  const property = Array.isArray(deal.property) ? deal.property[0] : deal.property;
  return {
    supabase,
    profile,
    office,
    deal,
    prefill: {
      dealType: property?.deal_type ?? "매매",
      propertyTitle: property?.title ?? "",
      propertyAddress: property?.address ?? "",
      propertyType: property?.property_type ?? "",
      amount: deal.amount,
      monthlyRent: deal.monthly_rent,
      downPayment: deal.down_payment,
      balanceDate: deal.balance_date,
      contractDate: deal.contract_date,
      moveInDate: deal.move_in_date,
      lessorName: deal.lessor_name,
      lessorPhone: deal.lessor_phone,
      lessorAccount: deal.lessor_account,
      lesseeName: deal.lessee_name,
      lesseePhone: deal.lessee_phone,
      termsNote: deal.terms_note,
      clauses: (clauses ?? []).map((c) => c.body),
      officeName: office.name,
      officePhone: office.phone,
      officeAddress: office.address,
      agentName: profile.name,
      agentPhone: profile.phone,
    },
  };
}

/** 웹 전용: 서식 초안 생성 후 편집 화면으로 이동 */
export async function createDealForm(dealId: string, _prev: ActionState | null, fd: FormData): Promise<ActionState> {
  try {
    await requireWebWrite();
    const kind = oneOf(fd, "kind", DEAL_FORM_KINDS, "서식 종류") as DealFormKind;
    const { supabase, profile, prefill } = await loadPrefill(dealId);
    const title = str(fd, "title") || defaultTitle(kind, prefill.propertyTitle, prefill.propertyType);
    const data = buildDealFormDefaults(kind, prefill);
    if (kind === "contract" && !data.contract_no) data.contract_no = newContractNo();
    const { data: row, error } = await supabase
      .from("deal_forms")
      .insert({
        deal_id: dealId,
        kind,
        title,
        data: data as Json,
        created_by: profile.id,
      })
      .select("id")
      .single();
    if (error) throw error;
    revalidateFormPaths(dealId, row.id);
    redirect(`/contracts/${dealId}/forms/${row.id}`);
  } catch (e) {
    if (e && typeof e === "object" && "digest" in e) throw e;
    return { error: toErrorMessage(e) };
  }
}

/** 웹 전용: 초안 저장 */
export async function updateDealForm(formId: string, _prev: ActionState | null, fd: FormData): Promise<ActionState> {
  try {
    await requireWebWrite();
    const { supabase } = await getSession();
    const { data: form, error: readError } = await supabase.from("deal_forms").select("id, deal_id, kind, status").eq("id", formId).single();
    if (readError) throw readError;
    if (form.status === "finalized") throw new Error("확정된 서식은 수정할 수 없어요. 사본을 만들어 주세요.");

    const title = requiredStr(fd, "title", "제목");
    const data = readFormDataRecord(fd, formFieldKeys(form.kind as DealFormKind));
    const { error } = await supabase
      .from("deal_forms")
      .update({ title, data: data as Json, updated_at: new Date().toISOString() })
      .eq("id", formId);
    if (error) throw error;
    revalidateFormPaths(form.deal_id, formId);
    return { message: "서식을 저장했어요." };
  } catch (e) {
    return { error: toErrorMessage(e) };
  }
}

/** 웹 전용: 확정 (이후 수정 불가, 공유 가능) */
export async function finalizeDealForm(formId: string): Promise<ActionState> {
  try {
    await requireWebWrite();
    const { supabase } = await getSession();
    const { data: form, error: readError } = await supabase.from("deal_forms").select("id, deal_id, status, data, title").eq("id", formId).single();
    if (readError) throw readError;
    if (form.status === "finalized") return { message: "이미 확정된 서식이에요." };
    if (!form.title.trim()) throw new Error("제목을 입력해 주세요.");

    const { error } = await supabase
      .from("deal_forms")
      .update({ status: "finalized", finalized_at: new Date().toISOString() })
      .eq("id", formId);
    if (error) throw error;
    revalidateFormPaths(form.deal_id, formId);
    return { message: "서식을 확정했어요. 이제 임대인·임차인에게 공유할 수 있어요." };
  } catch (e) {
    return { error: toErrorMessage(e) };
  }
}

/** 웹 전용: 확정본을 초안 사본으로 복제 */
export async function duplicateDealForm(formId: string): Promise<ActionState & { id?: string }> {
  try {
    await requireWebWrite();
    const { supabase, profile } = await getSession();
    const { data: form, error: readError } = await supabase.from("deal_forms").select("*").eq("id", formId).single();
    if (readError) throw readError;
    const { data: row, error } = await supabase
      .from("deal_forms")
      .insert({
        deal_id: form.deal_id,
        kind: form.kind,
        title: `${form.title} (사본)`,
        status: "draft",
        data: form.data,
        created_by: profile.id,
      })
      .select("id")
      .single();
    if (error) throw error;
    revalidateFormPaths(form.deal_id, row.id);
    return { message: "사본을 만들었어요.", id: row.id };
  } catch (e) {
    return { error: toErrorMessage(e) };
  }
}

export async function deleteDealForm(formId: string): Promise<ActionState> {
  try {
    await requireWebWrite();
    const { supabase } = await getSession();
    const { data: form, error: readError } = await supabase.from("deal_forms").select("deal_id").eq("id", formId).single();
    if (readError) throw readError;
    const { error } = await supabase.from("deal_forms").delete().eq("id", formId);
    if (error) throw error;
    revalidateFormPaths(form.deal_id);
    return { message: "서식을 삭제했어요." };
  } catch (e) {
    return { error: toErrorMessage(e) };
  }
}

/** 확정 서식 공유 링크 (웹·앱 공통) */
export async function createDealFormShare(formId: string, days: number): Promise<ActionState & { token?: string }> {
  const { supabase, profile } = await getSession();
  const expireDays = [3, 7, 14, 30].includes(days) ? days : 14;
  try {
    const { data: form, error: readError } = await supabase
      .from("deal_forms")
      .select("id, deal_id, status")
      .eq("id", formId)
      .single();
    if (readError) throw readError;
    if (form.status !== "finalized") throw new Error("확정된 서식만 공유할 수 있어요.");

    const { data, error } = await supabase
      .from("deal_form_shares")
      .insert({
        deal_id: form.deal_id,
        form_id: formId,
        expires_at: new Date(Date.now() + expireDays * 86400000).toISOString(),
        created_by: profile.id,
      })
      .select("token")
      .single();
    if (error) throw error;
    revalidateFormPaths(form.deal_id, formId);
    return { message: "공유 링크를 만들었어요.", token: data.token };
  } catch (e) {
    return { error: toErrorMessage(e) };
  }
}

export async function deleteDealFormShare(id: string, formId: string, dealId: string): Promise<ActionState> {
  const { supabase } = await getSession();
  const { error } = await supabase.from("deal_form_shares").delete().eq("id", id);
  if (error) return { error: toErrorMessage(error) };
  revalidateFormPaths(dealId, formId);
  return { message: "공유 링크를 삭제했어요." };
}

/** 웹 전용: 계약서 관리 목록에서 여러 건 삭제 */
export async function deleteDealForms(ids: string[]): Promise<ActionState> {
  try {
    await requireWebWrite();
    if (!ids.length) return { error: "삭제할 서식을 선택해 주세요." };
    const { supabase } = await getSession();
    const { data: rows, error: readError } = await supabase.from("deal_forms").select("id, deal_id").in("id", ids);
    if (readError) throw readError;
    const { error } = await supabase.from("deal_forms").delete().in("id", ids);
    if (error) throw error;
    const dealIds = [...new Set((rows ?? []).map((r) => r.deal_id))];
    revalidatePath("/contracts/documents");
    for (const dealId of dealIds) revalidateFormPaths(dealId);
    return { message: `${ids.length}건을 삭제했어요.` };
  } catch (e) {
    return { error: toErrorMessage(e) };
  }
}

type CreateFormOptions = {
  kind?: DealFormKind;
  title?: string | null;
  /** lib/contract-templates 서식 id */
  templateId?: string | null;
};

/** 계약서 관리 목록용 생성 (거래·서식 선택 후 초안) — redirect 없이 id 반환 */
export async function createDealFormForDeal(
  dealId: string,
  kindOrOptions: DealFormKind | CreateFormOptions,
  title?: string | null
): Promise<ActionState & { id?: string }> {
  try {
    await requireWebWrite();
    const options: CreateFormOptions =
      typeof kindOrOptions === "string" ? { kind: kindOrOptions, title } : kindOrOptions;

    const template = options.templateId ? getContractTemplate(options.templateId) : null;
    if (options.templateId && !template) return { error: "선택한 계약서 서식을 찾을 수 없어요." };

    const kind = (template?.kind ?? options.kind) as DealFormKind | undefined;
    if (!kind || !DEAL_FORM_KINDS.includes(kind)) return { error: "서식 종류를 확인해 주세요." };

    const { supabase, profile, prefill } = await loadPrefill(dealId);
    if (template) {
      prefill.propertyType = template.propertyType;
      prefill.dealType = template.dealType;
    }
    const data = buildDealFormDefaults(kind, prefill);
    if (template) {
      data.template_id = template.id;
      data.property_type = template.propertyType;
      data.deal_type = template.dealType;
      data.template_title = template.title;
    }
    if (kind === "contract" && !data.contract_no) data.contract_no = newContractNo();

    const formTitle =
      options.title?.trim() ||
      template?.title ||
      defaultTitle(kind, prefill.propertyTitle, template?.propertyType ?? prefill.propertyType);

    const { data: row, error } = await supabase
      .from("deal_forms")
      .insert({
        deal_id: dealId,
        kind,
        title: formTitle,
        data: data as Json,
        created_by: profile.id,
      })
      .select("id")
      .single();
    if (error) throw error;
    revalidatePath("/contracts/documents");
    revalidateFormPaths(dealId, row.id);
    return { message: "초안을 만들었어요.", id: row.id };
  } catch (e) {
    return { error: toErrorMessage(e) };
  }
}
