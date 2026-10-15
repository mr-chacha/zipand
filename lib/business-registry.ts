import "server-only";
import { FormError } from "@/lib/errors";

/**
 * 국세청 사업자등록정보 진위확인 API (공공데이터포털, odcloud)
 * https://www.data.go.kr/data/15081808/openapi.do
 * 공공데이터포털 인증키(DATA_GO_KR_SERVICE_KEY)를 같이 쓰며, 이 API도 활용신청이 되어 있어야 한다.
 */
const ENDPOINT = "https://api.odcloud.kr/api/nts-businessman/v1/validate";

const ERROR_MESSAGES: Record<string, string> = {
  "-401": "사업자등록 진위확인 API 사용 승인이 안 된 인증키예요. 공공데이터포털에서 활용신청 상태를 확인해 주세요.",
  "-4": "사업자등록 진위확인 서비스 사용 권한이 없어요.",
  "-5": "사업자등록 진위확인 서버에 일시적인 문제가 있어요. 잠시 후 다시 시도해 주세요.",
};

export interface BusinessCheck {
  /** 사업자번호·개업일자·대표자명이 국세청 정보와 일치 */
  valid: boolean;
  /** 사업자 상태 (계속사업자·휴업자·폐업자) */
  status: string | null;
  statusCode: string | null;
}

export const normalizeBusinessNo = (value: string) => value.replace(/\D/g, "");

function serviceKey() {
  const key = process.env.DATA_GO_KR_SERVICE_KEY?.trim();
  if (!key) throw new FormError("공공데이터 API 인증키가 설정되지 않았어요. 관리자에게 문의해 주세요.");
  return key.includes("%") ? decodeURIComponent(key) : key;
}

/** 사업자등록번호(10자리)·개업일자(YYYY-MM-DD)·대표자명이 국세청에 등록된 정보와 일치하는지 확인 */
export async function validateBusiness(input: { businessNo: string; startDate: string; representative: string }): Promise<BusinessCheck> {
  const body = {
    businesses: [
      {
        b_no: normalizeBusinessNo(input.businessNo),
        start_dt: input.startDate.replace(/\D/g, ""),
        p_nm: input.representative.trim(),
        p_nm2: "",
        b_nm: "",
        corp_no: "",
        b_sector: "",
        b_type: "",
      },
    ],
  };

  let json: {
    code?: number;
    status_code?: string;
    data?: { valid?: string; status?: { b_stt?: string; b_stt_cd?: string } }[];
  };
  try {
    const res = await fetch(`${ENDPOINT}?serviceKey=${encodeURIComponent(serviceKey())}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    json = await res.json();
  } catch (e) {
    if (e instanceof FormError) throw e;
    throw new FormError("국세청 사업자등록 확인 서버에 연결하지 못했어요. 잠시 후 다시 시도해 주세요.");
  }

  if (json.code !== undefined && json.code < 0) {
    console.error("[business registry]", JSON.stringify(json).slice(0, 300));
    throw new FormError(ERROR_MESSAGES[String(json.code)] ?? "사업자등록 확인에 실패했어요. 잠시 후 다시 시도해 주세요.");
  }
  if (json.status_code !== "OK" || !json.data?.[0]) {
    console.error("[business registry]", JSON.stringify(json).slice(0, 300));
    throw new FormError("사업자등록 확인에 실패했어요. 입력값을 확인해 주세요.");
  }

  const item = json.data[0];
  return {
    valid: item.valid === "01",
    status: item.status?.b_stt || null,
    statusCode: item.status?.b_stt_cd || null,
  };
}
