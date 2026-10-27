import { DOC_TYPE_TO_DISCLOSURE_CHECK, type DocType } from "@/lib/constants";

export type PropertyDocForDisclosure = {
  id: string;
  docType: string;
  fileName: string;
  issuedAt: string | null;
  fields: { label: string; value: string }[];
};

export type PropertyDocsDisclosureResult = {
  /** 확인설명서 data에 merge할 값 */
  fields: Record<string, string>;
  /** UI 안내용 요약 */
  summary: string[];
  documentCount: number;
};

/** document_fields.label → 확인설명서 키 (수동 입력분, AI 없음) */
const LABEL_TO_KEY: Record<string, string> = {
  // 소유자는 갑구보다 짧게 나오므로 갑구 없을 때만 별도 처리
  소재지: "property_address",
  주용도: "building_use",
  전용면적: "building_area",
  구조: "building_structure",
  지목: "land_category",
  면적: "land_area",
  대지면적: "land_area",
  용도지역: "use_zone",
  용도지구: "use_district",
  용도구역: "use_area",
  건폐율: "building_coverage_limit",
  용적률: "floor_area_limit",
  개별공시지가: "land_price_per_m2",
};

function appendLine(existing: string | undefined, line: string) {
  const cur = existing?.trim() ?? "";
  if (!cur) return line;
  if (cur.includes(line)) return cur;
  return `${cur}\n${line}`;
}

function yearFromDate(value: string) {
  const m = value.trim().match(/(\d{4})/);
  return m?.[1] ?? "";
}

/**
 * 매물에 업로드된 서류·수동 입력 필드를 확인설명서 칸에 매핑한다.
 * document_fields(자동 추출·수동 입력)에 있는 값만 사용한다.
 */
