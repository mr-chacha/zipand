import "server-only";
import { geminiJsonFromText } from "@/lib/ai/gemini";
import { openaiJson } from "@/lib/ai/openai";
import type { ResolvedAi } from "@/lib/ai/provider";
import type { LocationDraft } from "@/lib/ai/types";

export async function runAdCopy(
  ai: ResolvedAi,
  input: {
    title: string;
    address: string;
    dealType: string;
    propertyType: string;
    price: string;
    monthlyRent: string;
    area: string;
    highlights: string;
  }
): Promise<{ description: string; highlights: string }> {
  const system =
    "당신은 한국 부동산 광고 카피라이터입니다. 과장·허위·확정 표현 없이 사실 기반으로 짧고 매력적인 매물 설명을 씁니다. JSON만 출력하세요.";
  const user = `매물 정보:
제목: ${input.title || "(없음)"}
주소: ${input.address || "(없음)"}
거래: ${input.dealType || "(없음)"} / 유형: ${input.propertyType || "(없음)"}
가격(만원): ${input.price || "-"} / 월세(만원): ${input.monthlyRent || "-"}
면적(㎡): ${input.area || "-"}
기존 키워드: ${input.highlights || "-"}

JSON:
{ "description": "고객 공개용 매물 설명 2~4문장", "highlights": "장점 키워드 쉼표 구분 5개 이내" }`;

  if (ai.provider === "openai") {
    return openaiJson(ai.openaiKey!, system, user);
  }
  return geminiJsonFromText(ai.geminiKey!, system, user);
}

export async function runLocationDraft(ai: ResolvedAi, address: string): Promise<LocationDraft> {
  const system = `당신은 중개대상물 확인설명서 입지조건 초안을 돕는 도우미입니다.
주소만으로 알 수 있는 범위를 추정하되, 불확실하면 빈 문자열로 두세요. 확정적으로 단정하지 마세요.
도로·대중교통·학교명은 일반적 지식으로 추정 가능하면 채우고, note에 "추정·현장 확인 필요"를 명시하세요. JSON만 출력.`;
  const user = `주소: ${address}

JSON 키(모두 문자열):
road_width, road_paved("1"|"0"), road_access, bus_stop, bus_minutes, bus_mode("도보"|"차량"),
subway_station, subway_minutes, subway_mode, parking, school_elem, school_elem_min, school_elem_mode,
school_mid, school_mid_min, school_mid_mode, school_high, school_high_min, school_high_mode, note`;

  const empty: LocationDraft = {
    road_width: "",
    road_paved: "1",
    road_access: "",
    bus_stop: "",
    bus_minutes: "",
    bus_mode: "도보",
    subway_station: "",
    subway_minutes: "",
    subway_mode: "도보",
    parking: "",
    school_elem: "",
    school_elem_min: "",
    school_elem_mode: "도보",
    school_mid: "",
    school_mid_min: "",
    school_mid_mode: "도보",
    school_high: "",
    school_high_min: "",
    school_high_mode: "도보",
    note: "",
  };

  const raw =
    ai.provider === "openai"
      ? await openaiJson<Partial<LocationDraft>>(ai.openaiKey!, system, user)
      : await geminiJsonFromText<Partial<LocationDraft>>(ai.geminiKey!, system, user);

  return { ...empty, ...Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, v == null ? "" : String(v)])) };
}
