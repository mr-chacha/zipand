/** document_fields → 계약서·확인설명서 prefill용 */
export type DocFormExtras = {
  buildingArea: string | null;
  buildingStructure: string | null;
  buildingUse: string | null;
  landArea: string | null;
  landCategory: string | null;
  landPricePerM2: string | null;
  buildingCoverage: string | null;
  floorAreaRatio: string | null;
  /** 건축면적(㎡) */
  archArea: string | null;
  /** 연면적(㎡) */
  totalFloorArea: string | null;
};

const EMPTY: DocFormExtras = {
  buildingArea: null,
  buildingStructure: null,
  buildingUse: null,
  landArea: null,
  landCategory: null,
  landPricePerM2: null,
  buildingCoverage: null,
  floorAreaRatio: null,
  archArea: null,
  totalFloorArea: null,
};

function numPart(value: string) {
  const n = value.replace(/,/g, "").match(/(\d+(?:\.\d+)?)/);
  return n?.[1] ?? value.trim();
}

/** 여러 서류 필드를 합친다. 건축물대장·종합공부 값을 우선한다. */
export function mergeDocFormExtras(
  docs: {
    doc_type: string;
    created_at?: string;
    document_fields: { label: string; value: string }[] | null;
  }[]
): DocFormExtras {
  const priority = (t: string) => {
    if (t === "건축물대장") return 0;
    if (t === "부동산종합공부") return 1;
    if (t === "토지대장") return 2;
    return 3;
  };
  const sorted = [...docs].sort((a, b) => {
    const d = priority(a.doc_type) - priority(b.doc_type);
    if (d !== 0) return d;
    return (b.created_at ?? "").localeCompare(a.created_at ?? "");
  });

  const out: DocFormExtras = { ...EMPTY };
  for (const doc of sorted) {
    const fields = Array.isArray(doc.document_fields) ? doc.document_fields : [];
    for (const f of fields) {
      const label = f.label.trim();
      const value = f.value.trim();
      if (!value) continue;

      if (label === "전용면적" && !out.buildingArea) out.buildingArea = numPart(value);
      if (label === "연면적") {
        if (!out.totalFloorArea) out.totalFloorArea = numPart(value);
        // 전용면적 없을 때 계약서 건물면적 후보
        if (!out.buildingArea) out.buildingArea = numPart(value);
      }
      if ((label === "건축면적" || label === "건축면적(㎡)") && !out.archArea) {
        out.archArea = numPart(value);
      }
      if ((label === "대지면적" || (label === "면적" && doc.doc_type !== "건축물대장")) && !out.landArea) {
        out.landArea = numPart(value);
      }
      if (label === "구조" && !out.buildingStructure) out.buildingStructure = value;
      if (label === "주용도" && !out.buildingUse) out.buildingUse = value;
      if (label === "지목" && !out.landCategory) out.landCategory = value;
      if (label === "개별공시지가" && !out.landPricePerM2) out.landPricePerM2 = numPart(value);
      if (label === "건폐율" && !out.buildingCoverage) {
        out.buildingCoverage = value.includes("%") ? value : `${numPart(value)}%`;
      }
      if (label === "용적률" && !out.floorAreaRatio) {
        out.floorAreaRatio = value.includes("%") ? value : `${numPart(value)}%`;
      }
    }
  }
  return out;
}
