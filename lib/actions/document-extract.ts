"use server";

import { revalidatePath } from "next/cache";
import { consumeAiCredit } from "@/lib/ai/credits";
import { resolveAiProvider } from "@/lib/ai/provider";
import { runDocumentAiExtract } from "@/lib/ai/run-document";
import { getSession } from "@/lib/auth";
import { DOC_FIELD_PRESETS, type DocType } from "@/lib/constants";
import { extractPdfText } from "@/lib/doc-extract/pdf-text";
import { parseDocumentText } from "@/lib/doc-extract/parse";
import { FormError } from "@/lib/errors";
import { toErrorMessage } from "@/lib/form";
import type { ActionState } from "@/types";
import { logPropertyEvent } from "./properties";

function isPdf(fileName: string, mimeHint?: string | null) {
  const n = fileName.toLowerCase();
  if (n.endsWith(".pdf")) return true;
  return mimeHint === "application/pdf";
}

/**
 * 업로드된 공부서류 PDF에서 텍스트를 읽어 document_fields·signals를 채운다.
 * (규칙 기반 추출 — 스캔본/이미지 PDF는 실패할 수 있음)
 */
export async function extractDocumentFields(documentId: string): Promise<ActionState & { count?: number }> {
  const { supabase } = await getSession();
  const id = documentId.trim();
  if (!id) return { error: "문서가 없어요." };

  try {
    const { data: doc, error } = await supabase
      .from("documents")
      .select("id, doc_type, file_name, storage_path, property_id, issued_at")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    if (!doc) return { error: "문서를 찾을 수 없어요." };
    if (!isPdf(doc.file_name)) {
      return { error: "지금은 PDF만 자동 추출할 수 있어요. 이미지 스캔본은 항목을 직접 입력해 주세요." };
    }

    const { data: file, error: dlErr } = await supabase.storage.from("documents").download(doc.storage_path);
    if (dlErr || !file) throw dlErr ?? new Error("원문 파일을 받지 못했어요.");

    const text = await extractPdfText(await file.arrayBuffer());
    const parsed = parseDocumentText(doc.doc_type, text);
    if (!parsed.fields.length) {
      return {
        error:
          "글자를 거의 읽지 못했어요. 스캔·사진 PDF이거나 보호된 파일일 수 있어요. 문서 상세에서 항목을 직접 입력하거나, 세움터·인터넷등기소에서 받은 텍스트 PDF로 다시 올려 주세요.",
      };
    }

    const { data: existing } = await supabase
      .from("document_fields")
      .select("id, label")
      .eq("document_id", id);
    const have = new Set((existing ?? []).map((f) => f.label));

    // 등기사항증명서: 프리셋에 없는 과거 추출 항목(갑구 요약·접수·근저당 등)은 제거
    const allowed = new Set(DOC_FIELD_PRESETS[doc.doc_type as DocType] ?? []);
    if (allowed.size && doc.doc_type === "등기사항증명서") {
      const staleIds = (existing ?? []).filter((f) => !allowed.has(f.label)).map((f) => f.id);
      if (staleIds.length) {
        await supabase.from("document_fields").delete().in("id", staleIds);
        for (const f of existing ?? []) {
          if (!allowed.has(f.label)) have.delete(f.label);
        }
      }
    }

    const toInsert = parsed.fields
      .filter((f) => !have.has(f.label))
      .map((f) => ({
        document_id: id,
        label: f.label,
        value: f.value,
        evidence_text: f.evidence_text ?? null,
        page: null as number | null,
        reviewed: false,
      }));

    if (toInsert.length) {
      const { error: insErr } = await supabase.from("document_fields").insert(toInsert);
      if (insErr) throw insErr;
    }

    // 이미 있는 항목은 대장에서 다시 읽은 값으로 갱신(주용도·구조 등)
    const toRefresh = parsed.fields.filter((f) => have.has(f.label));
    for (const f of toRefresh) {
      await supabase
        .from("document_fields")
        .update({
          value: f.value,
          evidence_text: f.evidence_text ?? null,
          reviewed: false,
        })
        .eq("document_id", id)
        .eq("label", f.label);
    }

    if (parsed.signals.length) {
      const { data: sigExist } = await supabase
        .from("document_signals")
        .select("title")
        .eq("document_id", id);
      const sigHave = new Set((sigExist ?? []).map((s) => s.title));
      const sigRows = parsed.signals
        .filter((s) => !sigHave.has(s.title))
        .map((s) => ({
          document_id: id,
          level: s.level,
          title: s.title,
          description: s.description ?? null,
          evidence_text: s.evidence_text ?? null,
          next_action: s.next_action ?? null,
          page: null as number | null,
        }));
      if (sigRows.length) {
        const { error: sigErr } = await supabase.from("document_signals").insert(sigRows);
        if (sigErr) throw sigErr;
      }
    }

    const issuedField = parsed.fields.find((f) => f.label === "발급일");
    if (issuedField && !doc.issued_at) {
      const ymd = issuedField.value.match(/(\d{4})[.\-\/년]?(\d{1,2})[.\-\/월]?(\d{1,2})/);
      if (ymd) {
        const issuedAt = `${ymd[1]}-${ymd[2].padStart(2, "0")}-${ymd[3].padStart(2, "0")}`;
        await supabase.from("documents").update({ issued_at: issuedAt }).eq("id", id);
      }
    }

    if (doc.property_id) {
      const { data: prop } = await supabase
        .from("properties")
        .select("area_m2, structure, main_use")
        .eq("id", doc.property_id)
        .maybeSingle();

      if (prop) {
        const patch: { area_m2?: number; structure?: string; main_use?: string } = {};
        const areaField = parsed.fields.find((f) => f.label === "전용면적" || f.label === "면적");
        if (areaField && (prop.area_m2 == null || prop.area_m2 === 0)) {
          const n = Number(areaField.value.replace(/,/g, ""));
          if (Number.isFinite(n) && n > 0) patch.area_m2 = n;
        }
        // 건축물대장·종합공부: 해당 동 기준 구조·주용도를 매물에 저장(대장 값이 있으면 갱신)
        if (doc.doc_type === "건축물대장" || doc.doc_type === "부동산종합공부") {
          const structure = parsed.fields.find((f) => f.label === "구조")?.value?.trim();
          const mainUse = parsed.fields.find((f) => f.label === "주용도")?.value?.trim();
          if (structure) patch.structure = structure;
          if (mainUse) patch.main_use = mainUse;
        }
        if (Object.keys(patch).length) {
          await supabase.from("properties").update(patch).eq("id", doc.property_id);
          revalidatePath(`/properties/${doc.property_id}`);
          revalidatePath("/properties");
          revalidatePath("/contracts");
        }
      }
    }

    await supabase
      .from("documents")
      .update({ status: "검토 필요", reviewed_at: null, reviewed_by: null })
      .eq("id", id);

    await logPropertyEvent(doc.property_id, `${doc.doc_type} 자동 추출 (${toInsert.length}항목)`);
    revalidatePath(`/documents/${id}`);
    revalidatePath("/documents");

    const changed = toInsert.length + toRefresh.length;
    const msg =
      changed === 0
        ? "인식된 항목이 없어요. 스캔본이면 직접 입력해 주세요."
        : toRefresh.length > 0 && toInsert.length > 0
          ? `${toInsert.length}개 추가·${toRefresh.length}개 갱신했어요(주용도·구조 포함). 값을 검토해 주세요.`
          : toRefresh.length > 0
            ? `${toRefresh.length}개 항목을 갱신했어요(주용도·구조 포함). 값을 검토해 주세요.`
            : `${toInsert.length}개 항목을 추가했어요. 값을 검토·확인한 뒤 검토 완료해 주세요.`;

    return { message: msg, count: changed };
  } catch (e) {
    return { error: toErrorMessage(e) };
  }
}

