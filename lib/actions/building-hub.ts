"use server";

import { getSession } from "@/lib/auth";
import { isAppRequest } from "@/lib/app-mode";
import { lookupBuildingHub, padBunJi, type BuildingHubFields } from "@/lib/building-hub";
import { toErrorMessage } from "@/lib/form";

export type BuildingHubLookupResult =
  | { ok: true; fields: BuildingHubFields; message: string }
  | { ok: false; error: string };

/** 확인설명서 — 건축HUB 속성 조회 (면적·용도·구조·준공년도) */
export async function lookupBuildingHubForDisclosure(input: {
  bcode: string;
  bun: string;
  ji: string;
  dong?: string;
  ho?: string;
}): Promise<BuildingHubLookupResult> {
  try {
    if (await isAppRequest()) {
      return { ok: false, error: "건축HUB 조회는 웹에서만 할 수 있어요." };
    }
    await getSession();
    if (!process.env.DATA_GO_KR_SERVICE_KEY?.trim()) {
      return { ok: false, error: "DATA_GO_KR_SERVICE_KEY가 없습니다. 공공데이터포털 인증키를 설정해 주세요." };
    }
    const bcode = input.bcode.replace(/\D/g, "");
    if (bcode.length < 10) {
      return { ok: false, error: "주소 검색으로 법정동코드가 있는 주소를 다시 선택해 주세요." };
    }
    const fields = await lookupBuildingHub({
      bcode,
      bun: padBunJi(input.bun),
      ji: padBunJi(input.ji || "0"),
      dong: input.dong,
      ho: input.ho,
    });
    return {
      ok: true,
      fields,
      message: `건축HUB에서 불러왔어요 (${fields.sourceLabel}). 확인설명서에 반영합니다.`,
    };
  } catch (e) {
    return { ok: false, error: toErrorMessage(e) };
  }
}
