import type { DocType } from "@/lib/constants";

export type ExtractedField = {
  label: string;
  value: string;
  evidence_text?: string;
};

export type ExtractedSignal = {
  level: "전문가 검토" | "확인 필요" | "참고";
  title: string;
  description?: string;
  evidence_text?: string;
  next_action?: string;
};

export type ParseResult = {
  fields: ExtractedField[];
  signals: ExtractedSignal[];
};

function norm(text: string) {
  return text
    .replace(/\r/g, "\n")
    .replace(/[ \t\u00a0]+/g, " ")
    .replace(/\n{3,}/g, "\n\n");
}

function cleanValue(v: string) {
  return v
    .replace(/\s+/g, " ")
    .replace(/[|│]/g, "")
    .replace(/^[:：)\]]+|[:：(（\[]+$/g, "")
    .trim();
}

/** 표에서 글자 사이 띄어쓰기된 한글 복원: "공 동 주 택" → "공동주택" */
function collapseSpacedHangul(v: string) {
  const t = v.trim();
  if (/^(?:[가-힣A-Za-z0-9]\s+){1,}[가-힣A-Za-z0-9]/.test(t) && t.replace(/\s/g, "").length >= 2) {
    const onlySingles = t.split(/\s+/).every((p) => p.length <= 2);
    if (onlySingles) return t.replace(/\s+/g, "");
  }
  return t;
}

/** 주용도 값 — 다음 항목 라벨이 붙은 경우 잘라냄 */
function cleanMainUse(v: string) {
  let s = collapseSpacedHangul(cleanValue(v));
  s = s.split(
    /(?:주\s*구\s*조|구\s*조|층\s*수|지\s*붕|연\s*면\s*적|건\s*축\s*면\s*적|대\s*지\s*면\s*적|허\s*가|사\s*용\s*승\s*인|위\s*반|발\s*급|기\s*타\s*용\s*도)/
  )[0]?.trim() ?? s;
  const known = s.match(
    /^(공동주택|단독주택|다가구주택|다세대주택|연립주택|아파트|근린생활시설|제[123]종근린생활시설|업무시설|숙박시설|공장|창고시설|교육연구시설|노유자시설)(?:\s*[(\[][^)\]]+[)\]])?/
  );
  if (known) return known[0].trim();
  return s.slice(0, 40);
}

function capture(text: string, patterns: RegExp[]): string | null {
  for (const re of patterns) {
    const m = text.match(re);
    if (!m?.[1]) continue;
    const v = cleanValue(m[1]);
    if (v) return v;
  }
  return null;
}

function areaValue(raw: string) {
  const n = raw.replace(/,/g, "").match(/(\d+(?:\.\d+)?)/);
  return n ? n[1] : cleanValue(raw);
}

function pushField(out: ExtractedField[], label: string, value: string | null, evidence?: string) {
  if (!value) return;
  if (out.some((f) => f.label === label)) return;
  out.push({
    label,
    value,
    evidence_text: evidence ? evidence.slice(0, 200) : value.slice(0, 200),
  });
}

