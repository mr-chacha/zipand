/** 계약서를 body 직속 호스트로 복제해 인쇄 — 빈 1페이지·모달 클리핑 방지 */

const HOST_ID = "contract-print-host";

export type ContractPrintItem =
  | { root: HTMLElement | string; title?: string }
  | { pdfUrl: string; title: string };

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
export function printContractBatch(items: ContractPrintItem[], color: "color" | "monochrome" = "monochrome") {
  const resolved: Array<{ root: HTMLElement; title?: string } | { pdfUrl: string; title: string }> = [];
  for (const item of items) {
    if ("pdfUrl" in item) {
      resolved.push(item);
      continue;
    }
    const source = typeof item.root === "string" ? document.getElementById(item.root) : item.root;
    if (source) resolved.push({ ...item, root: source });
  }
  if (!resolved.length) return;
  document.getElementById(HOST_ID)?.remove();

  const host = document.createElement("div");
  host.id = HOST_ID;
  host.dataset.printColor = color;
  resolved.forEach((item, index) => {
    if ("pdfUrl" in item) {
      const page = document.createElement("section");
      page.className = "contract-print-clone certificate-print-clone";
      page.dataset.printBatchItem = String(index);
      const heading = document.createElement("h1");
      heading.textContent = item.title;
      const frame = document.createElement("iframe");
      frame.src = item.pdfUrl;
      frame.title = item.title;
      page.append(heading, frame);
      host.appendChild(page);
      return;
    }

    syncFormValues(item.root);
    const clone = item.root.cloneNode(true) as HTMLElement;
    clone.removeAttribute("id");
    clone.removeAttribute("data-print-source");
    clone.classList.remove("absolute", "fixed", "hidden", "-left-[20000px]");
    clone.style.cssText = "position:static;left:auto;top:auto;width:100%;max-width:none;";
    clone.classList.add("contract-print-clone");
    clone.dataset.printBatchItem = String(index);
    const multipage = clone.querySelectorAll(".disclosure-page, .form-print-page");
    if (multipage.length > 0 || clone.classList.contains("privacy-consent-print")) {
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
  });
  document.body.appendChild(host);

  const prevTitle = document.title;
  // 머리글 제목을 최대한 비움 (브라우저가 머리글을 켠 경우)
  document.title = "\u200b";

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

export function printContractSheet(title?: string, root?: HTMLElement | string | null) {
  printContractBatch(
    [{ root: root ?? document.getElementById("contract-print-root")!, title }],
    "color"
  );
}
