"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { isAppRequest } from "@/lib/app-mode";
import {
  inquireRegistryByAddress,
  inquireRegistrySelectAddress,
  withRegistryFileLabel,
  type RegistryAddressInput,
  type RegistryAddrCandidate,
  type RegistryRecordState,
  type RegistryRealtyType,
  type RegistrySuccess,
} from "@/lib/codef/registry";
import { hasCodefCredentials } from "@/lib/codef/config";
import { toErrorMessage } from "@/lib/form";
import { buildStoragePath, signedUrls } from "@/lib/storage";
import { createDocument } from "@/lib/actions/documents";

export type RegistryInquiryResult =
  | {
      ok: true;
      kind: "file";
      /** 서류함 저장 성공 시 id. 저장 실패·인라인 다운로드만 한 경우 없음 */
      documentId?: string;
      fileName: string;
      fileKind: "pdf";
      /** Storage 서명 URL 또는 data: URL */
      downloadUrl: string;
      /** 매물 미선택 시 매물 등록 전까지 임시 보관한 Storage 경로 */
      pendingStoragePath?: string;
      message?: string;
    }
  | {
      ok: true;
      kind: "choose_address";
      candidates: RegistryAddrCandidate[];
      twoWay: {
        jobIndex: number;
        threadIndex: number;
        jti: string;
        twoWayTimestamp: number;
        method?: string;
      };
      message: string;
    }
  | { ok: false; error: string };

function parseInput(fd: FormData): RegistryAddressInput & { propertyId: string; registryLabel: string } {
  const propertyId = String(fd.get("property_id") ?? "").trim();
  const realtyType = (String(fd.get("realty_type") ?? "1").trim() || "1") as RegistryRealtyType;
  if (!["0", "1", "2", "3"].includes(realtyType)) {
    throw new Error("부동산 구분이 올바르지 않습니다.");
  }
  const recordState = (String(fd.get("record_state") ?? "1").trim() || "1") as RegistryRecordState;
  if (recordState !== "0" && recordState !== "1") {
    throw new Error("등기기록 유형이 올바르지 않습니다.");
  }
  const addrSido = String(fd.get("addr_sido") ?? "").trim();
  const addrSigungu = String(fd.get("addr_sigungu") ?? "").trim();
  const addrRoadName = String(fd.get("addr_road_name") ?? "").trim();
  const addrBuildingNumber = String(fd.get("addr_building_number") ?? "").trim();
  if (!addrSido || !addrSigungu || !addrRoadName || !addrBuildingNumber) {
    throw new Error("시도·시군구·도로명·건물번호를 모두 입력해 주세요. 주소 검색을 이용해 주세요.");
  }
  const dong = String(fd.get("dong") ?? "").trim();
  const ho = String(fd.get("ho") ?? "").trim();
  if ((dong && !/^\d+$/.test(dong)) || (ho && !/^\d+$/.test(ho))) {
    throw new Error("동·호는 숫자만 입력해 주세요.");
  }
  const unitMode = String(fd.get("unit_mode") ?? "both");
  if (realtyType === "1") {
    if (!["both", "dong", "ho"].includes(unitMode)) {
      throw new Error("동·호 선택 방식이 올바르지 않습니다.");
    }
    if (unitMode === "both" && (!dong || !ho)) {
      throw new Error("동과 호를 모두 입력해 주세요.");
    }
    if (unitMode === "dong" && !dong) throw new Error("동을 입력해 주세요.");
    if (unitMode === "ho" && !ho) throw new Error("호를 입력해 주세요.");
  }
  const registryLabel = String(fd.get("registry_label") ?? "").trim();
  return {
    propertyId,
    addrSido,
    addrSigungu,
    addrRoadName,
    addrBuildingNumber,
    dong: dong || undefined,
    ho: ho || undefined,
    realtyType,
    recordState,
    registryLabel,
  };
}

