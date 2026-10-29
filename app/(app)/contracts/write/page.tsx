import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ContractWriteEditSeed } from "@/components/deal-forms/contract-write-dialog";
import { asStringRecord } from "@/lib/deal-forms";
import { loadContractWriteOptions } from "@/lib/contract-write-data";
import { ContractWritePageClient } from "./contract-write-page";

export const metadata: Metadata = { title: "계약서 작성" };

export default async function ContractWritePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const id = typeof sp.id === "string" ? sp.id : "";
  const { forms, deals, properties, office } = await loadContractWriteOptions();

  let edit: ContractWriteEditSeed | null = null;
  if (id) {
    const form = forms.find((f) => f.id === id);
    if (!form) notFound();
    const data = asStringRecord(form.data);
    const fromDeal = form.deal_id
      ? deals.find((d) => d.value === form.deal_id)?.propertyId?.trim()
      : undefined;
    edit = {
      formId: form.id,
      title: form.title,
      data,
      propertyId: data.property_id?.trim() || fromDeal || undefined,
      dealId: form.deal_id ?? undefined,
      status: form.status as "draft" | "finalized",
    };
  }

  return (
    <ContractWritePageClient
      properties={properties}
      deals={deals}
      office={office}
      edit={edit}
    />
  );
}
