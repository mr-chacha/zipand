"use client";

import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PropertyThumbnail } from "@/components/property-thumbnail";
import { cn } from "@/lib/utils";

const navButton =
  "absolute top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition hover:bg-black/60";

/**
 * 매물 사진 슬라이드. 가로·세로 사진 모두 자르지 않고(object-contain) 원본 비율 그대로 보여준다.
 * 좌우 버튼·스와이프로 넘기고, 인쇄할 때는 모든 사진을 격자로 펼친다.
 */
export function PhotoSlider({ urls, type }: { urls: string[]; type: string }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const count = urls.length;

  if (count === 0) return <PropertyThumbnail type={type} className="aspect-[4/3] w-full" />;

  const goTo = (next: number) => {
    const track = trackRef.current;
    if (!track) return;
    const target = Math.max(0, Math.min(count - 1, next));
    track.scrollTo({ left: target * track.clientWidth, behavior: "smooth" });
  };

  return (
    <>
      <div className="relative bg-neutral-950 print:hidden">
        <div
          ref={trackRef}
          className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          onScroll={(e) => {
            const el = e.currentTarget;
            setIndex(Math.round(el.scrollLeft / el.clientWidth));
          }}
        >
          {urls.map((url, i) => (
            // eslint-disable-next-line @next/next/no-img-element -- 서명 URL은 만료되므로 이미지 최적화 캐시를 쓰지 않는다
            <img
              key={url}
              src={url}
              alt={`매물 사진 ${i + 1}`}
              loading={i === 0 ? "eager" : "lazy"}
              className="aspect-[4/3] w-full shrink-0 snap-center object-contain"
            />
          ))}
        </div>

        {count > 1 && (
          <>
            {index > 0 && (
              <button type="button" aria-label="이전 사진" onClick={() => goTo(index - 1)} className={cn(navButton, "left-2")}>
                <ChevronLeft className="size-5" />
              </button>
            )}
            {index < count - 1 && (
              <button type="button" aria-label="다음 사진" onClick={() => goTo(index + 1)} className={cn(navButton, "right-2")}>
                <ChevronRight className="size-5" />
              </button>
            )}
            <span className="absolute top-2 right-2 rounded-full bg-black/55 px-2 py-0.5 text-xs text-white tabular-nums">
              {index + 1} / {count}
            </span>
            <div className="absolute inset-x-0 bottom-2 flex justify-center gap-1.5">
              {urls.map((url, i) => (
                <button
                  key={url}
                  type="button"
                  aria-label={`${i + 1}번째 사진`}
                  onClick={() => goTo(i)}
                  className={cn("h-1.5 rounded-full transition-all", i === index ? "w-4 bg-white" : "w-1.5 bg-white/50")}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <div className={cn("hidden gap-1 print:grid", count > 1 ? "grid-cols-2" : "grid-cols-1")}>
        {urls.map((url, i) => (
          // eslint-disable-next-line @next/next/no-img-element -- 인쇄용
          <img key={url} src={url} alt={`매물 사진 ${i + 1}`} className="aspect-[4/3] w-full break-inside-avoid bg-neutral-100 object-contain" />
        ))}
      </div>
    </>
  );
}