export function mapPropertyDocsToDisclosure(
  docs: PropertyDocForDisclosure[],
  property?: {
    address?: string | null;
    areaM2?: number | null;
    title?: string | null;
    building?: string | null;
    unit?: string | null;
    structure?: string | null;
    mainUse?: string | null;
  } | null
): PropertyDocsDisclosureResult {
  const out: Record<string, string> = {};
  const summary: string[] = [];
  let ownerName = "";

  // 근거자료 체크: 기본 전부 → 있는 종류만 1
  for (const key of [
    "doc_title_deed",
    "doc_registry",
    "doc_land_ledger",
    "doc_building_ledger",
    "doc_cadastral",
    "doc_land_use",
  ]) {
    out[key] = "0";
  }
  out.doc_other = "";

  const otherNames: string[] = [];

  for (const doc of docs) {
    const docType = doc.docType as DocType;
    const checkKey = DOC_TYPE_TO_DISCLOSURE_CHECK[docType];
    if (checkKey === "doc_other") {
      otherNames.push(docType);
      out.doc_other = otherNames.join(", ");
      out.doc_other_flag = "1";
    } else if (checkKey) {
      out[checkKey] = "1";
    } else if (docType === "기타") {
      otherNames.push(doc.fileName || "기타");
      out.doc_other = otherNames.join(", ");
      out.doc_other_flag = "1";
    }
    summary.push(`${doc.docType} (${doc.fileName})`);

    for (const f of doc.fields) {
      const label = f.label.trim();
      const value = f.value.trim();
      if (!value) continue;

      if (label === "소유자") {
        if (!ownerName) ownerName = value;
        continue;
      }
      if (label === "위반건축물 여부") {
        out.building_ledger_status = /위반|해당/.test(value) && !/해당\s*없|미해당|없음/.test(value) ? "위반" : "적법";
        continue;
      }
      if (label === "사용승인일" || label === "사용승인일자") {
        if (!out.use_approval_date) out.use_approval_date = value;
        const y = yearFromDate(value);
        if (y && !out.building_year) out.building_year = y;
        continue;
      }
      if (label === "허가일" || label === "허가일자" || label === "건축허가일") {
        if (!out.permit_date) out.permit_date = value;
        continue;
      }
      // 갑구·을구 요약 → 확인설명서 권리관계 (세부 컬럼은 문서 상세에서 검토)
      if (label === "갑구") {
        if (!out.ownership_building) out.ownership_building = value;
        continue;
      }
      if (label === "갑구(소유권에 관한 사항)") {
        if (!out.ownership_building) out.ownership_building = value;
        continue;
      }
      if (label === "을구") {
        if (!out.rights_building) out.rights_building = value;
        continue;
      }
      if (label === "을구(소유권 외의 권리에 관한 사항)") {
        if (!out.rights_building) out.rights_building = value;
        continue;
      }
      if (
        label === "갑구 등기목적" ||
        label === "갑구 등기원인" ||
        label === "갑구 권리자 및 기타사항" ||
        label === "갑구 접수" // 과거 추출분
      ) {
        if (!out.ownership_building) {
          out.ownership_building = appendLine(out.ownership_building, `${label.replace(/^갑구\s*/, "")}: ${value}`);
        }
        continue;
      }
      if (
        label === "을구 등기목적" ||
        label === "을구 등기원인" ||
        label === "을구 권리자 및 기타사항" ||
        label === "을구 접수" // 과거 추출분
      ) {
        if (!out.rights_building) {
          out.rights_building = appendLine(out.rights_building, `${label.replace(/^을구\s*/, "")}: ${value}`);
        }
        continue;
      }
      if (label === "근저당권 채권최고액" || label === "근저당권자" || label === "압류·가압류" || label === "전세권·임차권") {
        out.rights_building = appendLine(out.rights_building, `${label}: ${value}`);
        continue;
      }
      if (label === "발급일") continue;

      if (label === "건축면적") {
        if (!out.arch_area) {
          const n = value.replace(/,/g, "").match(/(\d+(?:\.\d+)?)/);
          out.arch_area = n?.[1] ?? value;
        }
        continue;
      }
      if (label === "연면적") {
        if (!out.total_floor_area) {
          const n = value.replace(/,/g, "").match(/(\d+(?:\.\d+)?)/);
          out.total_floor_area = n?.[1] ?? value;
        }
        continue;
      }

      if (label === "개별공시지가") {
        if (!out.land_price_per_m2) {
          const n = value.replace(/[^\d.]/g, "");
          out.land_price_per_m2 = n || value;
        }
        continue;
      }

      if (label === "건폐율" || label === "용적률") {
        const key = LABEL_TO_KEY[label];
        if (key && !out[key]) out[key] = value.includes("%") ? value : `${value}%`;
        continue;
      }

      const key = LABEL_TO_KEY[label];
      if (key && !out[key]) out[key] = value;
    }
  }

  // 갑구 요약이 없을 때만 소유자 이름 사용
  if (!out.ownership_building && ownerName) {
    out.ownership_building = ownerName;
  }

  if (property?.address?.trim() && !out.property_address) {
    out.property_address = property.address.trim();
  }
  if (property?.title?.trim() && !out.property_title) {
    out.property_title = property.title.trim();
  }
  if (property?.building?.trim() && !out.building) {
    out.building = property.building.trim();
  }
  if (property?.unit?.trim() && !out.unit) {
    out.unit = property.unit.trim();
  }
  if (property?.structure?.trim() && !out.building_structure) {
    out.building_structure = property.structure.trim();
  }
  if (property?.mainUse?.trim() && !out.building_use) {
    out.building_use = property.mainUse.trim();
  }
  if (property?.areaM2 != null && Number.isFinite(property.areaM2) && !out.building_area) {
    out.building_area = String(property.areaM2);
  }

  // 체크 안 된 근거자료는 빈 값으로 (양식은 "1"이 체크)
  // DocCheck uses defaultChecked from data — "0" should uncheck. Verify DocCheck.
  return {
    fields: out,
    summary,
    documentCount: docs.length,
  };
}