/**
 * AI로 공부서류 항목·확인 사항을 추출한다.
 * 텍스트 PDF는 규칙 추출이 약한 경우에도 LLM으로 보강하고, 스캔본은 Gemini 파일 첨부로 시도한다.
 *
 * TODO(문서 AI 추출): 당분간 UI에서 비활성(규칙 기반 「자동 추출」만 노출).
 * 다시 켤 때 document-review의 AI 추출 버튼·AiAccessBadge를 복구하고 이 액션을 연결한다.
 * 구현 본체는 lib/ai/run-document.ts 에 유지.
 */
export async function extractDocumentFieldsAi(documentId: string): Promise<ActionState & { count?: number }> {
  const { supabase, office } = await getSession();
  const id = documentId.trim();
  if (!id) return { error: "문서가 없어요." };

  try {
    const { data: doc, error } = await supabase
      .from("documents")
      .select("id, doc_type, file_name, storage_path, property_id, issued_at")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    if (!doc) return { error: "문서를 찾을 수 없어요." };

    const ai = resolveAiProvider(office.ai_provider);
    await consumeAiCredit(supabase, office, 1);

    const { data: file, error: dlErr } = await supabase.storage.from("documents").download(doc.storage_path);
    if (dlErr || !file) throw dlErr ?? new FormError("원문 파일을 받지 못했어요.");
    const arrayBuf = await file.arrayBuffer();
    const bytes = Buffer.from(arrayBuf);
    if (bytes.byteLength > 20 * 1024 * 1024) throw new FormError("AI 추출은 20MB 이하 파일만 가능해요.");

    let textHint = "";
    if (isPdf(doc.file_name)) {
      try {
        textHint = await extractPdfText(arrayBuf);
      } catch {
        textHint = "";
      }
    }

    const mime = isPdf(doc.file_name)
      ? "application/pdf"
      : doc.file_name.toLowerCase().endsWith(".png")
        ? "image/png"
        : "image/jpeg";

    const parsed = await runDocumentAiExtract(ai, {
      docType: doc.doc_type as DocType,
      fileName: doc.file_name,
      mime,
      bytes,
      textHint,
    });

    if (!parsed.fields.length && !parsed.signals.length) {
      return { error: "AI가 항목을 찾지 못했어요. 원문을 대조해 직접 입력해 주세요." };
    }

    const { data: existing } = await supabase.from("document_fields").select("label").eq("document_id", id);
    const have = new Set((existing ?? []).map((f) => f.label));

    const toInsert = parsed.fields
      .filter((f) => !have.has(f.label))
      .map((f) => ({
        document_id: id,
        label: f.label,
        value: f.value,
        evidence_text: f.evidence_text,
        page: null as number | null,
        reviewed: false,
      }));

    if (toInsert.length) {
      const { error: insErr } = await supabase.from("document_fields").insert(toInsert);
      if (insErr) throw insErr;
    }

    for (const f of parsed.fields.filter((x) => have.has(x.label))) {
      await supabase
        .from("document_fields")
        .update({ value: f.value, evidence_text: f.evidence_text, reviewed: false })
        .eq("document_id", id)
        .eq("label", f.label);
    }

    if (parsed.signals.length) {
      const { data: sigExist } = await supabase.from("document_signals").select("title").eq("document_id", id);
      const sigHave = new Set((sigExist ?? []).map((s) => s.title));
      const sigRows = parsed.signals
        .filter((s) => !sigHave.has(s.title))
        .map((s) => ({
          document_id: id,
          level: s.level,
          title: s.title,
          description: s.description,
          evidence_text: s.evidence_text,
          next_action: s.next_action,
          page: null as number | null,
        }));
      if (sigRows.length) {
        const { error: sigErr } = await supabase.from("document_signals").insert(sigRows);
        if (sigErr) throw sigErr;
      }
    }

    await supabase.from("documents").update({ status: "검토 필요", reviewed_at: null, reviewed_by: null }).eq("id", id);
    await logPropertyEvent(doc.property_id, `${doc.doc_type} AI 추출 (${toInsert.length}항목)`);
    revalidatePath(`/documents/${id}`);
    revalidatePath("/documents");

    return {
      message: `AI로 ${toInsert.length || parsed.fields.length}개 항목을 채웠어요. 원문과 대조한 뒤 검토 완료해 주세요.`,
      count: toInsert.length || parsed.fields.length,
    };
  } catch (e) {
    return { error: toErrorMessage(e) };
  }
}
