/**
 * 국토교통부 건축HUB 건축물대장 속성 조회 (공공데이터포털).
 * PDF 등본이 아니라 JSON 속성 — 확인설명서 면적·용도 자동입력용.
 * https://www.data.go.kr/data/15134735/openapi.do
 */
import "server-only";

const BASE = "https://apis.data.go.kr/1613000/BldRgstHubService";

export type BuildingHubLookupInput = {
  /** 법정동코드 10자리 (시군구5+법정동5) */
  bcode: string;
  /** 본번 4자리 zero-pad */
  bun: string;
  /** 부번 4자리 zero-pad */
  ji: string;
  dong?: string;
  ho?: string;
};

export type BuildingHubFields = {
  land_area: string;
  building_area: string;
  building_use: string;
  building_structure: string;
  building_year: string;
  /** 표시·로그용 */
  sourceLabel: string;
};

function serviceKey() {
  const key = process.env.DATA_GO_KR_SERVICE_KEY?.trim();
  if (!key) throw new Error("DATA_GO_KR_SERVICE_KEY가 없습니다. 공공데이터포털 인증키를 설정해 주세요.");
  return key.includes("%") ? decodeURIComponent(key) : key;
}

type HubItem = Record<string, string | number | undefined>;

async function hubGet(path: string, params: Record<string, string>): Promise<HubItem[]> {
  const qs = new URLSearchParams({
    serviceKey: serviceKey(),
    _type: "json",
    pageNo: "1",
    numOfRows: "20",
    ...params,
  });
  const res = await fetch(`${BASE}/${path}?${qs}`, {
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  const text = await res.text();
  let json: {
    response?: {
      header?: { resultCode?: string; resultMsg?: string };
      body?: { items?: { item?: HubItem | HubItem[] } | "" };
    };
  };
  try {
    json = JSON.parse(text) as typeof json;
  } catch {
    throw new Error(`건축HUB 응답 파싱 실패: ${text.slice(0, 160)}`);
  }
  const code = json.response?.header?.resultCode ?? "";
  const msg = json.response?.header?.resultMsg ?? "";
  if (code && code !== "00" && code !== "0") {
    throw new Error(msg || `건축HUB 오류 (${code})`);
  }
  const raw = json.response?.body?.items;
  if (raw == null || raw === "") return [];
  const item = (raw as { item?: HubItem | HubItem[] }).item;
  if (!item) return [];
  return Array.isArray(item) ? item : [item];
}

function str(v: unknown) {
  if (v == null) return "";
  return String(v).trim();
}

function yearFromUseAprDay(day: string) {
  const d = day.replace(/\D/g, "");
  if (d.length >= 4) return d.slice(0, 4);
  return "";
}

function areaNum(v: unknown) {
  const n = Number(str(v).replace(/,/g, ""));
  if (!Number.isFinite(n) || n <= 0) return "";
  return String(n);
}

export function padBunJi(n: string) {
  const digits = n.replace(/\D/g, "");
  if (!digits) return "0000";
  return digits.padStart(4, "0").slice(-4);
}

/** 지번 주소 끝의 본번-부번 파싱 */
export function parseBunJiFromJibun(jibunAddress: string): { bun: string; ji: string } {
  const m = jibunAddress.trim().match(/(?:산\s*)?(\d+)(?:-(\d+))?\s*$/);
  if (!m) return { bun: "0000", ji: "0000" };
  return { bun: padBunJi(m[1]!), ji: padBunJi(m[2] ?? "0") };
}

export function splitBcode(bcode: string): { sigunguCd: string; bjdongCd: string } {
  const c = bcode.replace(/\D/g, "");
  if (c.length < 10) throw new Error("법정동코드(bcode)가 올바르지 않습니다.");
  return { sigunguCd: c.slice(0, 5), bjdongCd: c.slice(5, 10) };
}

/** 표제부 + (동·호 있으면) 전유공용면적 → 확인설명서 필드 */
export async function lookupBuildingHub(input: BuildingHubLookupInput): Promise<BuildingHubFields> {
  const { sigunguCd, bjdongCd } = splitBcode(input.bcode);
  const bun = padBunJi(input.bun);
  const ji = padBunJi(input.ji);
  const base = { sigunguCd, bjdongCd, platGbCd: "0", bun, ji };

  const titles = await hubGet("getBrTitleInfo", base);
  if (!titles.length) {
    throw new Error("건축물대장 표제부를 찾지 못했어요. 주소·지번을 확인해 주세요. (건축HUB 활용신청 여부도 확인)");
  }
  const title = titles[0]!;

  let exclusive = "";
  const dong = input.dong?.trim();
  const ho = input.ho?.trim();
  if (dong && ho) {
    try {
      const expos = await hubGet("getBrExposPubuseAreaInfo", {
        ...base,
        dongNm: dong,
        hoNm: ho,
      });
      const exclusiveItem =
        expos.find((x) => str(x.exposPubuseGbCd) === "1" || str(x.exposPubuseGbCdNm).includes("전유")) ?? expos[0];
      exclusive = areaNum(exclusiveItem?.area ?? exclusiveItem?.expositArea);
    } catch {
      /* 전유부 없으면 표제부 면적 사용 */
    }
  }

  const buildingArea = exclusive || areaNum(title.totArea) || areaNum(title.archArea);
  const landArea = areaNum(title.platArea);
  const use = str(title.mainPurpsCdNm) || str(title.etcPurps);
  const structure = str(title.strctCdNm) || str(title.etcStrct);
  const year = yearFromUseAprDay(str(title.useAprDay));

  return {
    land_area: landArea,
    building_area: buildingArea,
    building_use: use,
    building_structure: structure,
    building_year: year,
    sourceLabel: [str(title.bldNm), str(title.dongNm)].filter(Boolean).join(" ") || "건축물대장 표제부",
  };
}