function parseBuildingLedger(text: string): ParseResult {
  const fields: ExtractedField[] = [];
  const signals: ExtractedSignal[] = [];

  const useRaw = capture(text, [
    /주\s*용\s*도\s*[:：]?\s*([^\n]{2,60})/,
    /주\s*용\s*도\s*[:：]?\s*\n\s*([^\n]{2,60})/,
    /주용도\s*[:：]?\s*([가-힣A-Za-z0-9·\/()\s]{2,60})/,
    /(?:^|\n)\s*용\s*도\s*[:：]?\s*(공동주택|단독주택|다가구주택|다세대주택|연립주택|아파트|근린생활시설|제[123]종[^\n]{0,24}|업무시설)[^\n]{0,20}/,
    /(공동주택|단독주택|다가구주택|다세대주택|연립주택)(?:\s*\([^)\n]{0,20}\))?/,
  ]);
  pushField(fields, "주용도", useRaw ? cleanMainUse(useRaw) : null, useRaw ?? undefined);

  const structure = capture(text, [
    /주\s*구\s*조\s*[:：]?\s*([^\n]{2,40})/,
    /구\s*조\s*[:：]?\s*([^\n]{2,40})/,
    /주구조\s*[:：]?\s*([^\n]{2,40})/,
    /(철근콘크리트구조|철골철근콘크리트구조|철골철근콘크리트조|철근콘크리트조|철골구조|벽돌구조|목구조|시멘트벽돌구조|철골조)/,
  ]);
  pushField(fields, "구조", structure);

  const exclusive = capture(text, [
    /전\s*유\s*면\s*적\s*[:：]?\s*([\d,.]+)\s*(?:㎡|m2|M2)?/i,
    /전용면적\s*[:：]?\s*([\d,.]+)/i,
    /면\s*적\s*\(전유\)\s*[:：]?\s*([\d,.]+)/i,
  ]);
  if (exclusive) pushField(fields, "전용면적", areaValue(exclusive), exclusive);

  const archArea = capture(text, [
    /건\s*축\s*면\s*적\s*[:：]?\s*([\d,.]+)\s*(?:㎡|m2|M2)?/i,
    /건축면적\s*([\d,.]+)/i,
  ]);
  if (archArea) pushField(fields, "건축면적", areaValue(archArea), archArea);

  const totalArea = capture(text, [
    /연\s*면\s*적\s*[:：]?\s*([\d,.]+)\s*(?:㎡|m2|M2)?/i,
    /연면적\s*([\d,.]+)/i,
  ]);
  if (totalArea) pushField(fields, "연면적", areaValue(totalArea), totalArea);

  const permitDate = capture(text, [
    /허\s*가\s*일\s*(?:자)?\s*[:：]?\s*([\d.\-\/년월일\s]{6,20})/,
    /건축허가일\s*(?:자)?\s*[:：]?\s*([\d.\-\/년월일\s]{6,20})/,
    /허가일자\s*[:：]?\s*([\d.\-\/년월일\s]{6,20})/,
  ]);
  pushField(fields, "허가일", permitDate ? permitDate.replace(/\s+/g, "") : null);

  const useDate = capture(text, [
    /사\s*용\s*승\s*인\s*일\s*(?:자)?\s*[:：]?\s*([\d.\-\/년월일\s]{6,20})/,
    /사용승인일\s*(?:자)?\s*[:：]?\s*([\d.\-\/]{6,20})/,
    /사용승인일자\s*[:：]?\s*([\d.\-\/년월일\s]{6,20})/,
  ]);
  pushField(fields, "사용승인일", useDate ? useDate.replace(/\s+/g, "") : null);

  const violation = capture(text, [
    /위\s*반\s*건\s*축\s*물\s*(?:여\s*부)?\s*[:：]?\s*([^\n]{1,20})/,
    /위반건축물\s*[:：]?\s*([^\n]{1,20})/,
  ]);
  if (violation) {
    const bad = /해당|위반|있음|유/.test(violation) && !/해당\s*없|미해당|없음|무/.test(violation);
    pushField(fields, "위반건축물 여부", bad ? "해당" : /없|미해당|무/.test(violation) ? "해당없음" : violation);
    if (bad) {
      signals.push({
        level: "전문가 검토",
        title: "위반건축물 기재",
        description: "건축물대장에 위반건축물 관련 기재가 있어요. 원문을 확인하세요.",
        evidence_text: violation.slice(0, 200),
        next_action: "건축물대장 원문·지자체 확인 후 계약 진행 여부를 판단하세요.",
      });
    }
  }

  const issued = capture(text, [
    /발\s*급\s*일\s*[:：]?\s*([\d.\-\/년월일\s]{6,20})/,
    /열\s*람\s*일\s*[:：]?\s*([\d.\-\/년월일\s]{6,20})/,
  ]);
  pushField(fields, "발급일", issued ? issued.replace(/\s+/g, "") : null);

  return { fields, signals };
}

type RegistryRow = {
  rank: string;
  purpose: string;
  receipt: string;
  cause: string;
  holder: string;
};

/** 등기목적 — 키워드만(뒤에 날짜·접수호가 붙지 않게) */
const REGISTRY_PURPOSE =
  "소유권보존|소유권이전|소유권경정|근저당권설정|근저당권이전|근저당권변경|근저당권말소|저당권설정|전세권설정|전세권이전|전세권말소|임차권설정|임차권등기명령|가압류|압류|경매개시결정|임의경매|강제경매|지상권설정|지역권설정";

