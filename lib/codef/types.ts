/** CODEF 공부서류 자동 발급 — 공통 타입 */

export type CodefDocKind = "registry" | "building_ledger" | "cadastral_map";

export const CODEF_DOC_LABELS: Record<CodefDocKind, string> = {
  registry: "등기부등본",
  building_ledger: "건축물대장",
  cadastral_map: "지적도",
};

/** 도로명 주소 파싱 결과 (등기 API inquiryType=3 기준) */
export type CodefParsedAddress = {
  /** 시군구 예: 노원구 */
  addrSigungu: string;
  /** 도로명 예: 한글비석로 */
  addrRoadName: string;
  /** 건물번호 예: 62 */
  addrBuildingNumber: string;
  /** 집합건물 동 (선택) */
  dong?: string;
  /** 집합건물 호 (선택) */
  ho?: string;
  /** 원문 주소 */
  raw: string;
};

export type CodefFetchResult = {
  kind: CodefDocKind;
  /** PDF 등 바이너리 (Base64 또는 Uint8Array) */
  fileBase64?: string;
  fileName: string;
  contentType: string;
  /** 기관 원문/메타 (저장·추출용) */
  meta?: Record<string, unknown>;
};
