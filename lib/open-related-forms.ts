const RELATED_FORMS_WINDOW_NAME = "zipand-related-forms-write";
const RELATED_FORMS_WINDOW_WIDTH = 1000;
const RELATED_FORMS_WINDOW_HEIGHT = 900;

/** 영수증 관련 서식을 about:blank 팝업으로 연 뒤 전용 웹 페이지로 이동한다. */
export function openRelatedFormsWindow() {
  const width = RELATED_FORMS_WINDOW_WIDTH;
  const height = RELATED_FORMS_WINDOW_HEIGHT;
  const left = Math.max(0, Math.round((window.screen.availWidth - width) / 2));
  const top = Math.max(0, Math.round((window.screen.availHeight - height) / 2));
  const features = [
    "popup=yes",
    `width=${width}`,
    `height=${height}`,
    `left=${left}`,
    `top=${top}`,
    "scrollbars=yes",
    "resizable=yes",
  ].join(",");
  const popup = window.open("", RELATED_FORMS_WINDOW_NAME, features);
  if (!popup) {
    window.location.assign("/contracts/related/write");
    return;
  }
  try {
    popup.location.assign("/contracts/related/write");
    popup.resizeTo(width, height);
    popup.moveTo(left, top);
    popup.focus();
  } catch {
    window.location.assign("/contracts/related/write");
  }
}
