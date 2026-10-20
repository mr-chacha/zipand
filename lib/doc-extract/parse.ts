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

const REGISTRY_PURPOSE =
  "(?:소유권보존|소유권이전|소유권경정|근저당권설정|근저당권이전|근저당권변경|근저당권말소|저당권설정|전세권설정|전세권이전|전세권말소|임차권설정|임차권등기명령|가압류|압류|경매개시결정|임의경매|강제경매|지상권설정|지역권설정|말소|경정|변경|이전|설정|보존)[가-힣0-9()\\s]{0,24}";

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

function formatRegistryRow(r: RegistryRow): string {
  return [
    r.rank && `[${r.rank}]`,
    r.purpose && `등기목적: ${r.purpose}`,
    r.receipt && `접수: ${r.receipt}`,
    r.cause && `등기원인: ${r.cause}`,
    r.holder && `권리자 및 기타사항: ${r.holder}`,
  ]
    .filter(Boolean)
    .join(" / ");
}

/** 갑구·을구 본문에서 등기 행을 최대한 뽑아낸다 */
function parseRegistryRows(section: string): RegistryRow[] {
  if (!section || section.replace(/\s/g, "").length < 10) return [];

  const rows: RegistryRow[] = [];
  const purposeRe = new RegExp(REGISTRY_PURPOSE, "g");
  const purposes = [...section.matchAll(purposeRe)];
  if (!purposes.length) {
    const compact = section.replace(/\s+/g, " ").trim().slice(0, 500);
    if (compact) rows.push({ rank: "", purpose: "", receipt: "", cause: "", holder: compact });
    return rows;
  }

  for (let i = 0; i < purposes.length; i++) {
    const m = purposes[i];
    const purpose = cleanValue(m[0] ?? "").slice(0, 40);
    const start = m.index ?? 0;
    const end = i + 1 < purposes.length ? (purposes[i + 1].index ?? section.length) : section.length;
    const before = section.slice(Math.max(0, start - 40), start);
    const chunk = section.slice(start, Math.min(end, start + 600));
    const rank =
      before.match(/(?:^|\n)\s*(\d{1,3})\s*$/)?.[1] ||
      before.match(/제\s*(\d+)\s*[호번]/)?.[1] ||
      String(i + 1);

    const receipt =
      capture(chunk, [
        /(\d{4}\s*년\s*\d{1,2}\s*월\s*\d{1,2}\s*일\s*제\s*\d+\s*호)/,
        /(\d{4}[.\-\/년]\d{1,2}[.\-\/월]\d{1,2}\s*일?\s*제?\s*\d+\s*호?)/,
        /접\s*수\s*[:：]?\s*([^\n]{6,40})/,
      ]) ?? "";

    const cause =
      capture(chunk, [
        /등기원인\s*[:：]?\s*([^\n]{2,40})/,
        /(매매|증여|상속|경매|판결|협의분할|교환|신탁|합유|공유|유증|시효취득)/,
      ]) ?? "";

    let holder =
      capture(chunk, [
        /권리자\s*및\s*기타사항\s*[:：]?\s*([^\n]{2,120})/,
        /소유자\s*[:：]?\s*([가-힣A-Za-z0-9()·\s]{2,40})/,
        /근저당권자\s*[:：]?\s*([^\n]{2,60})/,
        /채권자\s*[:：]?\s*([^\n]{2,60})/,
        /전세권자\s*[:：]?\s*([^\n]{2,60})/,
      ]) ?? "";

    if (!holder) {
      const afterPurpose = chunk.replace(purpose, "").replace(/\s+/g, " ").trim();
      const nameHit = afterPurpose.match(/([가-힣]{2,8})\s*(?:\(공유자|\(소유자|외\s*\d)/);
      const moneyHit = afterPurpose.match(/(채권최고액\s*금?\s*[\d,]+원?)/);
      holder = [nameHit?.[1], moneyHit?.[1]].filter(Boolean).join(" · ");
    }

    holder = cleanValue(holder).slice(0, 200);
    if (!purpose && !receipt && !cause && !holder) continue;
    if (rows.some((r) => r.purpose === purpose && r.receipt === receipt && r.holder === holder)) continue;

    rows.push({
      rank,
      purpose,
      receipt: cleanValue(receipt).slice(0, 60),
      cause: cleanValue(cause).slice(0, 40),
      holder,
    });
  }

  return rows.slice(0, 30);
}

function joinRegistryColumn(rows: RegistryRow[], key: keyof RegistryRow): string {
  return rows
    .map((r) => {
      const v = r[key]?.trim();
      if (!v) return "";
      return r.rank ? `${r.rank}. ${v}` : v;
    })
    .filter(Boolean)
    .join("\n");
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

  const gapSummary = gapOnly.map(formatRegistryRow).filter(Boolean).join("\n");
  const eulSummary = eulOnly.map(formatRegistryRow).filter(Boolean).join("\n");

  if (gapSummary) pushField(fields, "갑구", gapSummary.slice(0, 2000), gapSummary.slice(0, 200));
  if (eulSummary) pushField(fields, "을구", eulSummary.slice(0, 2000), eulSummary.slice(0, 200));

  const gapPurpose = joinRegistryColumn(gapOnly, "purpose");
  const gapReceipt = joinRegistryColumn(gapOnly, "receipt");
  const gapCause = joinRegistryColumn(gapOnly, "cause");
  const gapHolder = joinRegistryColumn(gapOnly, "holder");
  if (gapPurpose) pushField(fields, "갑구 등기목적", gapPurpose.slice(0, 1000));
  if (gapReceipt) pushField(fields, "갑구 접수", gapReceipt.slice(0, 1000));
  if (gapCause) pushField(fields, "갑구 등기원인", gapCause.slice(0, 1000));
  if (gapHolder) pushField(fields, "갑구 권리자 및 기타사항", gapHolder.slice(0, 1500));

  const eulPurpose = joinRegistryColumn(eulOnly, "purpose");
  const eulReceipt = joinRegistryColumn(eulOnly, "receipt");
  const eulCause = joinRegistryColumn(eulOnly, "cause");
  const eulHolder = joinRegistryColumn(eulOnly, "holder");
  if (eulPurpose) pushField(fields, "을구 등기목적", eulPurpose.slice(0, 1000));
  if (eulReceipt) pushField(fields, "을구 접수", eulReceipt.slice(0, 1000));
  if (eulCause) pushField(fields, "을구 등기원인", eulCause.slice(0, 1000));
  if (eulHolder) pushField(fields, "을구 권리자 및 기타사항", eulHolder.slice(0, 1500));

  const ownerFromGap =
    gapOnly
      .map((r) => r.holder)
      .find((h) => h && /[가-힣]{2,}/.test(h) && !/채권최고|금\s*[\d,]/.test(h)) ?? null;
  const owner = capture(text, [
    /소유자\s*[:：]?\s*([가-힣]{2,20})/,
    /명의인\s*[:：]?\s*([가-힣]{2,20})/,
  ]);
  pushField(fields, "소유자", owner || (ownerFromGap ? cleanValue(ownerFromGap).slice(0, 40) : null));

  const loc = capture(text, [
    /\[?\s*소재지\s*\]?\s*[:：]?\s*([^\n]{8,80})/,
    /부동산의\s*표시[^\n]*\n\s*([^\n]{8,80})/,
  ]);
  pushField(fields, "소재지", loc);

  const mortgageAmount = capture(text, [
    /채권최고액\s*[:：]?\s*(금?\s*[\d,]+원?)/,
    /최고액\s*[:：]?\s*(금?\s*[\d,]+원?)/,
  ]);
  pushField(fields, "근저당권 채권최고액", mortgageAmount);

  const mortgagee = capture(text, [/근저당권자\s*[:：]?\s*([^\n]{2,40})/, /채권자\s*[:：]?\s*([^\n]{2,40})/]);
  pushField(fields, "근저당권자", mortgagee);

  if (/압류|가압류/.test(text) || eulOnly.some((r) => /압류|가압류/.test(r.purpose))) {
    const hit = text.match(/.{0,20}(압류|가압류).{0,40}/)?.[0];
    pushField(fields, "압류·가압류", "기재 있음");
    signals.push({
      level: "전문가 검토",
      title: "압류·가압류 기재",
      description: "등기부에 압류 또는 가압류 관련 문구가 있어요.",
      evidence_text: hit?.slice(0, 200),
      next_action: "등기 원문을 확인하고 필요 시 전문가 검토를 받으세요.",
    });
  }

  if (/전세권|임차권/.test(text) || eulOnly.some((r) => /전세|임차/.test(r.purpose))) {
    pushField(fields, "전세권·임차권", "기재 있음");
  }

  const issued = capture(text, [/발급[^\n]{0,6}([\d.\-\/년월일\s]{6,20})/, /열람일시\s*[:：]?\s*([\d.\-\/\s:]{8,30})/]);
  pushField(fields, "발급일", issued ? issued.replace(/\s+/g, " ").trim() : null);

  if (mortgageAmount || mortgagee || eulOnly.some((r) => /근저당|저당/.test(r.purpose))) {
    signals.push({
      level: "확인 필요",
      title: "근저당권·을구 확인",
      description: "을구(근저당 등) 등기목적·접수·원인·권리자를 원문과 대조하세요.",
      next_action: "잔금·인수 조건에 반영할지 확인하세요.",
    });
  }

  if (gapSummary || eulSummary) {
    signals.push({
      level: "참고",
      title: "갑구·을구 추출",
      description:
        "갑구·을구의 등기목적·접수·등기원인·권리자 및 기타사항을 읽었어요. 누락이 없는지 원문과 맞춰 주세요.",
      next_action: "확인설명서 권리관계에 반영하기 전 검토하세요.",
    });
  }

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

/** 부동산종합공부(토지·건축 요약) */
function parseComprehensiveCadastre(text: string): ParseResult {
  const fields: ExtractedField[] = [];

  pushField(fields, "소재지", capture(text, [/소\s*재\s*지\s*[:：]?\s*([^\n]{8,80})/, /\[소재지\]\s*([^\n]{8,80})/]));
  pushField(fields, "지목", capture(text, [/지\s*목\s*[:：]?\s*([가-힣]{1,10})/]));
  pushField(fields, "소유자", capture(text, [/소\s*유\s*자\s*[:：]?\s*([가-힣]{2,30})/, /명의인\s*[:：]?\s*([가-힣]{2,30})/]));

  const useRaw = capture(text, [
    /주\s*용\s*도\s*[:：]?\s*([^\n]{2,60})/,
    /주용도\s*[:：]?\s*([가-힣A-Za-z0-9·\/()\s]{2,60})/,
    /(공동주택|단독주택|다가구주택|다세대주택|연립주택)(?:\s*\([^)\n]{0,20}\))?/,
  ]);
  pushField(fields, "주용도", useRaw ? cleanMainUse(useRaw) : null, useRaw ?? undefined);

  const structure = capture(text, [
    /주\s*구\s*조\s*[:：]?\s*([^\n]{2,40})/,
    /구\s*조\s*[:：]?\s*([^\n]{2,40})/,
    /(철근콘크리트구조|철골철근콘크리트구조|철근콘크리트조|철골구조)/,
  ]);
  pushField(fields, "구조", structure);

  const landArea = capture(text, [
    /대\s*지\s*면\s*적\s*[:：]?\s*([\d,.]+)\s*(?:㎡|m2)?/i,
    /대지면적\s*([\d,.]+)/i,
  ]);
  if (landArea) pushField(fields, "대지면적", areaValue(landArea), landArea);

  const archArea = capture(text, [
    /건\s*축\s*면\s*적\s*[:：]?\s*([\d,.]+)\s*(?:㎡|m2)?/i,
    /건축면적\s*([\d,.]+)/i,
  ]);
  if (archArea) pushField(fields, "건축면적", areaValue(archArea), archArea);

  const totalArea = capture(text, [
    /연\s*면\s*적\s*[:：]?\s*([\d,.]+)\s*(?:㎡|m2)?/i,
    /연면적\s*([\d,.]+)/i,
  ]);
  if (totalArea) pushField(fields, "연면적", areaValue(totalArea), totalArea);

  // 토지 면적만 있고 대지면적 라벨이 없는 경우
  if (!landArea) {
    const area = capture(text, [/(?:^|\n)\s*면\s*적\s*[:：]?\s*([\d,.]+)\s*(?:㎡|m2)?/i]);
    if (area) pushField(fields, "대지면적", areaValue(area), area);
  }

  const coverage = capture(text, [
    /건\s*폐\s*율\s*(?:상한|기준|지정)?\s*[:：]?\s*([\d,.]+)\s*%?/,
    /건폐율\s*([\d,.]+)\s*%?/,
  ]);
  if (coverage) pushField(fields, "건폐율", percentValue(coverage), coverage);

  const far = capture(text, [
    /용\s*적\s*률\s*(?:상한|기준|지정)?\s*[:：]?\s*([\d,.]+)\s*%?/,
    /용적률\s*([\d,.]+)\s*%?/,
  ]);
  if (far) pushField(fields, "용적률", percentValue(far), far);

  const officialPrice = capture(text, [
    /개\s*별\s*공\s*시\s*지\s*가\s*[:：]?\s*([^\n]{3,40})/,
    /공\s*시\s*지\s*가\s*[:：]?\s*([^\n]{3,40})/,
    /개별공시지가\s*([^\n]{3,40})/,
  ]);
  if (officialPrice) pushField(fields, "개별공시지가", pricePerM2(officialPrice), officialPrice);

  const issued = capture(text, [/발\s*급\s*일\s*[:：]?\s*([\d.\-\/년월일\s]{6,20})/, /열\s*람\s*일\s*[:：]?\s*([\d.\-\/년월일\s]{6,20})/]);
  pushField(fields, "발급일", issued ? issued.replace(/\s+/g, "") : null);

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
