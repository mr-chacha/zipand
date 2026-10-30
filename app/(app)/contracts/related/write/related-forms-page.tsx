"use client";

import { useRouter } from "next/navigation";
import { RelatedFormsDialog, type RelatedFormsOfficeDefaults } from "@/components/deal-forms/related-forms-dialog";

export function RelatedFormsWritePage({ office }: { office: RelatedFormsOfficeDefaults }) {
  const router = useRouter();
  return (
    <RelatedFormsDialog
      open
      presentation="page"
      office={office}
      onOpenChange={(next) => {
        if (next) return;
        if (typeof window !== "undefined" && window.opener) {
          window.close();
          return;
        }
        router.push("/contracts");
      }}
    />
  );
}
