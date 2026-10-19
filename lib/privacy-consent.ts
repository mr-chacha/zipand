import type { DealFormPrefill } from "@/lib/deal-forms";

export const PRIVACY_CONSENT_TEMPLATE = "privacy_consent";
export const PRIVACY_CONSENT_TITLE = "개인정보 수집 및 이용 동의서";

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

/** 개인정보 수집·이용 동의서 기본값 (기타 서식 form_template) */
export function buildPrivacyConsentDefaults(p: DealFormPrefill): Record<string, string> {
  return {
    form_template: PRIVACY_CONSENT_TEMPLATE,
    property_title: str(p.propertyTitle),
    property_address: str(p.propertyAddress),
    property_type: str(p.propertyType),
    deal_type: str(p.dealType),
    office_name: str(p.officeName),
    office_phone: str(p.officePhone),
    office_address: str(p.officeAddress),
    agent_name: str(p.agentName),
    agent_phone: str(p.agentPhone),
    provider1_name: str(p.lessorName),
    provider1_consent: "동의",
    provider2_name: str(p.lesseeName),
    provider2_consent: "동의",
    collected_at: str(p.contractDate) || todayKstYmd(),
    collector_name: str(p.agentName),
    note: "",
  };
}

export function isPrivacyConsentForm(data: Record<string, string>) {
  return data.form_template === PRIVACY_CONSENT_TEMPLATE;
}
