import { getCodefAccessToken } from "@/lib/codef/client";
import { getCodefConfig } from "@/lib/codef/config";
import { codefEncrypt } from "@/lib/codef/crypto";

const PRODUCT_PATH = "/v1/kr/public/ck/real-estate-register/status";

export type RegistryRealtyType = "0" | "1" | "2" | "3"; // 0 토지+건물, 1 집합건물, 2 토지, 3 건물
export type RegistryIssueType = "0" | "1"; // 0 발급, 1 열람
export type RegistryRecordState = "0" | "1"; // 0 말소사항 포함, 1 현재 유효사항

export type RegistryAddressInput = {
  /** 시도 — CODEF addr_sido (예: 경기도) */
  addrSido: string;
  addrSigungu: string;
  addrRoadName: string;
  addrBuildingNumber: string;
  dong?: string;
  ho?: string;
  realtyType: RegistryRealtyType;
  recordState: RegistryRecordState;
};

export type RegistryAddrCandidate = {
  uniqueNo: string;
  commUniqueNo?: string;
  resAddr?: string;
  resUserAddr?: string;
  [key: string]: unknown;
};

export type RegistryTwoWayState = {
  continue2Way: true;
  jobIndex: number;
  threadIndex: number;
  jti: string;
  twoWayTimestamp: number;
  method?: string;
  resAddrList: RegistryAddrCandidate[];
};

export type RegistrySuccess = {
  continue2Way?: false;
  fileKind: "pdf";
  /** CODEF resOriGinalData의 PDF 바이트 Base64 */
  fileBase64: string;
  contentType: string;
  fileName: string;
  raw: Record<string, unknown>;
};

function finishRegistrySuccess(
  data: Record<string, unknown>,
  code: string,
  msg: string,
  fileNameBase: string
): RegistrySuccess {
  if (code && code !== "CF-00000") {
    throw new Error(msg && msg !== "성공" ? msg : `CODEF 오류 (${code})`);
  }

  const pdfBase64 = pickPdfBase64(data);
  console.info("[codef-registry] PDF extract", {
    len: pdfBase64.length,
    head: pdfBase64.slice(0, 16),
    isPdfMagic: pdfBase64.startsWith("JVBERi0"),
    resIssueYN: data.resIssueYN,
    resWarningMessage: data.resWarningMessage,
    resTotalPageCount: data.resTotalPageCount,
  });

  if (data.resIssueYN != null && String(data.resIssueYN) !== "1" && !pdfBase64) {
    throw new Error(
      `등기 열람에 실패했어요 (발행여부: ${String(data.resIssueYN)}). ${
        String(data.resWarningMessage ?? "").trim() || "주소와 열람 조건을 확인해 주세요."
      }`
    );
  }

  if (pdfBase64) {
    return {
      fileKind: "pdf",
      fileBase64: pdfBase64,
      contentType: "application/pdf",
      fileName: `${fileNameBase}.pdf`,
      raw: data,
    };
  }

  throw new Error(
    "등기 열람은 성공했지만 원문 PDF(resOriGinalData)가 비어 있어요. CODEF 응답의 resIssueYN과 원문 포함 옵션을 확인해 주세요. (전자민원캐시는 이미 차감됐을 수 있습니다)"
  );
}

function decodeCodefData(data: unknown): Record<string, unknown> {
  if (data == null) return {};
  if (Array.isArray(data)) return { items: data };
  if (typeof data === "object" && !Array.isArray(data)) return data as Record<string, unknown>;
  if (typeof data !== "string") return {};
  try {
    const decoded = decodeURIComponent(data.replace(/\+/g, " "));
    const parsed = JSON.parse(decoded) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    /* ignore */
  }
  return {};
}

