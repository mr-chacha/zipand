"use client";

import { useState, useTransition } from "react";
import { FormMessage } from "@/components/form/form-message";
import { OfficeSearch } from "@/components/office-search";
import { registerOffice } from "@/lib/actions/office";

export function OfficeLookup({ next, currentRegNo }: { next: string | null; currentRegNo: string | null }) {
  const [registering, startRegister] = useTransition();
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      {error && <FormMessage state={{ error }} />}
      <OfficeSearch
        selectLabel="이 사무소로 등록"
        currentRegNo={currentRegNo}
        busyRegNo={registering ? selected : null}
        onSelect={(o) => {
          setSelected(o.regNo);
          setError(null);
          startRegister(async () => {
            const res = await registerOffice(o.regNo, next);
            if (res?.error) setError(res.error);
          });
        }}
      />
    </div>
  );
}
