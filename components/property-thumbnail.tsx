import { Building, Building2, Home, Hotel, Store } from "lucide-react";
import { cn } from "@/lib/utils";

const iconMap: Record<string, React.ElementType> = {
  아파트: Building2,
  오피스텔: Hotel,
  빌라: Building,
  원룸: Home,
  상가: Store,
};

/** 매물 사진. 사진이 없으면 매물 유형 아이콘 플레이스홀더를 보여준다. */
export function PropertyThumbnail({
  type,
  src,
  alt = "",
  className,
}: {
  type: string;
  src?: string | null;
  alt?: string;
  className?: string;
}) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- 서명 URL은 만료되므로 이미지 최적화 캐시를 쓰지 않는다
      <img src={src} alt={alt} loading="lazy" decoding="async" className={cn("object-cover", className)} />
    );
  }
  const Icon = iconMap[type] ?? Building2;
  return (
    <div
      className={cn(
        "flex items-center justify-center bg-gradient-to-br from-primary/15 via-primary/5 to-muted text-primary/60",
        className
      )}
    >
      <Icon className="size-1/4 max-h-12 max-w-12 min-h-5 min-w-5" />
    </div>
  );
}
