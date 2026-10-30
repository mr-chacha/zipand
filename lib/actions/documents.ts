"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { DOC_TYPES, SIGNAL_LEVELS, type DocType } from "@/lib/constants";
import { int, oneOf, requiredStr, str, toErrorMessage } from "@/lib/form";
import type { ActionState } from "@/types";
import { logPropertyEvent } from "./properties";

interface NewDocument {
  propertyId: string;
  docType: DocType;
  fileName: string;
  storagePath: string;
  fileSize: number;
  issuedAt: string | null;
}

export async function createDocument(input: NewDocument): Promise<ActionState & { id?: string }> {
  const { supabase, profile } = await getSession();
  if (!DOC_TYPES.includes(input.docType)) return { error: "문서 종류를 선택해 주세요." };

  const { data, error } = await supabase
    .from("documents")
    .insert({
      property_id: input.propertyId,
      doc_type: input.docType,
      file_name: input.fileName,
      storage_path: input.storagePath,
      file_size: input.fileSize,
      issued_at: input.issuedAt,
      uploaded_by: profile.id,
    })
    .select("id")
    .single();
  if (error) {
    await supabase.storage.from("documents").remove([input.storagePath]);
    return { error: toErrorMessage(error) };
  }
  await logPropertyEvent(input.propertyId, `${input.docType} 업로드`);
  revalidatePath("/documents");
  revalidatePath(`/properties/${input.propertyId}`);

  return { message: "업로드했어요. 서류 목록에서 선택한 뒤 AI 추출을 실행해 주세요.", id: data.id };
}

export async function deleteDocument(id: string): Promise<ActionState> {
  const { supabase } = await getSession();
  const { data: doc } = await supabase.from("documents").select("storage_path, property_id").eq("id", id).single();
  if (!doc) return { error: "문서를 찾을 수 없습니다." };
  const { error } = await supabase.from("documents").delete().eq("id", id);
  if (error) return { error: toErrorMessage(error) };
  await supabase.storage.from("documents").remove([doc.storage_path]);
  revalidatePath("/documents");
  revalidatePath(`/properties/${doc.property_id}`);
  redirect("/documents");
}

export async function updateDocumentIssuedAt(id: string, issuedAt: string | null): Promise<ActionState> {
  const { supabase } = await getSession();
  const { error } = await supabase.from("documents").update({ issued_at: issuedAt || null }).eq("id", id);
  if (error) return { error: toErrorMessage(error) };
  revalidatePath(`/documents/${id}`);
  return { message: "발급일을 저장했어요." };
}

async function markNeedsReview(documentId: string) {
  const { supabase } = await getSession();
  await supabase
    .from("documents")
    .update({
      status: "검토 필요",
      extraction_status: "검토 필요",
      reviewed_at: null,
      reviewed_by: null,
    })
    .eq("id", documentId);
}

export async function addDocumentField(documentId: string, _prev: ActionState | null, fd: FormData): Promise<ActionState> {
  const { supabase } = await getSession();
  try {
    const { error } = await supabase.from("document_fields").insert({
      document_id: documentId,
      label: requiredStr(fd, "label", "항목명"),
      value: requiredStr(fd, "value", "값"),
      page: int(fd, "page"),
      evidence_text: str(fd, "evidence_text"),
    });
    if (error) throw error;
    await markNeedsReview(documentId);
  } catch (e) {
    return { error: toErrorMessage(e) };
  }
  revalidatePath(`/documents/${documentId}`);
  return { message: "항목을 추가했어요." };
}

export async function setFieldReviewed(fieldId: string, documentId: string, reviewed: boolean): Promise<ActionState> {
  const { supabase } = await getSession();
  const { error } = await supabase.from("document_fields").update({ reviewed }).eq("id", fieldId);
  if (error) return { error: toErrorMessage(error) };
  if (!reviewed) await markNeedsReview(documentId);
  // 체크는 클라이언트에서 낙관적 반영 — 전체 페이지 revalidate는 생략(체감 지연 방지)
  return {};
}

export async function setAllFieldsReviewed(documentId: string, reviewed: boolean): Promise<ActionState> {
  const { supabase } = await getSession();
  const { error } = await supabase.from("document_fields").update({ reviewed }).eq("document_id", documentId);
  if (error) return { error: toErrorMessage(error) };
  if (!reviewed) await markNeedsReview(documentId);
  return {};
}

