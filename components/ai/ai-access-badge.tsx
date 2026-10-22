import { Badge } from "@/components/ui/badge";
import { AI_ACCESS_LOCKED_LABEL, AI_ACCESS_OK_LABEL } from "@/lib/ai/access";
import { cn } from "@/lib/utils";

/** 구독(유료)·크레딧 잔액 기준 AI 사용 가능 여부 뱃지 */
export function AiAccessBadge({
  available,
  className,
  compact,
}: {
  available: boolean;
  className?: string;
  /** 버튼 옆 짧은 문구 */
  compact?: boolean;
}) {
  return (
    <Badge
      variant={available ? "secondary" : "outline"}
      className={cn(
        "text-[10px] font-normal",
        available ? "border-transparent bg-primary/10 text-primary" : "text-muted-foreground",
        className
      )}
      title={available ? AI_ACCESS_OK_LABEL : AI_ACCESS_LOCKED_LABEL}
    >
      {available ? AI_ACCESS_OK_LABEL : compact ? "결제 후 사용 가능" : AI_ACCESS_LOCKED_LABEL}
    </Badge>
  );
}
