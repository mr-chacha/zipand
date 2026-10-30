import type { DisclosureWriteSeed } from "@/components/deal-forms/disclosure-write-dialog";
import {
  CONTRACT_WRITE_WINDOW_HEIGHT,
  CONTRACT_WRITE_WINDOW_WIDTH,
} from "@/lib/open-contract-write";

const KEY = "zipand-disclosure-write-seed";
const DISCLOSURE_WRITE_WINDOW_NAME = "zipand-disclosure-write";

/** 계약서 → 확인설명서 팝업으로 넘길 시드 (창 간 공유용 localStorage) */
export function stashDisclosureWriteSeed(seed: DisclosureWriteSeed) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ seed, at: Date.now() }));
  } catch {
    /* quota 등 */
  }
}

export function peekDisclosureWriteSeed(): DisclosureWriteSeed | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { seed?: DisclosureWriteSeed; at?: number } | DisclosureWriteSeed;
    // 이전 형식(시드 직접 저장)과 { seed, at } 모두 허용
    if (parsed && typeof parsed === "object" && "seed" in parsed && parsed.seed) {
      return parsed.seed;
    }
    return parsed as DisclosureWriteSeed;
  } catch {
    return null;
  }
}

export function clearDisclosureWriteSeed() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* */
  }
}

function disclosurePopupFeatures() {
  const w = CONTRACT_WRITE_WINDOW_WIDTH;
  const h = CONTRACT_WRITE_WINDOW_HEIGHT;
  const left = Math.max(0, Math.round((window.screen.availWidth - w) / 2));
  const top = Math.max(0, Math.round((window.screen.availHeight - h) / 2));
  return [
    "popup=yes",
    `width=${w}`,
    `height=${h}`,
    `left=${left}`,
    `top=${top}`,
    "scrollbars=yes",
    "resizable=yes",
  ].join(",");
}

/**
 * 시드를 저장한 뒤 확인설명서 작성을 계약서와 같은 방식의 팝업(about:blank → URL)으로 연다.
 * 계약서 창은 유지된다.
 */
export function openDisclosureWriteTab(seed: DisclosureWriteSeed) {
  stashDisclosureWriteSeed(seed);
  const url = "/contracts/disclosure/write";
  const features = disclosurePopupFeatures();
  const win = window.open("", DISCLOSURE_WRITE_WINDOW_NAME, features);
  if (!win) {
    window.location.assign(url);
    return;
  }
  try {
    win.location.assign(url);
  } catch {
    window.location.assign(url);
    return;
  }
  try {
    win.resizeTo(CONTRACT_WRITE_WINDOW_WIDTH, CONTRACT_WRITE_WINDOW_HEIGHT);
    const left = Math.max(0, Math.round((window.screen.availWidth - CONTRACT_WRITE_WINDOW_WIDTH) / 2));
    const top = Math.max(0, Math.round((window.screen.availHeight - CONTRACT_WRITE_WINDOW_HEIGHT) / 2));
    win.moveTo(left, top);
  } catch {
    /* resize/move 제한 */
  }
  win.focus();
}
