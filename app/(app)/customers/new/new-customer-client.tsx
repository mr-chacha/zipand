"use client";

import { useId, useState } from "react";
import { CallDraftPanel } from "@/components/ai/call-draft-panel";
import { createCustomer } from "@/lib/actions/customers";
import type { Customer } from "@/types";
import { CustomerForm } from "../customer-form";

export function NewCustomerClient({
  officeId,
  members,
  currentUserId,
  aiAvailable,
}: {
  officeId: string;
  members: { id: string; name: string }[];
  currentUserId: string;
  aiAvailable: boolean;
}) {
  const draftFolderId = useId().replace(/:/g, "");
  const [defaults, setDefaults] = useState<Partial<Customer>>({});
  const [formKey, setFormKey] = useState(0);

  return (
    <div className="space-y-6">
      <CallDraftPanel
        officeId={officeId}
        draftFolderId={`draft-${draftFolderId}`}
        aiAvailable={aiAvailable}
        onDraft={(partial, consult) => {
          const memoParts = [partial.memo, consult.summary ? `[상담 요약]\n${consult.summary}` : null].filter(Boolean);
          setDefaults({ ...partial, memo: memoParts.join("\n\n") || null });
          setFormKey((k) => k + 1);
        }}
      />
      <CustomerForm
        key={formKey}
        action={createCustomer}
        members={members}
        currentUserId={currentUserId}
        cancelHref="/customers"
        defaultValues={defaults}
      />
    </div>
  );
}
