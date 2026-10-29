"use server";

import { getSession } from "@/lib/auth";
import {
  mapPropertyDocsToDisclosure,
  type PropertyDocForDisclosure,
  type PropertyDocsDisclosureResult,
} from "@/lib/disclosure-from-docs";
import { parseStoredLocationFields } from "@/lib/disclosure-location";
import { toErrorMessage } from "@/lib/form";

async function loadDocsForPropertyId(propertyId: string) {
  const { supabase } = await getSession();
  const { data: property, error: propErr } = await supabase
    .from("properties")
    .select("id, title, address, area_m2, building, unit, structure, main_use, location_fields")
    .eq("id", propertyId)
    .maybeSingle();
  if (propErr) throw propErr;
  if (!property) return { ok: false as const, error: "매물을 찾을 수 없어요." };

  const locationFields = parseStoredLocationFields(property.location_fields);

  const { data: docs, error: docsErr } = await supabase
    .from("documents")
    .select("id, doc_type, file_name, issued_at, created_at, document_fields(label, value)")
    .eq("property_id", propertyId)
    .eq("status", "검토 완료")
    .order("created_at", { ascending: false });
  if (docsErr) throw docsErr;

  if (!docs?.length) {
    // 검토 완료 서류가 없어도 매물 기본값·저장된 입지는 반환(근거자료 체크는 건드리지 않음)
    const fields: Record<string, string> = { ...locationFields };
    if (property.address?.trim()) fields.property_address = property.address.trim();
    if (property.title?.trim()) fields.property_title = property.title.trim();
    if (property.building?.trim()) fields.building = property.building.trim();
    if (property.unit?.trim()) fields.unit = property.unit.trim();
    if (property.structure?.trim()) fields.building_structure = property.structure.trim();
    if (property.main_use?.trim()) fields.building_use = property.main_use.trim();
    if (property.area_m2 != null && Number.isFinite(property.area_m2)) {
      fields.building_area = String(property.area_m2);
    }
    return {
      ok: true as const,
      result: {
        fields,
        summary: [],
        documentCount: 0,
        locationFields,
      },
    };
  }

  const mapped: PropertyDocForDisclosure[] = docs.map((d) => {
    const fieldsRaw = d.document_fields;
    const fields = Array.isArray(fieldsRaw) ? fieldsRaw : [];
    return {
      id: d.id,
      docType: d.doc_type,
      fileName: d.file_name,
      issuedAt: d.issued_at,
      createdAt: d.created_at,
      fields: fields.map((f) => ({ label: f.label, value: f.value })),
    };
  });

  const mappedResult = mapPropertyDocsToDisclosure(mapped, {
    title: property.title,
    address: property.address,
    areaM2: property.area_m2,
    building: property.building,
    unit: property.unit,
    structure: property.structure,
    mainUse: property.main_use,
  });

  return {
    ok: true as const,
    result: {
      ...mappedResult,
      fields: { ...mappedResult.fields, ...locationFields },
      locationFields,
    },
  };
}

/** 매물 서류함·수동 필드로 확인설명서 값 생성 */
export async function loadDisclosureFromProperty(
  propertyId: string
): Promise<{ ok: true; result: PropertyDocsDisclosureResult } | { ok: false; error: string }> {
  try {
    const id = propertyId.trim();
    if (!id) return { ok: false, error: "매물을 선택해 주세요." };
    return await loadDocsForPropertyId(id);
  } catch (e) {
    return { ok: false, error: toErrorMessage(e) };
  }
}

/** 거래에 연결된 매물 기준 (하위 호환) */
export async function loadDisclosureFromDealProperty(
  dealId: string
): Promise<{ ok: true; result: PropertyDocsDisclosureResult } | { ok: false; error: string }> {
  try {
    const id = dealId.trim();
    if (!id) return { ok: false, error: "거래를 선택해 주세요." };

    const { supabase } = await getSession();
    const { data: deal, error: dealErr } = await supabase
      .from("deals")
      .select("property_id")
      .eq("id", id)
      .maybeSingle();
    if (dealErr) throw dealErr;
    if (!deal?.property_id) return { ok: false, error: "거래에 연결된 매물이 없어요." };
    return await loadDocsForPropertyId(deal.property_id);
  } catch (e) {
    return { ok: false, error: toErrorMessage(e) };
  }
}
