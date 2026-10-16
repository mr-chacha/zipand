import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DealFormDocumentView } from "@/components/deal-forms/form-document-view";
import { asStringRecord, type DealFormKind } from "@/lib/deal-forms";
import { createClient } from "@/lib/supabase/server";
import { PrintButton } from "../../b/[token]/print-button";

export const metadata: Metadata = {
  title: "서식 공유",
  robots: { index: false, follow: false },
};

type SharePayload = {
  expires_at: string;
  form: { kind: string; title: string; status: string; data: unknown; finalized_at: string | null };
  property: { title: string | null; address: string | null; deal_type: string | null; property_type: string | null };
  office: { name: string; phone: string | null; address: string | null };
  agent: { name: string | null; phone: string | null };
};

export default async function DealFormSharePage({ params, searchParams }: PageProps<"/f/[token]">) {
  const { token } = await params;
  const { print } = await searchParams;
  const supabase = await createClient();

  const { data } = await supabase.rpc("get_deal_form_share", { share_token: token });
  if (!data) notFound();

  const payload = data as unknown as SharePayload;
  const kind = payload.form.kind as DealFormKind;

  return (
    <main className="min-h-screen bg-neutral-100 px-4 py-8 print:bg-white print:p-0">
      <div className="mx-auto max-w-xl space-y-4">
        <div className="flex justify-end print:hidden">
          <PrintButton autoPrint={print === "1"} />
        </div>
        <DealFormDocumentView
          kind={kind}
          title={payload.form.title}
          data={asStringRecord(payload.form.data)}
          office={payload.office}
          property={payload.property}
        />
        <p className="text-center text-xs text-neutral-400 print:hidden">집앤으로 만든 서식 공유</p>
      </div>
    </main>
  );
}
