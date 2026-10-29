import type { DisclosureWriteSeed } from "@/components/deal-forms/disclosure-write-dialog";

const KEY = "zipand-disclosure-write-seed";

/** 계약서 작성 창 → 확인설명서 페이지로 넘길 시드 */
export function stashDisclosureWriteSeed(seed: DisclosureWriteSeed) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(seed));
  } catch {
    /* quota 등 */
  }
}

export function peekDisclosureWriteSeed(): DisclosureWriteSeed | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DisclosureWriteSeed;
  } catch {
    return null;
  }
}

export function clearDisclosureWriteSeed() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* */
  }
}
