import "server-only";
import { DEFAULT_NEARBY_KEYWORDS } from "@/lib/constants";
import { FormError } from "@/lib/errors";

const KAKAO_LOCAL_BASE = "https://dapi.kakao.com/v2/local";
const MAX_KEYWORDS = 10;

export { DEFAULT_NEARBY_KEYWORDS };

export type KakaoNearbyPlace = {
  keyword: string;
  name: string;
  category: string;
  address: string;
  roadAddress: string;
  distanceM: number;
  estimatedWalkMinutes: number;
  longitude: number;
  latitude: number;
  placeUrl: string;
};

type KakaoAddressResponse = {
  documents?: Array<{ address_name?: string; x?: string; y?: string }>;
};

type KakaoKeywordResponse = {
  documents?: Array<{
    place_name?: string;
    category_name?: string;
    address_name?: string;
    road_address_name?: string;
    distance?: string;
    x?: string;
    y?: string;
    place_url?: string;
  }>;
};

function apiKey() {
  const key = process.env.KAKAO_REST_API_KEY?.trim();
  if (!key) {
    throw new FormError("카카오 Local REST API 키가 없어요. KAKAO_REST_API_KEY를 설정해 주세요.");
  }
  return key;
}

async function kakaoGet<T>(path: string, params: URLSearchParams): Promise<T> {
  const response = await fetch(`${KAKAO_LOCAL_BASE}${path}?${params}`, {
    headers: { Authorization: `KakaoAK ${apiKey()}` },
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 300);
    throw new FormError(`카카오 주변 정보 조회에 실패했어요 (${response.status}${detail ? `: ${detail}` : ""}).`);
  }
  return (await response.json()) as T;
}

export function normalizeNearbyKeywords(value: string | string[] | null | undefined) {
  const values = Array.isArray(value) ? value : (value ?? "").split(/\n|,/);
  return [...new Set(values.map((item) => item.trim()).filter(Boolean))]
    .map((item) => item.slice(0, 30))
    .slice(0, MAX_KEYWORDS);
}

async function geocodeAddress(address: string) {
  const query = address.trim();
  if (!query) throw new FormError("주변 정보를 조회하려면 주소가 필요해요.");
  const params = new URLSearchParams({ query, analyze_type: "similar" });
  const result = await kakaoGet<KakaoAddressResponse>("/search/address.json", params);
  const first = result.documents?.[0];
  const longitude = Number(first?.x);
  const latitude = Number(first?.y);
  if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
    throw new FormError("카카오에서 주소 좌표를 찾지 못했어요. 도로명 주소를 다시 검색해 주세요.");
  }
  return { address: first?.address_name || query, longitude, latitude };
}

async function searchKeyword(
  keyword: string,
  center: { longitude: number; latitude: number },
  radius: number,
  size: number
): Promise<KakaoNearbyPlace[]> {
  const params = new URLSearchParams({
    query: keyword,
    x: String(center.longitude),
    y: String(center.latitude),
    radius: String(radius),
    sort: "distance",
    size: String(size),
  });
  const result = await kakaoGet<KakaoKeywordResponse>("/search/keyword.json", params);
  return (result.documents ?? []).flatMap((place) => {
    const distanceM = Math.round(Number(place.distance));
    const longitude = Number(place.x);
    const latitude = Number(place.y);
    if (!place.place_name || !Number.isFinite(distanceM) || !Number.isFinite(longitude) || !Number.isFinite(latitude)) {
      return [];
    }
    return [
      {
        keyword,
        name: place.place_name,
        category: place.category_name ?? "",
        address: place.address_name ?? "",
        roadAddress: place.road_address_name ?? "",
        distanceM,
        // 카카오 Local은 보행 경로를 주지 않으므로 직선거리 ÷ 분당 67m의 참고 추정치다.
        estimatedWalkMinutes: Math.max(1, Math.ceil(distanceM / 67)),
        longitude,
        latitude,
        placeUrl: place.place_url ?? "",
      },
    ];
  });
}

export async function lookupKakaoNearby(
  address: string,
  keywords: string[] | string,
  options?: { radius?: number; sizePerKeyword?: number }
) {
  const normalized = normalizeNearbyKeywords(keywords);
  if (!normalized.length) throw new FormError("주변 검색 키워드를 하나 이상 입력해 주세요.");
  const center = await geocodeAddress(address);
  const radius = Math.min(20_000, Math.max(100, options?.radius ?? 3_000));
  const size = Math.min(5, Math.max(1, options?.sizePerKeyword ?? 3));
  const groups = await Promise.all(normalized.map((keyword) => searchKeyword(keyword, center, radius, size)));
  return {
    source: "Kakao Local" as const,
    center,
    radius,
    searchedAt: new Date().toISOString(),
    keywords: normalized,
    places: groups.flat(),
  };
}

export function nearbyFactsText(places: KakaoNearbyPlace[]) {
  return places
    .map(
      (place) =>
        `- ${place.keyword}: ${place.name}, 직선거리 ${place.distanceM}m, 도보 약 ${place.estimatedWalkMinutes}분(직선거리 기반 추정)`
    )
    .join("\n");
}
