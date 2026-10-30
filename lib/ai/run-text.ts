import "server-only";
import { geminiJsonFromText } from "@/lib/ai/gemini";
import { openaiJson } from "@/lib/ai/openai";
import type { ResolvedAi } from "@/lib/ai/provider";

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
    floor: string;
    totalFloors: string;
    direction: string;
    available: string;
    highlights: string;
    nearbyFacts: string;
  }
): Promise<{ naver: string; zigbang_dabang: string; highlights: string }> {
  const system = `너는 부동산 마케팅에 특화된 전문 카피라이터이자 실무 경험이 풍부한 공인중개사입니다.
전달받은 동일한 매물 정보로 네이버 부동산용과 직방·다방용 광고 문구를 각각 작성하세요.

공통 원칙:
- 입력하지 않은 층수, 방향, 입주 가능일, 주차, 옵션은 언급하지 마세요.
- 허위·과장·확정 표현(무조건 최저가, 최고, 완벽 등)을 사용하지 마세요.
- 주변 시설명·거리·시간은 제공된 카카오 조회 결과만 사용하고 새로 만들어내지 마세요.
- 도보 시간은 직선거리 기반 참고 추정치이므로 반드시 "약"을 붙이세요.
- 개발 호재나 학군을 제공된 정보 없이 추정하지 마세요.

네이버 부동산용:
1) 한 줄 요약 헤드라인
2) 매물 핵심 요약을 불릿으로 정리
3) 입지 및 주변 환경
4) 친절하고 신뢰감 있는 중개업소 마무리 멘트
명확하고 정돈된 텍스트로 작성하세요.

직방·다방용:
1) 이모지와 캐치프레이즈를 활용한 모바일 제목
2) 핵심 셀링 포인트 3가지
3) 구조·생활 인프라를 짧고 친근하게 설명
4) 부담 없는 문의 유도 문구
짧은 문장과 적절한 이모지를 사용하세요.

JSON만 출력하세요.`;
  const user = `매물 정보:
제목: ${input.title || "(없음)"}
주소: ${input.address || "(없음)"}
거래: ${input.dealType || "(없음)"} / 유형: ${input.propertyType || "(없음)"}
가격(만원): ${input.price || "-"} / 월세(만원): ${input.monthlyRent || "-"}
면적(㎡): ${input.area || "-"}
층수: ${input.floor || "-"} / 전체 층수: ${input.totalFloors || "-"}
방향: ${input.direction || "-"}
입주 가능일: ${input.available || "-"}
기존 키워드: ${input.highlights || "-"}
카카오 주변 장소 조회 결과:
${input.nearbyFacts || "(조회 결과 없음)"}

JSON:
{
  "naver": "네이버 부동산에 바로 붙여넣을 수 있는 구조화된 전체 문구",
  "zigbang_dabang": "직방·다방에 바로 붙여넣을 수 있는 모바일용 전체 문구",
  "highlights": "입력 정보와 조회 근거가 있는 장점 키워드만 쉼표로 구분해 5개 이내"
}`;

  if (ai.provider === "openai") {
    return openaiJson(ai.openaiKey!, system, user);
  }
  return geminiJsonFromText(ai.geminiKey!, system, user);
}