/** CODEF 문자열 필드가 URL 인코딩되어 오는 경우 복원 */
function normalizePdfBase64Candidate(raw: string): string {
  let s = raw.trim();
  if (/%[0-9A-Fa-f]{2}/.test(s)) {
    try {
      s = decodeURIComponent(s.replace(/\+/g, " "));
    } catch {
      /* keep original */
    }
  }
  return s.replace(/^data:application\/pdf;base64,/i, "").replace(/\s+/g, "");
}

/** %PDF- → base64 헤더 JVBERi0 */
function isPdfBase64(s: string): boolean {
  return s.length >= 200 && s.startsWith("JVBERi0");
}

function findPdfInUnknown(value: unknown, depth: number): string {
  if (depth > 4 || value == null) return "";
  if (typeof value === "string") {
    const n = normalizePdfBase64Candidate(value);
    return isPdfBase64(n) ? n : "";
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findPdfInUnknown(item, depth + 1);
      if (found) return found;
    }
    return "";
  }
  if (typeof value === "object") {
    for (const v of Object.values(value as Record<string, unknown>)) {
      const found = findPdfInUnknown(v, depth + 1);
      if (found) return found;
    }
  }
  return "";
}

function pickPdfBase64(data: Record<string, unknown>): string {
  const keys = [
    "resOriGinalData",
    "resOriginalData",
    "resPdfData",
    "pdfData",
    "resOriGinalPdf",
    "originalData",
    "data",
  ];
  for (const k of keys) {
    const v = data[k];
    if (typeof v !== "string") continue;
    const n = normalizePdfBase64Candidate(v);
    if (isPdfBase64(n)) return n;
  }
  return findPdfInUnknown(data, 0);
}

function describePdfFields(data: Record<string, unknown>) {
  const keys = ["resOriGinalData", "resOriginalData", "resPdfData", "pdfData", "resImageList"];
  return Object.fromEntries(
    keys.map((k) => {
      const v = data[k];
      if (typeof v === "string") {
        const n = normalizePdfBase64Candidate(v);
        return [k, { type: "string", len: v.length, normLen: n.length, head: n.slice(0, 12) }];
      }
      if (Array.isArray(v)) return [k, { type: "array", len: v.length }];
      if (v == null) return [k, { type: "null" }];
      return [k, { type: typeof v }];
    })
  );
}

function asAddrList(v: unknown): RegistryAddrCandidate[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const o = item as Record<string, unknown>;
      const uniqueNo = String(o.uniqueNo ?? o.commUniqueNo ?? "").trim();
      if (!uniqueNo) return null;
      return {
        ...o,
        uniqueNo,
        resAddr: typeof o.resAddr === "string" ? o.resAddr : undefined,
        resUserAddr: typeof o.resUserAddr === "string" ? o.resUserAddr : undefined,
      } as RegistryAddrCandidate;
    })
    .filter(Boolean) as RegistryAddrCandidate[];
}

function parseCodefResponseText(text: string): {
  result?: { code?: string; message?: string; extraMessage?: string };
  data?: unknown;
} {
  const trimmed = text.trim();
  const tryParse = (raw: string) => JSON.parse(raw) as {
    result?: { code?: string; message?: string; extraMessage?: string };
    data?: unknown;
  };
  try {
    return tryParse(trimmed);
  } catch {
    /* CODEF는 본문 전체를 URL 인코딩해 주는 경우가 있음 */
  }
  try {
    return tryParse(decodeURIComponent(trimmed.replace(/\+/g, " ")));
  } catch {
    throw new Error(`CODEF 응답 파싱 실패: ${trimmed.slice(0, 240)}`);
  }
}

