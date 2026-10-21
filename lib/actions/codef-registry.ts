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
      fileKind: "pdf" | "summary";
      /** Storage 서명 URL 또는 data: URL */
      downloadUrl: string;
      message: string;
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
  if (realtyType !== "0" && realtyType !== "1") {
    throw new Error("부동산 구분이 올바르지 않습니다.");
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
  if (realtyType === "1" && (!dong || !ho)) {
    throw new Error("집합건물은 동·호를 입력해 주세요.");
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
    registryLabel,
  };
}

function storageContentType(file: Pick<RegistrySuccess, "contentType" | "fileKind">) {
  if (file.fileKind === "pdf") return "application/pdf";
  // documents 버킷: pdf/jpeg/png + (마이그레이션 후) text/plain·json
  return "text/plain";
}

async function saveFileToProperty(
  propertyId: string,
  file: Pick<RegistrySuccess, "fileName" | "fileBase64" | "contentType" | "fileKind">
) {
  const { supabase, profile, office } = await getSession();
  const buf = Buffer.from(file.fileBase64, "base64");

  if (file.fileKind === "pdf") {
    if (buf.length < 100 || buf.subarray(0, 4).toString("utf8") !== "%PDF") {
      throw new Error(
        `PDF 데이터가 올바르지 않아요 (decoded ${buf.length}bytes). CODEF 응답을 확인해 주세요.`
      );
    }
  } else if (buf.length < 2) {
    throw new Error("저장할 등기 요약 데이터가 비어 있어요.");
  }

  const path = buildStoragePath(office.id, propertyId, file.fileName);
  const contentType = storageContentType(file);
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

function inlineDownloadUrl(file: Pick<RegistrySuccess, "fileBase64" | "contentType" | "fileKind">) {
  const mime = file.fileKind === "pdf" ? "application/pdf" : "text/plain";
  return `data:${mime};base64,${file.fileBase64}`;
}

async function finishWithFile(
  propertyId: string,
  result: RegistrySuccess,
  registryLabel?: string
): Promise<RegistryInquiryResult> {
  if (!propertyId) {
    return { ok: false, error: "저장할 매물을 선택해 주세요. 열람한 등기는 매물 서류함에 저장됩니다." };
  }
  const fileName = withRegistryFileLabel(result.fileName, registryLabel || undefined);
  const file = { ...result, fileName };

  try {
    const saved = await saveFileToProperty(propertyId, file);
    return {
      ok: true,
      kind: "file",
      documentId: saved.documentId,
      fileName,
      fileKind: result.fileKind,
      downloadUrl: saved.downloadUrl,
      message:
        result.fileKind === "pdf"
          ? "등기를 열람해 매물 서류함에 저장했어요. 등본 다운로드를 시작합니다."
          : "열람은 됐지만 CODEF가 PDF를 주지 않아 등기 요약(TXT)으로 저장·다운로드해요. 데모 API에서는 PDF가 비는 경우가 있습니다.",
    };
  } catch (e) {
    // Storage MIME 미허용 등이어도, 이미 열람비는 나갔으니 파일만이라도 받게 한다 (요약·소용량)
    const err = toErrorMessage(e);
    console.error("[codef-registry] storage save failed — inline download", err);
    if (result.fileKind === "summary" || result.fileBase64.length < 400_000) {
      return {
        ok: true,
        kind: "file",
        fileName,
        fileKind: result.fileKind,
        downloadUrl: inlineDownloadUrl(file),
        message: `서류함 업로드에 실패했어요 (${err}). 파일 다운로드만 진행합니다. documents 버킷에 text/plain 허용 마이그레이션을 적용해 주세요.`,
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
    if (!input.propertyId) {
      return { ok: false, error: "저장할 매물을 선택해 주세요." };
    }

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
    if (!input.propertyId) {
      return { ok: false, error: "저장할 매물을 선택해 주세요." };
    }
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
