import type { LocationDraft } from "@/lib/ai/types";
import { lookupKakaoNearby, type KakaoNearbyPlace } from "@/lib/kakao-local";

function firstPlace(places: KakaoNearbyPlace[], keyword: string) {
  return places.find((place) => place.keyword === keyword);
}

function placeFields(place: KakaoNearbyPlace | undefined) {
  return place
    ? { name: place.name, minutes: String(place.estimatedWalkMinutes) }
    : { name: "", minutes: "" };
}

/** 주소로 카카오 주변을 조회해 확인설명서 입지 필드를 만든다. */
export async function fetchDisclosureLocationFields(address: string): Promise<LocationDraft> {
  const trimmed = address.trim();
  const dislikedKeywords = ["장례식장", "화장장", "소각장", "폐기물처리시설", "하수처리장"];
  const keywords = ["버스정류장", "지하철역", "초등학교", "중학교", "고등학교", ...dislikedKeywords];
  const nearby = await lookupKakaoNearby(trimmed, keywords, { radius: 3_000, sizePerKeyword: 1 });
  const bus = placeFields(firstPlace(nearby.places, "버스정류장"));
  const subway = placeFields(firstPlace(nearby.places, "지하철역"));
  const elementary = placeFields(firstPlace(nearby.places, "초등학교"));
  const middle = placeFields(firstPlace(nearby.places, "중학교"));
  const high = placeFields(firstPlace(nearby.places, "고등학교"));
  const disliked = nearby.places.filter(
    (place) => dislikedKeywords.includes(place.keyword) && place.distanceM <= 1_000
  );
  return {
    road_width: "",
    road_paved: "",
    road_access: "",
    bus_stop: bus.name,
    bus_minutes: bus.minutes,
    bus_mode: "도보",
    subway_station: subway.name,
    subway_minutes: subway.minutes,
    subway_mode: "도보",
    parking: "",
    school_elem: elementary.name,
    school_elem_min: elementary.minutes,
    school_elem_mode: "도보",
    school_mid: middle.name,
    school_mid_min: middle.minutes,
    school_mid_mode: "도보",
    school_high: high.name,
    school_high_min: high.minutes,
    school_high_mode: "도보",
    disliked_facility: disliked.length ? "있음" : "",
    disliked_facility_detail: disliked
      .map((place) => `${place.name} 약 ${(place.distanceM / 1_000).toFixed(1)}km`)
      .join(", "),
    note:
      "카카오 장소의 직선거리로 도보 시간을 추정했어요. 실제 보행시간과 비선호시설 누락 여부를 현장·공적 자료로 확인해 주세요.",
  };
}

/** note 제외·빈값 제거한 폼 병합용 맵 */
export function locationDraftToFormFields(draft: LocationDraft): Record<string, string> {
  const { note: _note, ...fields } = draft;
  return Object.fromEntries(Object.entries(fields).filter(([, value]) => Boolean(value)));
}

/** DB jsonb → 폼 필드 */
export function parseStoredLocationFields(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (key === "note") continue;
    if (typeof value === "string" && value.trim()) out[key] = value;
  }
  return out;
}
