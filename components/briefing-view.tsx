import { MapPin, Phone } from "lucide-react";
import { PhotoSlider } from "@/components/photo-slider";
import { formatAvailableFrom, formatMaintenance, formatPrice, toPyeong } from "@/lib/format";
import type { BriefingSections } from "@/types";

export interface BriefingData {
  property: {
    title: string;
    region: string | null;
    deal_type: string;
    property_type: string;
    price: number;
    monthly_rent: number | null;
    maintenance_fee: number | null;
    maintenance_status?: string | null;
    maintenance_items?: string[];
    area_m2: number | null;
    floor: number | null;
    total_floors: number | null;
    direction: string | null;
    rooms: number | null;
    baths: number | null;
    available_from: string | null;
    available_negotiable?: boolean;
    highlights: string[];
  };
  photoUrls: string[];
  followUps: string[];
  office: { name: string; phone: string | null; address: string | null };
  agent: { name: string | null; phone: string | null };
}

export const DEFAULT_SECTIONS: BriefingSections = {
  photos: true,
  price: true,
  specs: true,
  description: true,
  highlights: true,
  followUps: true,
  contact: true,
};

/** 고객 공개용 매물 브리핑. 내부 메모·개인정보는 데이터에 포함하지 않는다. */
export function BriefingView({
  data,
  sections,
  comment,
}: {
  data: BriefingData;
  sections: BriefingSections;
  comment: string | null;
}) {
  const p = data.property;
  const specs = [
    { label: "전용면적", value: p.area_m2 ? `${p.area_m2}㎡ (${toPyeong(p.area_m2)}평)` : null },
    { label: "층", value: p.floor ? `${p.floor}${p.total_floors ? `/${p.total_floors}` : ""}층` : null },
    { label: "방향", value: p.direction },
    { label: "방/욕실", value: p.rooms !== null ? `${p.rooms} / ${p.baths ?? "-"}` : null },
    { label: "관리비", value: formatMaintenance(p) },
    {
      label: "입주 가능일",
      value: p.available_negotiable || p.available_from ? formatAvailableFrom(p) : null,
    },
  ].filter((s) => s.value);

  return (
    <article className="overflow-hidden rounded-xl border bg-white text-neutral-900 shadow-sm print:rounded-none print:border-0 print:shadow-none">
      {sections.photos && <PhotoSlider urls={data.photoUrls} type={p.property_type} />}
      <div className="space-y-5 p-6">
        <div className="space-y-1">
          <span className="inline-block rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium">
            {p.property_type} · {p.deal_type}
          </span>
          <h1 className="text-xl font-bold">{p.title}</h1>
          {p.region && (
            <p className="flex items-center gap-1 text-sm text-neutral-500">
              <MapPin className="size-3.5" />
              {p.region}
            </p>
          )}
        </div>

        {sections.price && (
          <p className="text-2xl font-bold text-primary">
            {p.deal_type} {formatPrice(p)}
            <span className="ml-1 text-sm font-normal text-neutral-500">만원</span>
          </p>
        )}

        {sections.specs && specs.length > 0 && (
          <div className="grid grid-cols-3 gap-2 rounded-lg bg-neutral-50 p-3 text-center text-sm">
            {specs.map((s) => (
              <div key={s.label}>
                <p className="text-xs text-neutral-500">{s.label}</p>
                <p className="font-medium">{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {sections.description && comment && (
          <div className="space-y-1">
            <p className="text-sm font-semibold">중개사 설명</p>
            <p className="text-sm leading-relaxed whitespace-pre-wrap text-neutral-600">{comment}</p>
          </div>
        )}

        {sections.highlights && p.highlights.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-semibold">확인된 장점</p>
            <div className="flex flex-wrap gap-1.5">
              {p.highlights.map((h) => (
                <span key={h} className="rounded-full bg-primary/10 px-2.5 py-1 text-xs text-primary">
                  {h}
                </span>
              ))}
            </div>
          </div>
        )}

        {sections.followUps && data.followUps.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-semibold">추가 확인 사항</p>
            <ul className="list-disc space-y-1 pl-5 text-sm text-neutral-600">
              {data.followUps.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </div>
        )}

        {sections.contact && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-4 text-sm">
            <div>
              <p className="font-semibold">{data.office.name}</p>
              <p className="text-neutral-500">
                {data.agent.name && `담당 ${data.agent.name}`}
                {data.office.address && ` · ${data.office.address}`}
              </p>
            </div>
            {(data.agent.phone || data.office.phone) && (
              <a href={`tel:${data.agent.phone ?? data.office.phone}`} className="flex items-center gap-1 font-medium">
                <Phone className="size-4" />
                {data.agent.phone ?? data.office.phone}
              </a>
            )}
          </div>
        )}

        <p className="text-[11px] leading-relaxed text-neutral-400">
          본 자료는 매물 소개를 위한 참고 자료이며, 계약 전 공부서류와 현장 확인이 필요합니다.
        </p>
      </div>
    </article>
  );
}