export async function deleteDocumentField(fieldId: string, documentId: string): Promise<ActionState> {
  const { supabase } = await getSession();
  const { error } = await supabase.from("document_fields").delete().eq("id", fieldId);
  if (error) return { error: toErrorMessage(error) };
  await markNeedsReview(documentId);
  revalidatePath(`/documents/${documentId}`);
  return { message: "항목을 삭제했어요." };
}

export async function updateDocumentField(
  fieldId: string,
  documentId: string,
  _prev: ActionState | null,
  fd: FormData
): Promise<ActionState> {
  const { supabase } = await getSession();
  try {
    const { error } = await supabase
      .from("document_fields")
      .update({
        label: requiredStr(fd, "label", "항목명"),
        value: requiredStr(fd, "value", "값"),
        page: int(fd, "page"),
        evidence_text: str(fd, "evidence_text"),
        confidence: null,
        ai_generated: false,
        reviewed: false,
      })
      .eq("id", fieldId)
      .eq("document_id", documentId);
    if (error) throw error;
    await markNeedsReview(documentId);
  } catch (e) {
    return { error: toErrorMessage(e) };
  }
  revalidatePath(`/documents/${documentId}`);
  return { message: "추출 항목을 수정했어요. 원문과 다시 대조해 주세요." };
}

export async function addDocumentSignal(documentId: string, _prev: ActionState | null, fd: FormData): Promise<ActionState> {
  const { supabase } = await getSession();
  try {
    const { error } = await supabase.from("document_signals").insert({
      document_id: documentId,
      level: oneOf(fd, "level", SIGNAL_LEVELS, "중요도"),
      title: requiredStr(fd, "title", "제목"),
      description: str(fd, "description"),
      page: int(fd, "page"),
      evidence_text: str(fd, "evidence_text"),
      next_action: str(fd, "next_action"),
    });
    if (error) throw error;
    await markNeedsReview(documentId);
  } catch (e) {
    return { error: toErrorMessage(e) };
  }
  revalidatePath(`/documents/${documentId}`);
  return { message: "확인 사항을 추가했어요." };
}

export async function deleteDocumentSignal(signalId: string, documentId: string): Promise<ActionState> {
  const { supabase } = await getSession();
  const { error } = await supabase.from("document_signals").delete().eq("id", signalId);
  if (error) return { error: toErrorMessage(error) };
  await markNeedsReview(documentId);
  revalidatePath(`/documents/${documentId}`);
  return { message: "확인 사항을 삭제했어요." };
}

export async function setSignalReviewed(
  signalId: string,
  documentId: string,
  reviewed: boolean
): Promise<ActionState> {
  const { supabase } = await getSession();
  const { error } = await supabase.from("document_signals").update({ reviewed }).eq("id", signalId);
  if (error) return { error: toErrorMessage(error) };
  if (!reviewed) await markNeedsReview(documentId);
  return {};
}

export async function completeReview(documentId: string): Promise<ActionState> {
  const { supabase, profile } = await getSession();
  const { count } = await supabase
    .from("document_fields")
    .select("id", { count: "exact", head: true })
    .eq("document_id", documentId)
    .eq("reviewed", false);
  if (count) return { error: `확인하지 않은 항목이 ${count}개 있어요.` };

  const { count: signalCount } = await supabase
    .from("document_signals")
    .select("id", { count: "exact", head: true })
    .eq("document_id", documentId)
    .eq("reviewed", false);
  if (signalCount) return { error: `확인하지 않은 확인 사항이 ${signalCount}개 있어요.` };

  const { data: doc, error } = await supabase
    .from("documents")
    .update({
      status: "검토 완료",
      extraction_status: "추출 완료",
      reviewed_by: profile.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", documentId)
    .select("property_id, doc_type")
    .single();
  if (error) return { error: toErrorMessage(error) };
  await logPropertyEvent(doc.property_id, `${doc.doc_type} 검토 완료`);
  revalidatePath(`/documents/${documentId}`);
  revalidatePath("/documents");
  return { message: "검토를 완료했어요." };
}

export async function reopenReview(documentId: string): Promise<ActionState> {
  await markNeedsReview(documentId);
  revalidatePath(`/documents/${documentId}`);
  revalidatePath("/documents");
  return { message: "다시 검토 필요 상태로 바꿨어요." };
}
