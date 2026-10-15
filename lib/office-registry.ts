import "server-only";
import { FormError } from "@/lib/errors";

/**
 * 공공데이터포털 「전국공인중개사사무소표준데이터」 OpenAPI
 * https://www.data.go.kr/data/15107745/standard.do
 */
const ENDPOINT = "https://api.data.go.kr/openapi/tn_pubr_public_med_office_api";

export interface RegistryOffice {
  regNo: string;
  name: string;
  representative: string | null;
  type: string | null;
  roadAddress: string | null;
  lotAddress: string | null;
  phone: string | null;
  registeredOn: string | null;
  baseDate: string | null;
  provider: string | null;
}

export interface RegistryQuery {
  name?: string | null;
  regNo?: string | null;
  representative?: string | null;
  page?: number;
}

type RawItem = Record<string, string | null | undefined>;

const RESULT_MESSAGES: Record<string, string> = {
  "03": "",
  "10": "검색 조건이 올바르지 않아요.",
  "11": "검색 조건이 올바르지 않아요.",
  "20": "공공데이터 API 사용 권한이 없어요. 활용신청 승인 상태를 확인해 주세요.",
  "22": "공공데이터 조회 한도를 넘었어요. 잠시 후 다시 시도해 주세요.",
  "30": "공공데이터 API 인증키가 등록되지 않았어요. 인증키를 확인해 주세요.",
  "31": "공공데이터 API 인증키 기한이 만료됐어요.",
  "32": "등록되지 않은 서버 IP예요. 공공데이터포털 설정을 확인해 주세요.",
};

function serviceKey() {
  const key = process.env.DATA_GO_KR_SERVICE_KEY?.trim();
  if (!key) throw new FormError("공공데이터 API 인증키가 설정되지 않았어요. 관리자에게 문의해 주세요.");
  // 포털의 Encoding 키를 넣어도 이중 인코딩되지 않게 한 번 풀어준다
  return key.includes("%") ? decodeURIComponent(key) : key;
}

const clean = (v: string | null | undefined) => (v && v.trim() ? v.trim() : null);

function normalize(item: RawItem): RegistryOffice | null {
  const regNo = clean(item.estblRegNo);
  const name = clean(item.medOfficeNm);
  if (!regNo || !name) return null;
  return {
    regNo,
    name,
    representative: clean(item.rprsvNm),
    type: clean(item.opbizLreaClscSe),
    roadAddress: clean(item.lctnRoadNmAddr),
    lotAddress: clean(item.lctnLotnoAddr),
    phone: clean(item.telno),
    registeredOn: clean(item.estblRegYmd),
    baseDate: clean(item.crtrYmd),
    provider: clean(item.insttNm ?? item.instt_nm),
  };
}

/** 개설등록번호로 다시 조회해 확인된 사무소 정보로 offices 업데이트 값을 만든다 */
export async function verifiedOfficeUpdate(regNo: string, phone: string | null) {
  const { items } = await searchRegistry({ regNo });
  const found = items.find((o) => o.regNo === regNo);
  if (!found) throw new FormError("공공데이터에서 해당 사무소를 찾지 못했어요. 다시 조회해 주세요.");
  return {
    name: found.name,
    registration_no: found.regNo,
    representative: found.representative,
    address: found.roadAddress ?? found.lotAddress,
    phone: phone ?? found.phone,
    registered_at: new Date().toISOString(),
    registry_data: found as unknown as Record<string, string | null>,
  };
}

/** 등록된 공인중개사사무소를 조회한다. 조건은 정확히 일치하는 값으로 검색된다. */
export async function searchRegistry(query: RegistryQuery) {
  const params = new URLSearchParams({
    serviceKey: serviceKey(),
    pageNo: String(query.page ?? 1),
    numOfRows: "20",
    type: "json",
  });
  if (query.name) params.set("medOfficeNm", query.name);
  if (query.regNo) params.set("estblRegNo", query.regNo);
  if (query.representative) params.set("rprsvNm", query.representative);

  let text: string;
  try {
    const res = await fetch(`${ENDPOINT}?${params}`, { cache: "no-store", signal: AbortSignal.timeout(10_000) });
    text = await res.text();
  } catch {
    throw new FormError("공공데이터 서버에 연결하지 못했어요. 잠시 후 다시 시도해 주세요.");
  }

  type Envelope = {
    header?: { resultCode?: string };
    body?: { items?: RawItem[] | { item?: RawItem | RawItem[] } | ""; totalCount?: string | number } | null;
  };
  let json: Envelope & {
    response?: Envelope;
    OpenAPI_ServiceResponse?: { cmmMsgHeader?: { returnReasonCode?: string } };
  };
  try {
    json = JSON.parse(text);
  } catch {
    // 인증키 오류 등은 type=json이어도 XML로 내려온다
    const code = text.match(/<returnReasonCode>(\d+)<\/returnReasonCode>/)?.[1] ?? text.match(/<resultCode>(\d+)<\/resultCode>/)?.[1];
    if (code === "03") return { items: [], total: 0 };
    console.error("[office registry]", text.slice(0, 300));
    throw new FormError(RESULT_MESSAGES[code ?? ""] || "공공데이터 조회에 실패했어요. 잠시 후 다시 시도해 주세요.");
  }

  // 실제 응답은 { header, body } 최상위 구조, 문서상 { response: { header, body } }도 허용
  const envelope = json.response ?? json;
  const code = json.OpenAPI_ServiceResponse?.cmmMsgHeader?.returnReasonCode ?? envelope.header?.resultCode;
  if (!code) {
    console.error("[office registry]", text.slice(0, 300));
    throw new FormError("공공데이터 조회에 실패했어요. 잠시 후 다시 시도해 주세요.");
  }
  if (code === "03") return { items: [], total: 0 };
  if (code !== "00") {
    console.error("[office registry]", text.slice(0, 300));
    throw new FormError(RESULT_MESSAGES[code] || "공공데이터 조회에 실패했어요. 잠시 후 다시 시도해 주세요.");
  }

  const body = envelope.body;
  const raw = body?.items;
  const list: RawItem[] = Array.isArray(raw) ? raw : raw && typeof raw === "object" ? [raw.item ?? []].flat() : [];
  return {
    items: list.map(normalize).filter((o): o is RegistryOffice => o !== null),
    total: Number(body?.totalCount ?? list.length) || 0,
  };
}