function sliceRegistrySection(text: string, kind: "갑구" | "을구"): string {
  const startRe =
    kind === "갑구"
      ? /【?\s*갑\s*구\s*】?|갑\s*구\s*\(?소유권|\[갑\s*구\]/
      : /【?\s*을\s*구\s*】?|을\s*구\s*\(?소유권\s*이외|\[을\s*구\]/;
  const endRe =
    kind === "갑구"
      ? /【?\s*을\s*구\s*】?|을\s*구\s*\(?소유권\s*이외|\[을\s*구\]|주요\s*등기사항|열람일시|수수료|이\s*하\s*여\s*백/
      : /주요\s*등기사항|열람일시|수수료|이\s*하\s*여\s*백/;
  const sm = text.search(startRe);
  if (sm < 0) return "";
  const rest = text.slice(sm);
  const em = rest.slice(8).search(endRe);
  const body = em >= 0 ? rest.slice(0, 8 + em) : rest;
  return body
    .replace(/순위번호|등기목적|접\s*수|등기원인|권리자\s*및\s*기타사항/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .trim();
}

/** 갑구·을구 본문에서 등기 행을 최대한 뽑아낸다 */
function parseRegistryRows(section: string): RegistryRow[] {
  if (!section || section.replace(/\s/g, "").length < 10) return [];

  const rows: RegistryRow[] = [];
  const purposeRe = new RegExp(REGISTRY_PURPOSE, "g");
  const purposes = [...section.matchAll(purposeRe)];
  // PDF 표는 칸이 행 단위로 안 나오고, 주소·거래가액이 다음 등기목적 뒤에 붙는 경우가 많음
  const sectionHolders = extractRegistryHolders(section);

  if (!purposes.length) {
    const holder = sectionHolders[0] ?? section.replace(/\s+/g, " ").trim().slice(0, 500);
    if (holder) rows.push({ rank: "", purpose: "", receipt: "", cause: "", holder });
    return rows;
  }

  for (let i = 0; i < purposes.length; i++) {
    const m = purposes[i];
    // 등기목적은 「소유권이전」만 — 날짜·접수는 넣지 않음
    const purpose = cleanValue(m[0] ?? "");
    const start = m.index ?? 0;
    const end = i + 1 < purposes.length ? (purposes[i + 1].index ?? section.length) : section.length;
    const before = section.slice(Math.max(0, start - 40), start);
    const chunk = section.slice(start, Math.min(end, start + 1500));
    const rank =
      before.match(/(?:^|\n)\s*(\d{1,3})\s*$/)?.[1] ||
      before.match(/제\s*(\d+)\s*[호번]/)?.[1] ||
      String(i + 1);

    const receipt =
      capture(chunk, [
        /(\d{4}\s*년\s*\d{1,2}\s*월\s*\d{1,2}\s*일\s*제\s*\d+\s*호)/,
        /(\d{4}[.\-\/년]\d{1,2}[.\-\/월]\d{1,2}\s*일?\s*제\s*\d+\s*호)/,
        /접\s*수\s*[:：]?\s*([^\n]{6,40})/,
      ]) ?? "";

    // 등기원인: 「2026년1월27일 매매」— 날짜+원인 (매매만 단독으로 두지 않음)
    const cause = captureRegistryCause(chunk);
    // 권리자: 행 chunk에 이름만 있어도 섹션 전체에서 주소·거래가액까지 확장
    const holder =
      captureRegistryHolder(chunk, section) ||
      sectionHolders[i] ||
      "";

    if (!purpose && !receipt && !cause && !holder) continue;
    if (rows.some((r) => r.purpose === purpose && r.receipt === receipt && r.holder === holder)) continue;

    rows.push({
      rank,
      purpose,
      receipt: cleanValue(receipt).slice(0, 60),
      cause: cause.slice(0, 80),
      holder,
    });
  }

  // 행에 권리자가 비었는데 섹션에서만 잡힌 경우 보강
  if (sectionHolders.length && rows.every((r) => !r.holder || r.holder.length < 20)) {
    for (let i = 0; i < Math.min(rows.length, sectionHolders.length); i++) {
      if (!rows[i].holder || rows[i].holder.length < sectionHolders[i].length) {
        rows[i].holder = sectionHolders[i];
      }
    }
  }

  return rows.slice(0, 30);
}

// 「공유」는 「공유자」에 부분 매칭되지 않게 lookaround 사용
const REGISTRY_CAUSE_KIND =
  "매매|증여|상속|경매|판결|협의분할|교환|신탁|합유|공유(?!자)|유증|시효취득|설정계약|해제|해지|기부채납|현물출자";

const REGISTRY_DATE_RE = /(\d{4}\s*년\s*\d{1,2}\s*월\s*\d{1,2}\s*일)/g;

/** 접수란 날짜인지 — 날짜 직후(가까운 곳에) 「제N호」가 있으면 접수 */
function isReceiptDate(text: string, dateIndex: number, dateLen: number) {
  const after = text.slice(dateIndex + dateLen, dateIndex + dateLen + 24);
  return /^\s*제\s*\d+\s*호/.test(after);
}

/**
 * 등기원인 칸 전체. 예: 「2026년1월27일 매매」
 * 접수(…일 제N호)와 구분. 「매매」만 단독으로 반환하지 않는다.
 */
function captureRegistryCause(chunk: string): string {
  const kindRe = new RegExp(`(${REGISTRY_CAUSE_KIND})`, "g");
  for (const km of chunk.matchAll(kindRe)) {
    const kind = km[1];
    const kindAt = km.index ?? 0;
    const before = chunk.slice(0, kindAt);
    const dates = [...before.matchAll(REGISTRY_DATE_RE)];
    for (let i = dates.length - 1; i >= 0; i--) {
      const d = dates[i];
      const di = d.index ?? 0;
      if (isReceiptDate(chunk, di, d[0].length)) continue;
      // 원인 키워드와 날짜 사이가 너무 멀면(다른 칸) 스킵
      if (kindAt - (di + d[0].length) > 40) continue;
      return cleanValue(`${d[1]} ${kind}`);
    }
  }

  // 날짜와 원인이 붙어 있는 경우 (사이 공백·줄바꿈)
  const glued = chunk.match(
    new RegExp(`(\\d{4}\\s*년\\s*\\d{1,2}\\s*월\\s*\\d{1,2}\\s*일)\\s*(${REGISTRY_CAUSE_KIND})`)
  );
  if (glued) {
    const di = glued.index ?? 0;
    if (!isReceiptDate(chunk, di, glued[1].length)) {
      return cleanValue(`${glued[1]} ${glued[2]}`);
    }
  }

  const alt = chunk.match(
    new RegExp(`(\\d{4}[.\\-/]\\d{1,2}[.\\-/]\\d{1,2})\\s*(${REGISTRY_CAUSE_KIND})`)
  );
  if (alt) return cleanValue(`${alt[1]} ${alt[2]}`);

  return "";
}

function normalizeHolderText(s: string): string {
  return s
    .replace(/\r/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\s+\d{1,3}\s*$/, "")
    .trim()
    .slice(0, 600);
}

const HOLDER_ROLE =
  "소유자|근저당권자|채권자|전세권자|공유자|임차권자|수탁자|합유자";

/**
 * 섹션 전체에서 권리자 블록을 모은다.
 * PDF 표가 칸 단위로 풀려 이름·주소·거래가액 순서가 어긋나도,
 * n번째 이름 ↔ n번째 거래가액/채권최고액을 짝지어 복원한다.
 */
function extractRegistryHolders(section: string): string[] {
  if (!section) return [];

  const nameRe = new RegExp(
    `(?:(${HOLDER_ROLE})\\s*)?([가-힣]{2,8})\\s*(\\d{6})([\\d\\-*＊*]*)`,
    "g"
  );
  // PDF에 따라 「거래 가 액」「금 465,000,000 원」처럼 띄어쓰기가 끼기도 함
  const moneyRe = /(?:거\s*래\s*가\s*액|채\s*권\s*최\s*고\s*액)\s*금?\s*[\d,]+(?:\s*원)?/g;
  const names = [...section.matchAll(nameRe)].filter((m) => {
    // 등기목적·원인 키워드에 붙은 오탐 제외
    const prev = section.slice(Math.max(0, (m.index ?? 0) - 12), m.index ?? 0);
    if (/소유권|근저당|전세권|임차권|저당권/.test(prev)) return false;
    return true;
  });
  const moneys = [...section.matchAll(moneyRe)];

  const found: string[] = [];
  const usedMoney = new Set<number>();

  for (const n of names) {
    const nameAt = n.index ?? 0;
    // 이 이름 뒤에서 아직 안 쓴 첫 거래가액/채권최고액과 짝
    const money = moneys.find((m) => {
      const at = m.index ?? -1;
      return at > nameAt && at - nameAt < 1200 && !usedMoney.has(at);
    });
    if (!money || money.index == null) continue;
    usedMoney.add(money.index);

    const role = n[1] || "소유자";
    const person = `${n[2]} ${n[3]}${n[4] ?? ""}`.trim();
    // 주소는 (이전 거래가액 끝 ~ 이번 거래가액) 구간에 있는 경우가 많음
    let midStart = nameAt + n[0].length;
    for (const prev of moneys) {
      const at = prev.index ?? -1;
      if (at < 0 || at >= money.index) continue;
      const end = at + prev[0].length;
      if (end > midStart) midStart = end;
    }
    let mid = section.slice(midStart, money.index);
    // 사이에 끼어든 다른 행(등기목적·접수·다른 이름) 제거
    mid = mid
      .replace(new RegExp(REGISTRY_PURPOSE, "g"), " ")
      .replace(/\d{4}\s*년\s*\d{1,2}\s*월\s*\d{1,2}\s*일\s*제\s*\d+\s*호/g, " ")
      .replace(new RegExp(`\\d{4}\\s*년\\s*\\d{1,2}\\s*월\\s*\\d{1,2}\\s*일\\s*(?:${REGISTRY_CAUSE_KIND})`, "g"), " ")
      .replace(new RegExp(`(?:${HOLDER_ROLE})\\s*[가-힣]{2,8}\\s*\\d{6}[\\d\\-*＊*]*`, "g"), " ")
      .replace(/[가-힣]{2,8}\s*\d{6}[\d\-＊*]*/g, " ")
      .replace(/(?:거\s*래\s*가\s*액|채\s*권\s*최\s*고\s*액)\s*금?\s*[\d,]+(?:\s*원)?/g, " ")
      .replace(/(?:^|\s)\d{1,3}(?=\s)/g, " ");

    const block = normalizeHolderText(`${role} ${person} ${mid} ${money[0]}`);
    if (block.length >= 15) found.push(block);
  }

  if (found.length) return found.slice(0, 20);

  // 거래가액 텍스트가 없을 때: 역할+이름+주소 형태
  for (const m of section.matchAll(
    new RegExp(
      `(?:${HOLDER_ROLE})\\s*[가-힣]{2,20}\\s*\\d{6}[\\d\\-*＊*]*[\\s\\S]{0,280}?(?:시|도)\\s*[가-힣]+(?:시|군|구)[\\s\\S]{0,160}?\\d+\\s*호`,
      "g"
    )
  )) {
    const v = normalizeHolderText(m[0]);
    if (v.length >= 15) found.push(v);
  }

  // 최후: 이름+주민번호만이라도 (주소는 PDF 텍스트에 없는 경우)
  if (!found.length) {
    for (const n of names.slice(0, 5)) {
      const role = n[1] || "소유자";
      const v = normalizeHolderText(`${role} ${n[2]} ${n[3]}${n[4] ?? ""}`);
      if (v.length >= 8) found.push(v);
    }
  }

  return found.slice(0, 20);
}

/**
 * 권리자 및 기타사항 칸 전체.
 * 예: 소유자 차상현 921216-******* 경기도 … 910동 1403호 … 거래가액 금465,000,000원
 */
function captureRegistryHolder(chunk: string, section: string): string {
  // 1) chunk 안 이름·주민번호로 섹션에서 거래가액까지 확장
  const nameHit = chunk.match(
    new RegExp(`(?:${HOLDER_ROLE})\\s*([가-힣]{2,20})\\s*(\\d{6})|([가-힣]{2,8})\\s*(\\d{6})`)
  );
  if (nameHit) {
    const name = nameHit[1] || nameHit[3];
    const id6 = nameHit[2] || nameHit[4];
    if (name && id6) {
      const re = new RegExp(
        `(?:${HOLDER_ROLE}\\s*)?${name}\\s*${id6}[\\d\\-*＊*]*([\\s\\S]{0,500}?)((?:거\\s*래\\s*가\\s*액|채\\s*권\\s*최\\s*고\\s*액)\\s*금?\\s*[\\d,]+(?:\\s*원)?)`
      );
      const full = section.match(re);
      if (full) {
        const prefix = full[0].startsWith("소유자") || /근저당|채권|전세|공유|임차|수탁|합유/.test(full[0])
          ? ""
          : "소유자 ";
        return normalizeHolderText(prefix + full[0]);
      }

      // 거래가액 없이 주소만 있는 경우
      const addrRe = new RegExp(
        `(?:${HOLDER_ROLE}\\s*)?${name}\\s*${id6}[\\d\\-*＊*]*([\\s\\S]{0,280}?(?:시|도)\\s*[가-힣]+(?:시|군|구)[\\s\\S]{0,160}?\\d+\\s*호)`
      );
      const addr = section.match(addrRe);
      if (addr) return normalizeHolderText(addr[0]);
    }
  }

  // 2) chunk 안에서만이라도 역할+이름부터 끝까지
  let searchFrom = 0;
  const kinds = [...chunk.matchAll(new RegExp(`(${REGISTRY_CAUSE_KIND})`, "g"))];
  if (kinds.length) {
    const last = kinds[kinds.length - 1];
    searchFrom = (last.index ?? 0) + last[0].length;
  } else {
    const receipt = chunk.match(/\d{4}\s*년\s*\d{1,2}\s*월\s*\d{1,2}\s*일\s*제\s*\d+\s*호/);
    if (receipt && receipt.index != null) searchFrom = receipt.index + receipt[0].length;
  }

  const rest = chunk.slice(searchFrom);
  const start = rest.search(new RegExp(`${HOLDER_ROLE}|[가-힣]{2,8}\\s*\\d{6}`));
  if (start < 0) return "";

  let body = rest.slice(start);
  // chunk 한정 폴백에서는 다음 등기목적으로 자름
  const next = body.slice(4).search(new RegExp(REGISTRY_PURPOSE));
  if (next >= 0) body = body.slice(0, 4 + next);
  return normalizeHolderText(body);
}

function joinRegistryColumn(rows: RegistryRow[], key: keyof RegistryRow): string {
  // 순위번호(예: 28)는 붙이지 않음 — 등기목적·원인·권리자 내용만
  return rows
    .map((r) => r[key]?.trim() ?? "")
    .filter(Boolean)
    .join("\n");
}

/** 표 헤더·칸 제목이 주소로 잡히지 않게 걸러낸다 */
function looksLikeRegistryHeaderJunk(v: string) {
  return /건물명칭|건물내역|등기원인|권리자\s*및|기타사항|표\s*제\s*부|갑\s*구|을\s*구|순위번호|등기목적/.test(v);
}

/**
 * 등기사항증명서 소재지.
 * 실제 주소는 `[집합건물] 경기도 …`처럼 괄호 유형 바로 옆에 온다.
 * 「소재지」 칸 제목 뒤는 표 헤더가 이어져 잘못 잡히기 쉬워 후순위로만 쓴다.
 */
function captureRegistryLocation(text: string): string | null {
  const bracket = text.match(
    /\[\s*(집합건물|토지|건물)\s*\]\s*([^\n【\[]{10,160})/
  );
  if (bracket?.[2]) {
    let v = cleanValue(bracket[2]);
    // 같은 줄에 표제부가 붙으면 자른다
    v = v.split(/【|\s*표\s*제\s*부/)[0]?.trim() ?? v;
    v = v.replace(/\s+/g, " ").trim();
    if (v.length >= 10 && !looksLikeRegistryHeaderJunk(v)) return v;
  }

  // 폴백: 시·도/시·군·구가 보이는 경우만 「소재지」 라벨 뒤를 허용
  const labeled = capture(text, [
    /소재지\s*[:：]?\s*((?:서울|부산|대구|인천|광주|대전|울산|세종|경기|강원|충북|충남|전북|전남|경북|경남|제주)[^\n【]{6,120})/,
  ]);
  if (labeled && !looksLikeRegistryHeaderJunk(labeled)) return labeled;

  return null;
}

/** 갑구/을구 권리자 문자열. 섹션이 짧으면 본문에서 한 번 더 찾는다. */
function pickRegistryHolders(text: string, section: string, kind: "갑구" | "을구"): string {
  const fromSection = extractRegistryHolders(section);
  const hasMoney = (h: string) => /거래\s*가\s*액|채권\s*최고\s*액|금\s*[\d,]+/.test(h);
  if (fromSection.some(hasMoney)) return fromSection.join("\n");

  const wide = extractRegistryHolders(text);
  const filtered =
    kind === "갑구"
      ? wide.filter((h) => /소유자|거래\s*가\s*액/.test(h) && !/근저당권자|채권\s*최고/.test(h))
      : wide.filter((h) => /근저당권자|채권자|전세권자|임차권자|채권\s*최고/.test(h));
  if (filtered.some(hasMoney)) return filtered.join("\n");
  if (fromSection.length) return fromSection.join("\n");
  if (filtered.length) return filtered.join("\n");
  return wide.join("\n");
}

function parseRegistry(text: string): ParseResult {
  const fields: ExtractedField[] = [];
  const signals: ExtractedSignal[] = [];

  const gapSection = sliceRegistrySection(text, "갑구");
  const eulSection = sliceRegistrySection(text, "을구");
  const fromGapSection = parseRegistryRows(gapSection);
  const fromEulSection = parseRegistryRows(eulSection);
  const fromWhole = !gapSection && !eulSection ? parseRegistryRows(text) : [];

  const gapOnly =
    fromGapSection.length > 0
      ? fromGapSection
      : fromWhole.filter((r) => /소유권|보존|이전|경정/.test(r.purpose) || !r.purpose);
  const eulOnly =
    fromEulSection.length > 0
      ? fromEulSection
      : fromWhole.filter((r) => /근저당|저당|전세|임차|가압류|압류|경매|지상|지역/.test(r.purpose));

  // 등기사항증명서 추출 항목(이 8개만): 소유자, 소재지, 갑구·을구 등기목적/등기원인/권리자
  const ownerFromGap =
    gapOnly
      .map((r) => r.holder.match(/소유자\s*([가-힣]{2,20})/)?.[1] ?? r.holder.match(/^([가-힣]{2,8})\s*\d{6}/)?.[1])
      .find(Boolean) ?? null;
  const owner = capture(text, [
    /소유자\s*[:：]?\s*([가-힣]{2,20})/,
    /명의인\s*[:：]?\s*([가-힣]{2,20})/,
  ]);
  pushField(fields, "소유자", owner || (ownerFromGap ? cleanValue(ownerFromGap) : null));
  pushField(fields, "소재지", captureRegistryLocation(text));

  const gapPurpose = joinRegistryColumn(gapOnly, "purpose");
  const gapCause = joinRegistryColumn(gapOnly, "cause");
  // 권리자: 표 칸 순서가 깨져도 이름↔거래가액 짝으로 복원. 섹션이 짧게 잘리면 본문 전체에서 보강
  const gapHolder = pickRegistryHolders(text, gapSection, "갑구") || joinRegistryColumn(gapOnly, "holder");
  if (gapPurpose) pushField(fields, "갑구 등기목적", gapPurpose.slice(0, 1000));
  if (gapCause) pushField(fields, "갑구 등기원인", gapCause.slice(0, 1000));
  if (gapHolder) pushField(fields, "갑구 권리자 및 기타사항", gapHolder.slice(0, 1500));

  const eulPurpose = joinRegistryColumn(eulOnly, "purpose");
  const eulCause = joinRegistryColumn(eulOnly, "cause");
  const eulHolder = pickRegistryHolders(text, eulSection, "을구") || joinRegistryColumn(eulOnly, "holder");
  if (eulPurpose) pushField(fields, "을구 등기목적", eulPurpose.slice(0, 1000));
  if (eulCause) pushField(fields, "을구 등기원인", eulCause.slice(0, 1000));
  if (eulHolder) pushField(fields, "을구 권리자 및 기타사항", eulHolder.slice(0, 1500));

  return { fields, signals };
}

function parseLandLedger(text: string): ParseResult {
  const fields: ExtractedField[] = [];
  const category = capture(text, [/지\s*목\s*[:：]?\s*([가-힣]{1,10})/]);
  pushField(fields, "지목", category);
  const area = capture(text, [/면\s*적\s*[:：]?\s*([\d,.]+)\s*(?:㎡|m2)?/i]);
  if (area) pushField(fields, "면적", areaValue(area), area);
  const owner = capture(text, [/소유자\s*[:：]?\s*([가-힣]{2,20})/]);
  pushField(fields, "소유자", owner);
  const issued = capture(text, [/발\s*급\s*일\s*[:：]?\s*([\d.\-\/년월일\s]{6,20})/]);
  pushField(fields, "발급일", issued ? issued.replace(/\s+/g, "") : null);
  return { fields, signals: [] };
}

function percentValue(raw: string) {
  const m = raw.replace(/,/g, "").match(/(\d+(?:\.\d+)?)\s*%?/);
  if (!m) return cleanValue(raw);
  return m[0].includes("%") ? m[0].replace(/\s/g, "") : `${m[1]}%`;
}

function pricePerM2(raw: string) {
  const digits = raw.replace(/[^\d.]/g, "");
  if (!digits) return cleanValue(raw);
  const n = Number(digits);
  return Number.isFinite(n) ? String(Math.round(n)) : cleanValue(raw);
}

/** 부동산종합공부(토지·건축·토지이용계획 요약) */
function parseComprehensiveCadastre(text: string): ParseResult {
  const fields: ExtractedField[] = [];

  pushField(
    fields,
    "토지 소재지",
    capture(text, [
      /토\s*지\s*소\s*재\s*지\s*[:：]?\s*([^\n]{8,80})/,
      /소\s*재\s*지\s*[:：]?\s*([^\n]{8,80})/,
      /대\s*지\s*위\s*치\s*[:：]?\s*([^\n]{8,80})/,
      /\[소재지\]\s*([^\n]{8,80})/,
    ])
  );
  pushField(fields, "토지 지목", capture(text, [/지\s*목\s*[:：]?\s*([가-힣]{1,10})/]));

  const landArea = capture(text, [
    /대\s*지\s*면\s*적\s*[:：]?\s*([\d,.]+)\s*(?:㎡|m2)?/i,
    /토\s*지\s*면\s*적\s*[:：]?\s*([\d,.]+)\s*(?:㎡|m2)?/i,
    /면\s*적\s*[:：]?\s*([\d,.]+)\s*(?:㎡|m2)?/i,
  ]);
  if (landArea) pushField(fields, "토지 면적", areaValue(landArea), landArea);

  const officialPrice = capture(text, [
    /개\s*별\s*공\s*시\s*지\s*가\s*[:：]?\s*([^\n]{3,40})/,
    /공\s*시\s*지\s*가\s*[:：]?\s*([^\n]{3,40})/,
    /개별공시지가\s*([^\n]{3,40})/,
  ]);
  if (officialPrice) pushField(fields, "개별공시지가", pricePerM2(officialPrice), officialPrice);

  const coverage = capture(text, [
    /건\s*폐\s*율\s*(?:상한|기준|지정)?\s*[:：]?\s*([\d,.]+)\s*%?/,
    /건폐율\s*([\d,.]+)\s*%?/,
  ]);
  if (coverage) pushField(fields, "건축물 건폐율", percentValue(coverage), coverage);

  const far = capture(text, [
    /용\s*적\s*률\s*(?:상한|기준|지정)?\s*[:：]?\s*([\d,.]+)\s*%?/,
    /용적률\s*([\d,.]+)\s*%?/,
  ]);
  if (far) pushField(fields, "건축물 용적률", percentValue(far), far);

  const useZone = capture(text, [
    /용\s*도\s*지\s*역\s*[:：]?\s*([^\n]{2,80})/,
    /「국토의\s*계획[^」]*」[^:\n]*[:：]?\s*([^\n]{2,80})/,
    /(제[1-3]종일반주거지역|제[1-3]종전용주거지역|준주거지역|일반상업지역|근린상업지역|중심상업지역|유통상업지역|일반공업지역|준공업지역|전용공업지역|자연녹지지역|생산녹지지역|보전녹지지역|관리지역|농림지역|자연환경보전지역)[^\n]{0,40}/,
  ]);
  pushField(fields, "용도지역", useZone);

  return { fields, signals: [] };
}

function parseLandUse(text: string): ParseResult {
  const fields: ExtractedField[] = [];
  pushField(fields, "용도지역", capture(text, [/용도지역\s*[:：]?\s*([^\n]{2,40})/]));
  pushField(fields, "용도지구", capture(text, [/용도지구\s*[:：]?\s*([^\n]{2,40})/]));
  pushField(fields, "용도구역", capture(text, [/용도구역\s*[:：]?\s*([^\n]{2,40})/]));
  const issued = capture(text, [/발\s*급\s*일\s*[:：]?\s*([\d.\-\/년월일\s]{6,20})/]);
  pushField(fields, "발급일", issued ? issued.replace(/\s+/g, "") : null);
  return { fields, signals: [] };
}

function parseCadastral(text: string): ParseResult {
  const fields: ExtractedField[] = [];
  pushField(fields, "소재지", capture(text, [/소재지\s*[:：]?\s*([^\n]{8,80})/]));
  const issued = capture(text, [/발\s*급\s*일\s*[:：]?\s*([\d.\-\/년월일\s]{6,20})/]);
  pushField(fields, "발급일", issued ? issued.replace(/\s+/g, "") : null);
  return { fields, signals: [] };
}

/** 공부서류 PDF 텍스트에서 프리셋 항목 추출 (규칙 기반, LLM 없음) */
export function parseDocumentText(docType: DocType | string, rawText: string): ParseResult {
  const text = norm(rawText);
  if (text.replace(/\s/g, "").length < 20) {
    return { fields: [], signals: [] };
  }

  switch (docType) {
    case "건축물대장":
      return parseBuildingLedger(text);
    case "등기사항증명서":
      return parseRegistry(text);
    case "토지대장":
      return parseLandLedger(text);
    case "부동산종합공부":
      return parseComprehensiveCadastre(text);
    case "토지이용계획확인서":
      return parseLandUse(text);
    case "지적도":
      return parseCadastral(text);
    default: {
      const fields: ExtractedField[] = [];
      const exclusive = capture(text, [/전용면적\s*[:：]?\s*([\d,.]+)/i]);
      if (exclusive) pushField(fields, "전용면적", areaValue(exclusive), exclusive);
      return { fields, signals: [] };
    }
  }
}