async function saveFileToProperty(
  propertyId: string,
  file: Pick<RegistrySuccess, "fileName" | "fileBase64" | "contentType" | "fileKind">
) {
  const { supabase, profile, office } = await getSession();
  const buf = Buffer.from(file.fileBase64, "base64");

  if (buf.length < 100 || buf.subarray(0, 4).toString("utf8") !== "%PDF") {
    throw new Error(
      `PDF 데이터가 올바르지 않아요 (decoded ${buf.length}bytes). CODEF 응답을 확인해 주세요.`
    );
  }

  const path = buildStoragePath(office.id, propertyId, file.fileName);
  const contentType = "application/pdf";
  console.info("[codef-registry] upload start", {
    propertyId,
    fileName: file.fileName,
    fileKind: file.fileKind,
    contentType,
    bytes: buf.length,
    path,
  });

  const { error: upErr } = await supabase.storage.from("documents").upload(path, buf, {
    contentType,
    upsert: false,
  });
  if (upErr) throw upErr;

  const created = await createDocument({
    propertyId,
    docType: "등기사항증명서",
    fileName: file.fileName,
    storagePath: path,
    fileSize: buf.length,
    issuedAt: new Date().toISOString().slice(0, 10),
  });
  if (created.error || !created.id) {
    await supabase.storage.from("documents").remove([path]);
    throw new Error(created.error ?? "문서 저장에 실패했어요.");
  }

  const urls = await signedUrls(supabase, "documents", [path], 60 * 60);
  const downloadUrl = urls[path];
  if (!downloadUrl) {
    throw new Error("서류는 저장됐지만 다운로드 URL 발급에 실패했어요. 서류함에서 확인해 주세요.");
  }

  void profile;
  revalidatePath("/documents");
  revalidatePath(`/properties/${propertyId}`);
  revalidatePath("/contracts");
  console.info("[codef-registry] upload done", {
    documentId: created.id,
    bytes: buf.length,
    fileKind: file.fileKind,
  });
  return { documentId: created.id, downloadUrl };
}

async function savePendingFile(
  file: Pick<RegistrySuccess, "fileName" | "fileBase64" | "fileKind">
) {
  const { supabase, office } = await getSession();
  const buf = Buffer.from(file.fileBase64, "base64");
  if (buf.length < 100 || buf.subarray(0, 4).toString("utf8") !== "%PDF") {
    throw new Error("임시 저장할 PDF 데이터가 올바르지 않아요.");
  }
  const path = buildStoragePath(office.id, "pending", file.fileName);
  const { error } = await supabase.storage.from("documents").upload(path, buf, {
    contentType: "application/pdf",
    upsert: false,
  });
  if (error) throw error;
  const urls = await signedUrls(supabase, "documents", [path], 60 * 60, { fresh: true });
  const downloadUrl = urls[path];
  if (!downloadUrl) {
    await supabase.storage.from("documents").remove([path]);
    throw new Error("등기 PDF 다운로드 URL 발급에 실패했어요.");
  }
  return { pendingStoragePath: path, downloadUrl };
}

function inlineDownloadUrl(file: Pick<RegistrySuccess, "fileBase64" | "contentType" | "fileKind">) {
  return `data:application/pdf;base64,${file.fileBase64}`;
}

async function finishWithFile(
  propertyId: string,
  result: RegistrySuccess,
  registryLabel?: string
): Promise<RegistryInquiryResult> {
  const fileName = withRegistryFileLabel(result.fileName, registryLabel || undefined);
  const file = { ...result, fileName };

  try {
    if (!propertyId) {
      const pending = await savePendingFile(file);
      return {
        ok: true,
        kind: "file",
        fileName,
        fileKind: result.fileKind,
        downloadUrl: pending.downloadUrl,
        pendingStoragePath: pending.pendingStoragePath,
      };
    }
    const saved = await saveFileToProperty(propertyId, file);
    return {
      ok: true,
      kind: "file",
      documentId: saved.documentId,
      fileName,
      fileKind: result.fileKind,
      downloadUrl: saved.downloadUrl,
    };
  } catch (e) {
    // 저장 실패여도 이미 열람비가 나갔을 수 있으므로 소용량 PDF는 내려받을 수 있게 한다.
    const err = toErrorMessage(e);
    console.error("[codef-registry] storage save failed — inline download", err);
    if (result.fileBase64.length < 400_000) {
      return {
        ok: true,
        kind: "file",
        fileName,
        fileKind: result.fileKind,
        downloadUrl: inlineDownloadUrl(file),
        message: `서류함 업로드에 실패했어요 (${err}). PDF 다운로드만 할 수 있어요.`,
      };
    }
    throw e;
  }
}

