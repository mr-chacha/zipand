import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DealShareView, type DealShareData } from "@/components/deal-share-view";
import { createClient } from "@/lib/supabase/server";
import { PrintButton } from "../../b/[token]/print-button";

export const metadata: Metadata = {
  title: "계약 진행 안내",
  robots: { index: false, follow: false },
};

export default async function DealSharePage({ params, searchParams }: PageProps<"/d/[token]">) {
  const { token } = await params;
  const { print } = await searchParams;
  const supabase = await createClient();

  const { data } = await supabase.rpc("get_deal_share", { share_token: token });
  if (!data) notFound();

  return (
    <main className="min-h-screen bg-neutral-100 px-4 py-8 print:bg-white print:p-0">
      <div className="mx-auto max-w-xl space-y-4">
        <div className="flex justify-end print:hidden">
          <PrintButton autoPrint={print === "1"} />
        </div>
        <DealShareView data={data as unknown as DealShareData} />
        <p className="text-center text-xs text-neutral-400 print:hidden">집앤으로 만든 계약 진행 안내</p>
      </div>
    </main>
  );
}
