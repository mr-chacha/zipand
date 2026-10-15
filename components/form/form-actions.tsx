import { cn } from "@/lib/utils";

/**
 * 폼 하단 버튼 줄(취소 → 저장 순서로 넣는다).
 * 웹은 오른쪽 정렬 한 줄, 앱은 버튼마다 한 줄씩 가로로 꽉 채우고 주 버튼(마지막)을 위에 둔다.
 */
export function FormActions({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      data-slot="form-actions"
      className={cn(
        "flex justify-end gap-2 app:flex-col-reverse app:items-stretch app:gap-2.5 app:pt-1 app:*:w-full app:*:h-11 app:*:text-base",
        className
      )}
    >
      {children}
    </div>
  );
}
