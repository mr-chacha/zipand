"use client";

import { useState } from "react";
import { OfficeDocumentRequestNotice, type VerificationRequest } from "@/components/office-document-request";
import { OfficeRegisterForm } from "@/components/office-register-form";
import { OfficeSearch } from "@/components/office-search";
import type { RegistryOffice } from "@/lib/office-registry";

export function OfficeLookup({
  next,
  currentRegNo,
  documentRequest,
}: {
  next: string | null;
  currentRegNo: string | null;
  /** 미등록 사무소일 때만: 서류 심사 신청 안내 */
  documentRequest: { officeId: string; request: VerificationRequest | null } | null;
}) {
  const [selected, setSelected] = useState<RegistryOffice | null>(null);

  return (
    <div className="space-y-4">
      {selected ? (
        <OfficeRegisterForm office={selected} next={next ?? "/settings?tab=office"} onBack={() => setSelected(null)} />
      ) : (
        <OfficeSearch selectLabel="이 사무소 선택" currentRegNo={currentRegNo} onSelect={setSelected} />
      )}
      {documentRequest && <OfficeDocumentRequestNotice {...documentRequest} />}
    </div>
  );
}
