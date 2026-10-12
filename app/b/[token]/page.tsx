import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BriefingView, DEFAULT_SECTIONS, type BriefingData } from "@/components/briefing-view";
import { signedUrls } from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";
import type { BriefingSections } from "@/types";
import { PrintButton } from "./print-button";

export const metadata: Metadata = {
  title: "매물 브리핑",
  robots: { index: false, follow: false },
};

interface BriefingPayload {
  sections: Partial<BriefingSections>;
  comment: string | null;
  expires_at: string;
  property: BriefingData["property"];
  photos: string[];
  follow_ups: string[];
  office: BriefingData["office"];
  agent: BriefingData["agent"];
}

export default async function PublicBriefingPage({ params, searchParams }: PageProps<"/b/[token]">) {
  const { token } = await params;
  const { print } = await searchParams;
  const supabase = await createClient();

  const { data } = await supabase.rpc("get_briefing", { briefing_token: token });
  if (!data) notFound();
  const payload = data as unknown as BriefingPayload;

  const urls = await signedUrls(supabase, "property-photos", payload.photos);
  const briefing: BriefingData = {
    property: { ...payload.property, area_m2: payload.property.area_m2 === null ? null : Number(payload.property.area_m2) },
    photoUrls: payload.photos.map((p) => urls[p]).filter(Boolean),
    followUps: payload.follow_ups ?? [],
    office: payload.office,
    agent: payload.agent,
  };

  return (
    <main className="min-h-screen bg-neutral-100 px-4 py-8 print:bg-white print:p-0">
      <div className="mx-auto max-w-xl space-y-4">
        <div className="flex justify-end print:hidden">
          <PrintButton autoPrint={print === "1"} />
        </div>
        <BriefingView data={briefing} sections={{ ...DEFAULT_SECTIONS, ...payload.sections }} comment={payload.comment} />
        <p className="text-center text-xs text-neutral-400 print:hidden">집앤으로 만든 매물 브리핑</p>
      </div>
    </main>
  );
}
