/** 계약서를 body 직속 호스트로 복제해 인쇄 — 빈 1페이지·모달 클리핑 방지 */

const HOST_ID = "contract-print-host";

/** cloneNode는 입력 중인 value를 안 복사하므로 속성으로 동기화 */
function syncFormValues(root: HTMLElement) {
  root.querySelectorAll("input, textarea, select").forEach((node) => {
    if (node instanceof HTMLInputElement) {
      if (node.type === "checkbox" || node.type === "radio") {
        if (node.checked) node.setAttribute("checked", "");
        else node.removeAttribute("checked");
      } else {
        node.setAttribute("value", node.value);
      }
    } else if (node instanceof HTMLTextAreaElement) {
      node.textContent = node.value;
    } else if (node instanceof HTMLSelectElement) {
      Array.from(node.options).forEach((opt) => {
        if (opt.selected) opt.setAttribute("selected", "");
        else opt.removeAttribute("selected");
      });
    }
  });
}

/** 빈 칸 placeholder(도로명 주소·00000·전화·성명 등)가 인쇄에 안 나오게 */
function stripPlaceholders(root: HTMLElement) {
  root.querySelectorAll("input, textarea").forEach((node) => {
    if (
      node instanceof HTMLInputElement ||
      node instanceof HTMLTextAreaElement
    ) {
      node.removeAttribute("placeholder");
      node.placeholder = "";
    }
  });
}

/**
 * @param title 인쇄 문서 제목
 * @param root 인쇄할 루트 요소 또는 id. 생략 시 `#contract-print-root`(문서에서 첫 번째)
 */
export function printContractSheet(title?: string, root?: HTMLElement | string | null) {
  const source =
    (typeof root === "string" ? document.getElementById(root) : root) ??
    document.getElementById("contract-print-root");
  if (!source) return;

  document.getElementById(HOST_ID)?.remove();
  syncFormValues(source);

  const host = document.createElement("div");
  host.id = HOST_ID;
  const clone = source.cloneNode(true) as HTMLElement;
  clone.removeAttribute("id");
  clone.classList.add("contract-print-clone");
  const multipage = clone.querySelectorAll(".disclosure-page, .form-print-page");
  if (multipage.length > 0) {
    clone.classList.add("disclosure-print-clone");
    // 화면에서 숨긴 쪽도 인쇄본에 전부 표시 (확인설명서·표준임대차 등)
    multipage.forEach((node) => {
      if (node instanceof HTMLElement) {
        node.classList.remove("hidden");
        node.style.display = "block";
      }
    });
  }
  stripPlaceholders(clone);
  host.appendChild(clone);
  document.body.appendChild(host);

  const prevTitle = document.title;
  // 머리글 제목을 최대한 비움 (브라우저가 머리글을 켠 경우)
  document.title = title?.trim() ? title : "\u200b";

  let cleaned = false;
  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    document.title = prevTitle;
    host.remove();
    window.removeEventListener("afterprint", cleanup);
  };
  window.addEventListener("afterprint", cleanup);

  requestAnimationFrame(() => {
    window.print();
    setTimeout(cleanup, 1500);
  });
}
