import { DEAL_STEPS, type DealStep } from "@/lib/constants";

export const STEP_TITLES = [...DEAL_STEPS, "거래 완료"] as const;

export const STEP_DESCRIPTIONS = [
  "계약 전 서류와 권리관계를 확인해요",
  "거래대금과 입주날짜 등 거래 조건을 정리해요",
  "계약금·잔금·수수료와 당사자 정보, 계약 서류를 준비해요",
  "잔금 입금과 인도 과정을 확인해요",
  "중개수수료 입금을 확인하고 거래를 마무리해요",
];

/** 진행 단계(deal.stage)의 인덱스. 완료·취소는 마지막 단계 */
export function stageIndex(stage: string) {
  const i = DEAL_STEPS.indexOf(stage as DealStep);
  return i === -1 ? DEAL_STEPS.length : i;
}
