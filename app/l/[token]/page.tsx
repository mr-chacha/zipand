import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MapPin, Phone } from "lucide-react";
import { PhotoSlider } from "@/components/photo-slider";
import { formatAvailableFrom, formatMaintenance, formatPrice, toPyeong } from "@/lib/format";
import { signedUrls } from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "추천 매물",
  robots: { index: false, follow: false },
};

interface ListProperty {
  id: string;
  title: string;
  region: string | null;
  deal_type: string;
  property_type: string;
  status: string;
  price: number;
  monthly_rent: number | null;
  maintenance_fee: number | null;
  maintenance_status: string | null;
  maintenance_items: string[];
  area_m2: number | null;
  floor: number | null;
  total_floors: number | null;
  direction: string | null;
  rooms: number | null;
  baths: number | null;
  available_from: string | null;
  available_negotiable: boolean;
  highlights: string[];
  description: string | null;
  photos: string[];
}

interface ListPayload {
  title: string;
  comment: string | null;
  expires_at: string;
  properties: ListProperty[];
  office: { name: string; phone: string | null; address: string | null };
  agent: { name: string | null; phone: string | null };
}

export default async function PropertyListPage({ params }: PageProps<"/l/[token]">) {
  const { token } = await params;
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_property_list", { list_token: token });
  if (!data) notFound();
  const list = data as unknown as ListPayload;

  const urls = await signedUrls(
    supabase,
    "property-photos",
    list.properties.flatMap((p) => p.photos)
  );
  const phone = list.agent.phone ?? list.office.phone;

  return (
    <main className="min-h-screen bg-neutral-100 px-4 py-8">
      <div className="mx-auto max-w-xl space-y-4">
        <header className="space-y-2 rounded-xl border bg-white p-6 text-neutral-900 shadow-sm">
          <p className="text-xs font-medium text-primary">{list.office.name}</p>
          <h1 className="text-xl font-bold">{list.title}</h1>
          <p className="text-sm text-neutral-500">매물 {list.properties.length}개</p>
          {list.comment && <p className="rounded-lg bg-neutral-50 p-3 text-sm whitespace-pre-wrap text-neutral-700">{list.comment}</p>}
        </header>

        {list.properties.map((p, i) => {
          const area = p.area_m2 === null ? null : Number(p.area_m2);
          const specs = [
            { label: "전용면적", value: area ? `${area}㎡ (${toPyeong(area)}평)` : null },
            { label: "층", value: p.floor ? `${p.floor}${p.total_floors ? `/${p.total_floors}` : ""}층` : null },
            { label: "방향", value: p.direction },
            { label: "방/욕실", value: p.rooms !== null ? `${p.rooms} / ${p.baths ?? "-"}` : null },
            { label: "관리비", value: formatMaintenance(p) },
            { label: "입주 가능일", value: p.available_negotiable || p.available_from ? formatAvailableFrom(p) : null },
          ].filter((s) => s.value);
          const closed = p.status === "계약 진행" || p.status === "계약 완료";
          return (
            <article key={p.id} className="overflow-hidden rounded-xl border bg-white text-neutral-900 shadow-sm">
              <PhotoSlider urls={p.photos.map((path) => urls[path]).filter(Boolean)} type={p.property_type} />
              <div className="space-y-4 p-5">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs font-semibold text-neutral-400">{i + 1}</span>
                    <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium">
                      {p.property_type} · {p.deal_type}
                    </span>
                    {closed && <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">{p.status}</span>}
                  </div>
                  <h2 className="text-lg font-bold">{p.title}</h2>
                  {p.region && (
                    <p className="flex items-center gap-1 text-sm text-neutral-500">
                      <MapPin className="size-3.5" />
                      {p.region}
                    </p>
                  )}
                </div>
                <p className="text-2xl font-bold text-primary">
                  {p.deal_type} {formatPrice(p)}
                </p>
                {specs.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 rounded-lg bg-neutral-50 p-3 text-center text-sm">
                    {specs.map((s) => (
                      <div key={s.label}>
                        <p className="text-xs text-neutral-500">{s.label}</p>
                        <p className="font-medium">{s.value}</p>
                      </div>
                    ))}
                  </div>
                )}
                {p.highlights.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {p.highlights.map((h) => (
                      <span key={h} className="rounded-full bg-primary/10 px-2.5 py-1 text-xs text-primary">
                        {h}
                      </span>
                    ))}
                  </div>
                )}
                {p.description && (
                  <details className="group text-sm">
                    <summary className="cursor-pointer font-medium text-neutral-700">매물 설명 보기</summary>
                    <p className="mt-2 leading-relaxed whitespace-pre-wrap text-neutral-600">{p.description}</p>
                  </details>
                )}
              </div>
            </article>
          );
        })}

        <footer className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-white p-5 text-sm text-neutral-900 shadow-sm">
          <div>
            <p className="font-semibold">{list.office.name}</p>
            <p className="text-neutral-500">
              {list.agent.name && `담당 ${list.agent.name}`}
              {list.office.address && ` · ${list.office.address}`}
            </p>
          </div>
          {phone && (
            <a href={`tel:${phone}`} className="flex items-center gap-1 rounded-lg bg-primary px-3 py-2 font-medium text-white">
              <Phone className="size-4" />
              문의하기
            </a>
          )}
        </footer>
        <p className="text-center text-[11px] leading-relaxed text-neutral-400">
          본 자료는 매물 소개를 위한 참고 자료이며, 계약 전 공부서류와 현장 확인이 필요합니다.
          <br />
          집앤으로 만든 매물 리스트
        </p>
      </div>
    </main>
  );
}
