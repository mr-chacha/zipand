/** 일사편리(KRAS) 시도별 부동산정보 통합 열람 */
export const KRAS_REGIONS = [
  { label: "서울특별시", url: "https://kras.seoul.go.kr/land_info/info/baseInfo/baseInfo.do" },
  {
    label: "전남광주통합특별시",
    url: "http://kras.jeonnam-gwangju.go.kr/land_info/info/baseInfo/baseInfo.do",
  },
  { label: "부산광역시", url: "https://kras.busan.go.kr/land_info/info/baseInfo/baseInfo.do" },
  { label: "대구광역시", url: "https://kras.daegu.go.kr/land_info/info/baseInfo/baseInfo.do" },
  { label: "인천광역시", url: "http://kras.incheon.go.kr/land_info/info/baseInfo/baseInfo.do" },
  { label: "대전광역시", url: "http://kras.daejeon.go.kr/land_info/info/baseInfo/baseInfo.do" },
  { label: "울산광역시", url: "http://kras.ulsan.go.kr/land_info/info/baseInfo/baseInfo.do" },
  { label: "세종특별자치시", url: "https://kras.sejong.go.kr/land_info/info/baseInfo/baseInfo.do" },
  { label: "경기도", url: "https://kras.gg.go.kr/land_info/info/baseInfo/baseInfo.do" },
  { label: "강원특별자치도", url: "http://kras.gwd.go.kr/land_info/info/baseInfo/baseInfo.do" },
  { label: "충청북도", url: "https://kras.chungbuk.go.kr/land_info/info/baseInfo/baseInfo.do" },
  { label: "충청남도", url: "https://kras.chungnam.go.kr/land_info/info/baseInfo/baseInfo.do" },
  { label: "전북특별자치도", url: "https://kras.jeonbuk.go.kr/land_info/info/baseInfo/baseInfo.do" },
  { label: "경상북도", url: "http://kras.gb.go.kr/land_info/info/baseInfo/baseInfo.do" },
  { label: "경상남도", url: "https://kras.gyeongnam.go.kr/land_info/info/baseInfo/baseInfo.do" },
  { label: "제주특별자치도", url: "https://kras.jeju.go.kr/land_info/info/baseInfo/baseInfo.do" },
] as const;

export type KrasRegion = (typeof KRAS_REGIONS)[number];

/** 주소·별칭 → KRAS 시·도 라벨 (긴 표기 우선) */
const ADDRESS_TO_KRAS: { match: string; label: KrasRegion["label"] }[] = [
  { match: "전남광주통합특별시", label: "전남광주통합특별시" },
  { match: "서울특별시", label: "서울특별시" },
  { match: "부산광역시", label: "부산광역시" },
  { match: "대구광역시", label: "대구광역시" },
  { match: "인천광역시", label: "인천광역시" },
  { match: "광주광역시", label: "전남광주통합특별시" },
  { match: "대전광역시", label: "대전광역시" },
  { match: "울산광역시", label: "울산광역시" },
  { match: "세종특별자치시", label: "세종특별자치시" },
  { match: "강원특별자치도", label: "강원특별자치도" },
  { match: "전북특별자치도", label: "전북특별자치도" },
  { match: "제주특별자치도", label: "제주특별자치도" },
  { match: "충청북도", label: "충청북도" },
  { match: "충청남도", label: "충청남도" },
  { match: "전라북도", label: "전북특별자치도" },
  { match: "전라남도", label: "전남광주통합특별시" },
  { match: "경상북도", label: "경상북도" },
  { match: "경상남도", label: "경상남도" },
  { match: "경기도", label: "경기도" },
  { match: "강원도", label: "강원특별자치도" },
  { match: "서울시", label: "서울특별시" },
  { match: "부산시", label: "부산광역시" },
  { match: "대구시", label: "대구광역시" },
  { match: "인천시", label: "인천광역시" },
  { match: "광주시", label: "전남광주통합특별시" },
  { match: "대전시", label: "대전광역시" },
  { match: "울산시", label: "울산광역시" },
  { match: "세종시", label: "세종특별자치시" },
  { match: "제주도", label: "제주특별자치도" },
  { match: "충북", label: "충청북도" },
  { match: "충남", label: "충청남도" },
  { match: "전북", label: "전북특별자치도" },
  { match: "전남", label: "전남광주통합특별시" },
  { match: "경북", label: "경상북도" },
  { match: "경남", label: "경상남도" },
  { match: "강원", label: "강원특별자치도" },
  { match: "경기", label: "경기도" },
  { match: "서울", label: "서울특별시" },
  { match: "부산", label: "부산광역시" },
  { match: "대구", label: "대구광역시" },
  { match: "인천", label: "인천광역시" },
  { match: "광주", label: "전남광주통합특별시" },
  { match: "대전", label: "대전광역시" },
  { match: "울산", label: "울산광역시" },
  { match: "세종", label: "세종특별자치시" },
  { match: "제주", label: "제주특별자치도" },
];

/** 매물 주소에서 KRAS 열람 시·도를 찾는다. 없으면 null */
export function resolveKrasRegion(address: string | null | undefined): KrasRegion | null {
  const text = address?.trim() ?? "";
  if (!text) return null;

  const sorted = [...ADDRESS_TO_KRAS].sort((a, b) => b.match.length - a.match.length);
  for (const { match, label } of sorted) {
    if (!text.startsWith(match)) continue;
    const next = text[match.length];
    // 짧은 별칭(서울·경기 등)은 다음 글자가 없거나 공백·시·도일 때만
    if (match.length <= 2 && next !== undefined && !/[\s시도]/.test(next)) continue;
    // 그 외는 다음이 없거나 공백·행정구역 접미사
    if (match.length > 2 && next !== undefined && !/[\s시군구특별자치광역]/.test(next)) continue;
    return KRAS_REGIONS.find((r) => r.label === label) ?? null;
  }
  return null;
}
