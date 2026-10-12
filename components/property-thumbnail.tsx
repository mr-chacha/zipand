import { Building, Building2, Home, Hotel, Store } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PropertyType } from "@/types";

const iconMap: Record<PropertyType, React.ElementType> = {
  아파트: Building2,
  오피스텔: Hotel,
  빌라: Building,
  원룸: Home,
  상가: Store,
};

/** 실제 사진 업로드 전까지 사용하는 매물 썸네일 플레이스홀더 */
export function PropertyThumbnail({
  type,
  className,
}: {
  type: PropertyType;
  className?: string;
}) {
  const Icon = iconMap[type];
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
