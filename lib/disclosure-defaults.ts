import type { DealFormPrefill } from "@/lib/deal-forms";

function str(v: string | null | undefined) {
  return v?.trim() ?? "";
}

function todayKstYmd() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** 아파트 매매 확인설명서 PDF(4쪽) 기준 기본값 */
export function buildDisclosureFormDefaults(p: DealFormPrefill): Record<string, string> {
  const isApt = p.propertyType === "아파트";
  const dealType = str(p.dealType) || "매매";
  const isSale = dealType === "매매";

  return {
    form_template: "disclosure_v1",
    template_id: "",
    template_title: "",
    property_title: str(p.propertyTitle),
    property_address: str(p.propertyAddress),
    property_type: str(p.propertyType),
    deal_type: dealType,
    housing_type: isApt ? "공동주택" : "단독주택",
    trade_type: isSale ? "매매·교환" : "임대차",

    // 확인·설명 근거자료 (1=체크) — 매물 서류 반영 시 업로드된 종류만 체크
    doc_title_deed: "0",
    doc_registry: "0",
    doc_land_ledger: "0",
    doc_building_ledger: "0",
    doc_cadastral: "0",
    doc_land_use: "0",
    doc_other: "",

    // ① 대상물건
    building: str(p.building),
    unit: str(p.unit),
    land_category: str(p.landCategory) || "대",
    land_area: str(p.landArea),
    land_right_type: "",
    land_right_ratio: "",
    land_right_ratio_den: "",
    land_right_ratio_num: "",
    building_area: str(p.buildingArea),
    arch_area: str(p.archArea),
    total_floor_area: str(p.totalFloorArea),
    building_year: "",
    permit_date: "",
    use_approval_date: "",
    building_use: str(p.buildingUse) || str(p.propertyType) || "아파트",
    building_structure: str(p.buildingStructure) || "철근콘크리트구조",
    building_direction: "",
    seismic_design: "",
    seismic_capacity: "",
    building_ledger_status: "적법",

    // ② 권리관계
    ownership_land: "",
    ownership_building: "",
    rights_land: "",
    rights_building: "",
    trust_reg: "해당없음",
    joint_mortgage: "해당없음",
    lease_renewal: "해당없음",

    // ③ 토지이용계획
    use_zone: "",
    use_district: "",
    use_area: "",
    building_coverage_limit: str(p.buildingCoverage),
    floor_area_limit: str(p.floorAreaRatio),
    land_permit_zone: "해당없음",
    speculation_area: "해당없음",
    housing_speculation: "해당없음",
    overheat_district: "해당없음",
    urban_plan: "",
    district_unit_plan: "",
    other_restriction: "",

    // ④ 임대차
    fixed_date_info: "해당없음",
    tax_arrears_info: "해당없음",
    move_in_confirm: "해당없음",
    small_tenant_range: "",
    priority_pay_amount: "",
    private_rental_reg: "미등록",
    rental_obligation_years: "",
    rental_start_date: "",
    deposit_guarantee_explained: "0",
    lease_confirm_lessor: "해당없음",
    lease_confirm_lessee: "해당없음",
    lease_confirm_agent: "해당없음",

    // ⑤ 입지
    road_width: "",
    road_paved: "1",
    road_access: "용이함",
    bus_stop: "",
    bus_minutes: "",
    bus_mode: "도보",
    subway_station: "",
    subway_minutes: "",
    subway_mode: "도보",
    parking: "공동주차시설",
    school_elem: "",
    school_elem_min: "",
    school_elem_mode: "도보",
    school_mid: "",
    school_mid_min: "",
    school_mid_mode: "도보",
    school_high: "",
    school_high_min: "",
    school_high_mode: "도보",

    // ⑥ 관리
    security_office: "있음",
    manage_entity: "위탁관리",
    manage_fee: "",
    manage_fee_common: "",
    manage_includes: "",
    manage_verifiable: "",
    manage_billing: "관리규약에 따라 부과",

    // ⑦ 비선호시설
    disliked_facility: "없음",
    disliked_facility_detail: "",

    // ⑧ 거래예정금액
    deal_amount_won: p.amount != null && p.amount > 0 ? String(Math.floor(p.amount) * 10_000) : "",
    land_price_per_m2: str(p.landPricePerM2),
    building_official_price: "",

    // ⑨ 조세
    tax_acquisition: "",
    tax_rural: "",
    tax_local_edu: "",

    // ⑩~⑭
    actual_rights: "해당없음",
    water_damage: "없음",
    water_damage_loc: "",
    water_volume: "정상",
    water_volume_loc: "",
    electric_status: "정상",
    electric_replace: "",
    gas_supply: "도시가스",
    gas_other: "",
    fire_detector: isApt ? "해당없음" : "있음",
    heat_supply: "개별공급",
    heat_operation: "정상",
    heat_fuel: "도시가스",
    elevator: "있음",
    elevator_cond: "양호",
    drainage: "정상",
    drainage_note: "",
    other_facility: "",
    wall_crack: "없음",
    wall_leak: "없음",
    floor_cond: "보통임",
    wallpaper_cond: "보통임",
    sunlight: "보통임",
    noise: "보통임",
    vibration: "보통임",
    site_guide: "해당없음",
    site_guide_id_check: "",

    // ⑮ 중개보수
    fee_amount: "",
    fee_expense: "",
    fee_rate: "0.60",
    fee_base_won: "",
    fee_pay_timing: "",
    fee_expense_detail: "",

    contract_date: str(p.contractDate) || todayKstYmd(),

    // 인적사항
    lessor_name: str(p.lessorName),
    lessor_phone: str(p.lessorPhone),
    lessor_address: "",
    lessor_birth: "",
    lessor_id_front: "",
    lessor_id_back: "",
    lessee_name: str(p.lesseeName),
    lessee_phone: str(p.lesseePhone),
    lessee_address: "",
    lessee_birth: "",
    lessee_id_front: "",
    lessee_id_back: "",

    office_name: str(p.officeName),
    office_phone: str(p.officePhone),
    office_address: str(p.officeAddress),
    office_representative: str(p.officeRepresentative),
    office_registration_no: str(p.officeRegistrationNo),
    agent_name: str(p.agentName),
    agent_phone: str(p.agentPhone),

    joint_office_name: "",
    joint_office_phone: "",
    joint_office_address: "",
    joint_office_representative: "",
    joint_office_registration_no: "",
    joint_agent_name: "",

    // 하위 호환
    ownership_note: "",
    rights_note: "",
    building_note: "",
    land_use_note: "",
    explanation_note: str(p.termsNote),
    confirmation_note: "",
    amount: p.amount != null ? String(p.amount) : "",
  };
}
