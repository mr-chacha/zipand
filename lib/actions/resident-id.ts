"use server";

import { getSession } from "@/lib/auth";
import { FormError, requiredStr, str, toErrorMessage } from "@/lib/form";
import { digitsOnly, isValidResidentId } from "@/lib/resident-id";
import type { ActionState } from "@/types";

export type ResidentIdVerifyResult = ActionState & {
  /** 형식 검증 통과 여부 */
  formatOk?: boolean;
  /** 정부24 수동 확인 안내 URL */
  govUrl?: string;
};

const GOV24_URL =
  "https://www.gov.kr/mw/AA020InfoCappView.do?CappBizCD=13110000030";

/**
 * 주민등록증 진위확인.
 * 행정안전부 공식 OpenAPI는 일반 사업자에 개방되어 있지 않아,
 * 입력값 형식 검증 후 정부24 확인 안내를 반환한다. (전용 API 연동은 준비중)
 */
export async function verifyResidentId(
  _prev: ResidentIdVerifyResult | null,
  fd: FormData
): Promise<ResidentIdVerifyResult> {
  try {
    await getSession();
    const name = requiredStr(fd, "name", "성명");
    const front = digitsOnly(requiredStr(fd, "id_front", "주민등록번호 앞자리"));
    const back = digitsOnly(requiredStr(fd, "id_back", "주민등록번호 뒷자리"));
    const issuedAt = str(fd, "issued_at");

    if (front.length !== 6 || back.length !== 7) {
      throw new FormError("주민등록번호는 앞 6자리·뒤 7자리로 입력해 주세요.");
    }
    const rrn = `${front}${back}`;
    if (!isValidResidentId(rrn)) {
      return {
        error: "주민등록번호 형식이 올바르지 않아요. 번호를 다시 확인해 주세요.",
        formatOk: false,
        govUrl: GOV24_URL,
      };
    }
    if (issuedAt && !/^\d{4}-\d{2}-\d{2}$/.test(issuedAt)) {
      throw new FormError("발급일자를 올바르게 선택해 주세요.");
    }

    // 전용 진위확인 API 키가 있으면 여기서 연동. 현재는 형식 검증 + 정부24 안내.
    void name;
    return {
      message:
        "주민등록번호 형식은 확인됐어요. 행정기관 진위확인은 정부24에서 이어서 진행해 주세요. (API 연동 준비중)",
      formatOk: true,
      govUrl: GOV24_URL,
    };
  } catch (e) {
    return { error: toErrorMessage(e) };
  }
}
