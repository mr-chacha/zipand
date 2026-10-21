/**
 * 카카오 우편번호 서비스 (Postcode JS) — API 키 불필요.
 * https://postcode.map.kakao.com/guide
 */

const SCRIPT_SRC = "//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";

export type KakaoPostcodeData = {
  zonecode: string;
  address: string;
  addressType: "R" | "J";
  userSelectedType: "R" | "J";
  roadAddress: string;
  jibunAddress: string;
  autoRoadAddress: string;
  autoJibunAddress: string;
  buildingName: string;
  apartment: "Y" | "N";
  sido: string;
  sigungu: string;
  sigunguCode: string;
  bcode: string;
  roadname: string;
  bname: string;
};

/** CODEF 등기 열람(inquiryType=3)용으로 파싱한 주소 */
export type CodefRoadAddressParts = {
  addrSido: string;
  addrSigungu: string;
  addrRoadName: string;
  addrBuildingNumber: string;
  /** 표시용 전체 도로명 주소 */
  roadAddress: string;
  apartment: boolean;
  /** 건축HUB용 법정동코드 10자리 */
  bcode: string;
  bun: string;
  ji: string;
  jibunAddress: string;
};

/** 카카오 sido(경기) → CODEF addr_sido(경기도) */
const SIDO_FULL: Record<string, string> = {
  서울: "서울특별시",
  서울시: "서울특별시",
  서울특별시: "서울특별시",
  부산: "부산광역시",
  부산시: "부산광역시",
  부산광역시: "부산광역시",
  대구: "대구광역시",
  대구시: "대구광역시",
  대구광역시: "대구광역시",
  인천: "인천광역시",
  인천시: "인천광역시",
  인천광역시: "인천광역시",
  광주: "광주광역시",
  광주시: "광주광역시",
  광주광역시: "광주광역시",
  대전: "대전광역시",
  대전시: "대전광역시",
  대전광역시: "대전광역시",
  울산: "울산광역시",
  울산시: "울산광역시",
  울산광역시: "울산광역시",
  세종: "세종특별자치시",
  세종시: "세종특별자치시",
  세종특별자치시: "세종특별자치시",
  경기: "경기도",
  경기도: "경기도",
  강원: "강원특별자치도",
  강원도: "강원특별자치도",
  강원특별자치도: "강원특별자치도",
  충북: "충청북도",
  충청북도: "충청북도",
  충남: "충청남도",
  충청남도: "충청남도",
  전북: "전북특별자치도",
  전라북도: "전북특별자치도",
  전북특별자치도: "전북특별자치도",
  전남: "전라남도",
  전라남도: "전라남도",
  경북: "경상북도",
  경상북도: "경상북도",
  경남: "경상남도",
  경상남도: "경상남도",
  제주: "제주특별자치도",
  제주도: "제주특별자치도",
  제주특별자치도: "제주특별자치도",
};

export function toCodefSido(sido: string): string {
  const t = sido.trim();
  return SIDO_FULL[t] ?? t;
}

declare global {
  interface Window {
    daum?: {
      Postcode: new (options: {
        oncomplete: (data: KakaoPostcodeData) => void;
        onclose?: (state: "FORCE_CLOSE" | "COMPLETE_CLOSE") => void;
        width?: string | number;
        height?: string | number;
      }) => { open: () => void; embed: (el: HTMLElement) => void };
    };
  }
}

let loadPromise: Promise<void> | null = null;

export function loadKakaoPostcode(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("브라우저에서만 사용할 수 있어요."));
  if (window.daum?.Postcode) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("우편번호 스크립트 로드 실패")), { once: true });
      if (window.daum?.Postcode) resolve();
      return;
    }
    const s = document.createElement("script");
    s.src = SCRIPT_SRC;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      loadPromise = null;
      reject(new Error("우편번호 스크립트 로드 실패"));
    };
    document.head.appendChild(s);
  });
  return loadPromise;
}