/** 계약관리 「등기열람」— 1차 요청 */
export async function startRegistryInquiry(_prev: unknown, fd: FormData): Promise<RegistryInquiryResult> {
  try {
    if (await isAppRequest()) {
      return { ok: false, error: "등기 열람은 웹에서만 할 수 있어요." };
    }
    if (!hasCodefCredentials()) {
      return {
        ok: false,
        error:
          "CODEF_CLIENT_ID / CODEF_CLIENT_SECRET 값이 비어 있어요. .env.local에 값을 넣고 저장(⌘S)한 뒤 개발 서버를 재시작해 주세요.",
      };
    }
    const input = parseInput(fd);

    const result = await inquireRegistryByAddress(input, "1");

    if ("continue2Way" in result && result.continue2Way) {
      return {
        ok: true,
        kind: "choose_address",
        candidates: result.resAddrList,
        twoWay: {
          jobIndex: result.jobIndex,
          threadIndex: result.threadIndex,
          jti: result.jti,
          twoWayTimestamp: result.twoWayTimestamp,
          method: result.method,
        },
        message:
          input.registryLabel === "토지"
            ? "토지등기 후보가 여러 건이에요. 하나를 선택해 주세요."
            : "같은 주소로 여러 부동산이 검색됐어요. 하나를 선택해 주세요.",
      };
    }

    return await finishWithFile(input.propertyId, result, input.registryLabel || undefined);
  } catch (e) {
    console.error("[codef-registry] startRegistryInquiry failed", e);
    return { ok: false, error: toErrorMessage(e) };
  }
}

/** 2Way 주소 선택 후 재요청 */
export async function completeRegistryInquiry(_prev: unknown, fd: FormData): Promise<RegistryInquiryResult> {
  try {
    if (await isAppRequest()) {
      return { ok: false, error: "등기 열람은 웹에서만 할 수 있어요." };
    }
    const input = parseInput(fd);
    const uniqueNo = String(fd.get("unique_no") ?? "").trim();
    if (!uniqueNo) return { ok: false, error: "부동산을 선택해 주세요." };

    const twoWay = {
      uniqueNo,
      jobIndex: Number(fd.get("job_index") ?? 0),
      threadIndex: Number(fd.get("thread_index") ?? 0),
      jti: String(fd.get("jti") ?? ""),
      twoWayTimestamp: Number(fd.get("two_way_timestamp") ?? Date.now()),
      method: String(fd.get("method") ?? "") || undefined,
    };

    const result = await inquireRegistrySelectAddress(input, twoWay, "1");
    return await finishWithFile(input.propertyId, result, input.registryLabel || undefined);
  } catch (e) {
    console.error("[codef-registry] completeRegistryInquiry failed", e);
    return { ok: false, error: toErrorMessage(e) };
  }
}

export type RegisterPropertyFromRegistryResult =
  | { ok: true; propertyId: string; message: string }
  | { ok: false; error: string };

function pendingPaths(fd: FormData, officeId: string) {
  const prefix = `${officeId}/pending/`;
  return fd
    .getAll("pending_path")
    .map(String)
    .filter((path) => path.startsWith(prefix) && !path.includes(".."))
    .slice(0, 2);
}