async function postRegistry(body: Record<string, unknown>) {
  const { apiBase, sandbox } = getCodefConfig();
  const token = await getCodefAccessToken();
  /**
   * CODEF 공식 SDK(codef-node): JSON.stringify 후 URL 인코딩한 body.
   * Content-Type: application/json
   */
  const jsonBody = JSON.stringify(body);
  const encodedBody = encodeURIComponent(jsonBody);

  console.info("[codef-registry] POST", {
    url: `${apiBase}${PRODUCT_PATH}`,
    sandbox,
    organization: body.organization,
    phoneNoLen: String(body.phoneNo ?? "").length,
    inquiryType: body.inquiryType,
    realtyType: body.realtyType,
    issueType: body.issueType,
    addr_sido: body.addr_sido,
    addr_sigungu: body.addr_sigungu,
    addr_roadName: body.addr_roadName,
    addr_buildingNumber: body.addr_buildingNumber,
    dong: body.dong ?? "",
    ho: body.ho ?? "",
    ePrepayNoLen: String(body.ePrepayNo ?? "").length,
    passwordEncLen: String(body.password ?? "").length,
    ePrepayPassLen: String(body.ePrepayPass ?? "").length,
    registerSummaryYN: body.registerSummaryYN,
    originDataYN: body.originDataYN,
    jsonBodyLen: jsonBody.length,
    encodedBodyLen: encodedBody.length,
    specHint: {
      ePrepayNo: "12자리 전자민원캐시 번호 (평문)",
      ePrepayPass: "전자민원캐시 비밀번호 (평문)",
      password: "등기소 비회원 비밀번호 → RSA 암호문",
    },
  });

  const res = await fetch(`${apiBase}${PRODUCT_PATH}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: encodedBody,
  });
  const text = await res.text();
  console.info("[codef-registry] RESPONSE", {
    httpStatus: res.status,
    bodyLength: text.length,
  });
  const json = parseCodefResponseText(text);
  const code = json.result?.code ?? "";
  const msg = [json.result?.message, json.result?.extraMessage].filter(Boolean).join(" — ");
  const data = decodeCodefData(json.data);
  console.info("[codef-registry] PARSED", {
    code,
    msg,
    dataKeys: Object.keys(data),
    pdfFields: describePdfFields(data),
  });
  if (!res.ok) throw new Error(`CODEF HTTP ${res.status}: ${msg || text.slice(0, 200)}`);
  return { code, msg, data, result: json.result };
}

function baseBody(address: RegistryAddressInput, issueType: RegistryIssueType) {
  const cfg = getCodefConfig();
  if (!cfg.ePrepayNo || !cfg.ePrepayPass) {
    throw new Error("전자민원캐시(CODEF_EPREPAY_NO / CODEF_EPREPAY_PASS)를 설정해 주세요.");
  }
  if (!cfg.publicKey) {
    throw new Error("CODEF_PUBLIC_KEY가 필요합니다. (인터넷등기소 비밀번호 RSA 암호화)");
  }
  const phoneNo = process.env.CODEF_PHONE_NO?.trim() ?? "";
  const password = process.env.CODEF_PASSWORD?.trim() ?? "";
  if (!phoneNo || !password) {
    throw new Error("등기소 비회원 로그인용 CODEF_PHONE_NO / CODEF_PASSWORD를 설정해 주세요.");
  }
  if (!/^\d{4}$/.test(password)) {
    throw new Error("CODEF_PASSWORD는 재열람에 사용할 임의의 숫자 4자리여야 합니다.");
  }

  if (!address.addrSido.trim()) {
    throw new Error("시도(addr_sido)를 입력해 주세요. 주소 검색으로 다시 선택해 주세요.");
  }

  // 전자민원캐시 약관: 결제 비밀번호 4~8자 영문·숫자
  const ePass = cfg.ePrepayPass;
  if (ePass.length < 4 || ePass.length > 8) {
    throw new Error(
      `CODEF_EPREPAY_PASS 자리수 오류: 평문 ${ePass.length}자입니다. 전자민원캐시 결제 비밀번호는 4~8자(영문·숫자)여야 합니다.`
    );
  }
  if (!/^[A-Za-z0-9]+$/.test(ePass)) {
    throw new Error("CODEF_EPREPAY_PASS는 영문·숫자만 사용할 수 있습니다 (4~8자).");
  }
  if (cfg.ePrepayNo.replace(/\s/g, "").length !== 12) {
    throw new Error(
      `CODEF_EPREPAY_NO 자리수 오류: ${cfg.ePrepayNo.replace(/\s/g, "").length}자입니다. 전자민원캐시 번호는 12자리여야 합니다.`
    );
  }

  const passwordEnc = codefEncrypt(cfg.publicKey, password);
  console.info("[codef-registry] publicKey", {
    len: cfg.publicKey.length,
    hasPemHeader: cfg.publicKey.includes("BEGIN PUBLIC KEY"),
    head: cfg.publicKey.replace(/\s+/g, "").slice(0, 16),
  });

  const body: Record<string, unknown> = {
    organization: "0002",
    phoneNo,
    password: passwordEnc,
    inquiryType: "3",
    realtyType: address.realtyType,
    addr_sido: address.addrSido.trim(),
    addr_sigungu: address.addrSigungu.trim(),
    addr_roadName: address.addrRoadName.trim(),
    addr_buildingNumber: address.addrBuildingNumber.trim(),
    issueType,
    ePrepayNo: cfg.ePrepayNo.replace(/\s/g, ""),
    ePrepayPass: ePass,
    // CODEF 공식 명세: 원문 PDF(resOriGinalData)는 명시적으로 포함 요청해야 한다.
    originDataYN: "1",
    registerSummaryYN: "1",
    state: address.recordState,
  };
  if (address.dong?.trim()) body.dong = address.dong.trim();
  if (address.ho?.trim()) body.ho = address.ho.trim();
  return body;
}

/** 1차 열람/발급 요청 (주소 검색) */
export async function inquireRegistryByAddress(
  address: RegistryAddressInput,
  issueType: RegistryIssueType = "1"
): Promise<RegistrySuccess | RegistryTwoWayState> {
  const { code, msg, data } = await postRegistry(baseBody(address, issueType));

  if (data.continue2Way === true || data.continue2Way === "true") {
    const list = asAddrList(data.resAddrList);
    if (!list.length) {
      throw new Error(msg || "검색된 부동산이 여러 건이지만 목록이 비어 있습니다.");
    }
    return {
      continue2Way: true,
      jobIndex: Number(data.jobIndex ?? 0),
      threadIndex: Number(data.threadIndex ?? 0),
      jti: String(data.jti ?? ""),
      twoWayTimestamp: Number(data.twoWayTimestamp ?? Date.now()),
      method: typeof data.method === "string" ? data.method : undefined,
      resAddrList: list,
    };
  }

  return finishRegistrySuccess(
    data,
    code,
    msg,
    `등기사항증명서_${address.addrSigungu}_${address.addrRoadName}_${Date.now()}`
  );
}

export function withRegistryFileLabel(fileName: string, label?: string) {
  const tag = label?.trim();
  if (!tag) return fileName;
  if (fileName.startsWith("등기사항증명서_")) {
    return fileName.replace("등기사항증명서_", `등기사항증명서_${tag}_`);
  }
  return `${tag}_${fileName}`;
}

/** 2Way: 주소 목록에서 uniqueNo 선택 후 재요청 */
export async function inquireRegistrySelectAddress(
  address: RegistryAddressInput,
  twoWay: Omit<RegistryTwoWayState, "continue2Way" | "resAddrList"> & { uniqueNo: string },
  issueType: RegistryIssueType = "1"
): Promise<RegistrySuccess> {
  const body = {
    ...baseBody(address, issueType),
    is2Way: true,
    uniqueNo: twoWay.uniqueNo,
    jobIndex: String(twoWay.jobIndex),
    threadIndex: String(twoWay.threadIndex),
    jti: twoWay.jti,
    twoWayTimestamp: String(twoWay.twoWayTimestamp),
    ...(twoWay.method ? { method: twoWay.method } : {}),
  };
  const { code, msg, data } = await postRegistry(body);
  return finishRegistrySuccess(
    data,
    code,
    msg,
    `등기사항증명서_${twoWay.uniqueNo}_${Date.now()}`
  );
}
