/** 계약서 작성 팝업 고정 크기 (모바일 미대응) */
export const CONTRACT_WRITE_WINDOW_WIDTH = 1200;
export const CONTRACT_WRITE_WINDOW_HEIGHT = 900;

const CONTRACT_WRITE_WINDOW_NAME = "zipand-contract-write";

type WriteWindow = Window & { __zipandWriteFormId?: string };

/** 목록(오프너)에서 연 작성 창 참조 */
let contractWriteWindow: WriteWindow | null = null;

function isContractWriteSurface(win: Window) {
  try {
    const path = win.location.pathname;
    return (
      path.startsWith("/contracts/write") || path.startsWith("/contracts/disclosure/write")
    );
  } catch {
    return true;
  }
}

/** 작성·확인설명서 창에 현재 form id를 남김(같은 계약 재클릭 시 포커스 판별용) */
export function tagContractWriteFormId(formId?: string | null) {
  if (typeof window === "undefined") return;
  (window as WriteWindow).__zipandWriteFormId = formId?.trim() || "";
}

function readWriteFormId(win: WriteWindow): string | undefined {
  try {
    const tagged = win.__zipandWriteFormId;
    if (typeof tagged === "string") return tagged;

    const u = new URL(win.location.href);
    if (u.pathname.startsWith("/contracts/write")) {
      return u.searchParams.get("id")?.trim() || "";
    }
    if (u.pathname.startsWith("/contracts/disclosure/write")) {
      // 시드만 있고 태그가 없으면 판별 불가 → undefined
      return undefined;
    }
    return "";
  } catch {
    return undefined;
  }
}

/** 이미 열린 창이 요청한 계약서(또는 신규 작성)와 같은지 */
function isSameWriteTarget(win: WriteWindow, formId?: string | null) {
  if (!isContractWriteSurface(win)) return false;
  const current = readWriteFormId(win);
  if (current === undefined) return false;
  return current === (formId?.trim() || "");
}

function placeContractWriteWindow(win: Window) {
  const w = CONTRACT_WRITE_WINDOW_WIDTH;
  const h = CONTRACT_WRITE_WINDOW_HEIGHT;
  const left = Math.max(0, Math.round((window.screen.availWidth - w) / 2));
  const top = Math.max(0, Math.round((window.screen.availHeight - h) / 2));
  try {
    win.resizeTo(w, h);
    win.moveTo(left, top);
  } catch {
    /* 일부 브라우저는 resize/move 제한 */
  }
  win.focus();
}

function popupFeatures() {
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

function writeUrl(formId?: string | null) {
  return formId?.trim()
    ? `/contracts/write?id=${encodeURIComponent(formId.trim())}`
    : "/contracts/write";
}

/**
 * 계약서 작성·조회를 새 창(팝업)으로 연다.
 * - 같은 계약서가 이미 열려 있으면 새로고침 없이 포커스만
 * - 다른 계약서면 기존 창을 그 계약서로 전환(이전 수정 화면은 닫힘)
 * - 팝업 차단 시 같은 탭으로 이동
 */
export function openContractWriteWindow(formId?: string | null) {
  const url = writeUrl(formId);
  const features = popupFeatures();

  const focusIfSame = (win: WriteWindow) => {
    if (!isSameWriteTarget(win, formId)) return false;
    contractWriteWindow = win;
    win.focus();
    return true;
  };

  const navigateExisting = (win: WriteWindow) => {
    win.location.assign(url);
    contractWriteWindow = win;
    placeContractWriteWindow(win);
  };

  if (contractWriteWindow && !contractWriteWindow.closed) {
    if (focusIfSame(contractWriteWindow)) return;
    navigateExisting(contractWriteWindow);
    return;
  }

  // 이름만으로 기존 창을 가져오면 URL이 바뀌지 않음(목록 새로고침 후에도 재사용)
  const existing = window.open("", CONTRACT_WRITE_WINDOW_NAME, features) as WriteWindow | null;
  if (!existing) {
    window.location.assign(url);
    return;
  }

  try {
    const href = existing.location.href;
    if (href && href !== "about:blank") {
      if (focusIfSame(existing)) return;
      navigateExisting(existing);
      return;
    }
  } catch {
    // 읽기 실패 시 다른 계약으로 열 수 있게 이동
    navigateExisting(existing);
    return;
  }

  existing.location.assign(url);
  contractWriteWindow = existing;
  placeContractWriteWindow(existing);
}

/** 작성 창에서 목록(부모) 새로고침 */
export function refreshContractWriteOpener() {
  try {
    if (window.opener && !window.opener.closed) {
      window.opener.location.reload();
    }
  } catch {
    /* cross-origin 등 */
  }
}