/** 매물 미선택 상태로 열람한 PDF를 새 매물에 연결한다. */
export async function registerPropertyFromRegistry(
  fd: FormData
): Promise<RegisterPropertyFromRegistryResult> {
  const { supabase, profile, office } = await getSession();
  const paths = pendingPaths(fd, office.id);
  if (!paths.length) return { ok: false, error: "연결할 등기 PDF를 찾을 수 없어요. 다시 열람해 주세요." };

  const address = String(fd.get("property_address") ?? "").trim();
  const region = String(fd.get("property_region") ?? "").trim();
  const building = String(fd.get("dong") ?? "").trim();
  const unit = String(fd.get("ho") ?? "").trim();
  const isApartment = String(fd.get("is_apartment") ?? "") === "1";
  if (!address) return { ok: false, error: "매물 주소를 확인할 수 없어요." };

  const propertyId = crypto.randomUUID();
  const title =
    [address, building && `${building}동`, unit && `${unit}호`].filter(Boolean).join(" ") ||
    "등기 열람 매물";
  const names = fd.getAll("pending_file_name").map(String);
  const uploadedPaths: string[] = [];

  try {
    const { error: propertyError } = await supabase.from("properties").insert({
      id: propertyId,
      title,
      address,
      region: region || null,
      building: building || null,
      unit: unit || null,
      deal_type: "매매",
      property_type: isApartment ? "아파트" : "빌라",
      status: "임장 전",
      price: 0,
      manager_id: profile.id,
      created_by: profile.id,
    });
    if (propertyError) throw propertyError;

    for (const [index, pendingPath] of paths.entries()) {
      const fileName = names[index]?.trim() || `등기사항증명서_${Date.now()}_${index + 1}.pdf`;
      const { data: blob, error: downloadError } = await supabase.storage
        .from("documents")
        .download(pendingPath);
      if (downloadError || !blob) throw downloadError ?? new Error("임시 등기 PDF를 읽지 못했어요.");
      const bytes = Buffer.from(await blob.arrayBuffer());
      if (bytes.subarray(0, 4).toString("utf8") !== "%PDF") {
        throw new Error("임시 등기 PDF가 올바르지 않아요.");
      }

      const finalPath = buildStoragePath(office.id, propertyId, fileName);
      const { error: uploadError } = await supabase.storage.from("documents").upload(finalPath, bytes, {
        contentType: "application/pdf",
        upsert: false,
      });
      if (uploadError) throw uploadError;
      uploadedPaths.push(finalPath);

      const { error: documentError } = await supabase.from("documents").insert({
        property_id: propertyId,
        doc_type: "등기사항증명서",
        file_name: fileName,
        storage_path: finalPath,
        file_size: bytes.length,
        issued_at: new Date().toISOString().slice(0, 10),
        uploaded_by: profile.id,
      });
      if (documentError) throw documentError;
    }

    await supabase.storage.from("documents").remove(paths);
    await supabase.from("property_events").insert({
      property_id: propertyId,
      actor_id: profile.id,
      message: `매물 등록 (등기사항증명서 ${paths.length}건 연결)`,
    });
  } catch (error) {
    if (uploadedPaths.length) await supabase.storage.from("documents").remove(uploadedPaths);
    await supabase.from("properties").delete().eq("id", propertyId);
    return { ok: false, error: toErrorMessage(error) };
  }

  revalidatePath("/", "layout");
  revalidatePath("/documents");
  revalidatePath("/contracts");
  return {
    ok: true,
    propertyId,
    message: "매물을 등록하고 등기 PDF를 서류함에 연결했어요.",
  };
}

/** 등록하지 않고 창을 닫은 임시 PDF를 정리한다. */
export async function discardPendingRegistryFiles(paths: string[]) {
  const { supabase, office } = await getSession();
  const prefix = `${office.id}/pending/`;
  const safe = paths.filter((path) => path.startsWith(prefix) && !path.includes("..")).slice(0, 2);
  if (safe.length) await supabase.storage.from("documents").remove(safe);
}