/**
 * 카카오 sigungu → CODEF addr_sigungu.
 * 명세 예시는 `노원구`처럼 구만 쓰기도 하지만, 용인시 기흥구 등은
 * `기흥구`만 보내면 CF-13006(검색결과 없음)이 나므로 카카오 원문 그대로 쓴다.
 * 예: "용인시 기흥구", "수원시 영통구", "노원구"
 */
export function toCodefSigungu(sigungu: string): string {
  return sigungu.trim();
}

/** 지번 주소에서 본번·부번 */
export function parseBunJiFromJibun(jibunAddress: string): { bun: string; ji: string } {
  const m = jibunAddress.trim().match(/(?:산\s*)?(\d+)(?:-(\d+))?\s*$/);
  if (!m) return { bun: "0000", ji: "0000" };
  const bun = (m[1] ?? "0").replace(/\D/g, "").padStart(4, "0").slice(-4);
  const ji = (m[2] ?? "0").replace(/\D/g, "").padStart(4, "0").slice(-4);
  return { bun, ji };
}

export function parseCodefRoadAddress(data: KakaoPostcodeData): CodefRoadAddressParts {
  const roadAddress =
    (data.userSelectedType === "R" ? data.roadAddress : data.roadAddress || data.autoRoadAddress) ||
    data.autoRoadAddress ||
    data.address;
  const roadName = data.roadname?.trim() ?? "";
  let buildingNumber = "";
  if (roadName && roadAddress.includes(roadName)) {
    const after = roadAddress.split(roadName)[1]?.trim() ?? "";
    buildingNumber = after.split(/\s+/)[0] ?? "";
  }
  const jibunAddress = data.jibunAddress || data.autoJibunAddress || "";
  const { bun, ji } = parseBunJiFromJibun(jibunAddress);
  const bcode = (data.bcode || data.sigunguCode || "").replace(/\D/g, "");
  return {
    addrSido: toCodefSido(data.sido),
    addrSigungu: toCodefSigungu(data.sigungu),
    addrRoadName: roadName,
    addrBuildingNumber: buildingNumber,
    roadAddress,
    apartment: data.apartment === "Y",
    bcode: bcode.length >= 10 ? bcode.slice(0, 10) : bcode,
    bun,
    ji,
    jibunAddress,
  };
}

/** 팝업으로 주소 선택 → 카카오 원본 데이터 */
export async function pickKakaoPostcode(): Promise<KakaoPostcodeData | null> {
  await loadKakaoPostcode();
  const Postcode = window.daum?.Postcode;
  if (!Postcode) throw new Error("우편번호 서비스를 불러오지 못했어요.");

  return new Promise((resolve) => {
    let settled = false;
    const finish = (value: KakaoPostcodeData | null) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };
    new Postcode({
      oncomplete: (data) => finish(data),
      onclose: (state) => {
        if (state === "FORCE_CLOSE") finish(null);
      },
    }).open();
  });
}

/** 매물 등록용: 도로명(또는 지번) 주소 + 지역(시·군·구) */
export function toPropertyAddressFields(data: KakaoPostcodeData): {
  address: string;
  region: string;
  apartment: boolean;
} {
  const road =
    data.userSelectedType === "R"
      ? data.roadAddress || data.autoRoadAddress || data.address
      : data.jibunAddress || data.autoJibunAddress || data.address;
  const buildingName = data.buildingName?.trim() ?? "";
  const address =
    buildingName && !road.includes(buildingName) ? `${road} ${buildingName}`.trim() : road.trim();
  return {
    address,
    region: data.sigungu?.trim() ?? "",
    apartment: data.apartment === "Y",
  };
}

/** 팝업으로 주소 선택 → CODEF용 필드 반환 */
export async function openKakaoPostcode(): Promise<CodefRoadAddressParts | null> {
  const data = await pickKakaoPostcode();
  return data ? parseCodefRoadAddress(data) : null;
}
