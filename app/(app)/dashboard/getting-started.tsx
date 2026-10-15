import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getSetupProgress } from "@/lib/setup";
import { cn } from "@/lib/utils";

/** 시작하기를 끝내기 전까지 지금 해야 할 단계 하나만 안내한다 */
export async function GettingStarted() {
  const { steps, currentIndex, finished, allDone } = await getSetupProgress();
  if (finished) return null;

  const step = steps[currentIndex];
  const href = `/setup?step=${currentIndex + 1}`;

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-xs font-semibold text-primary">
            집앤 시작하기 · {steps.length}단계 중 {currentIndex + 1}단계
          </p>
          <p className="font-semibold">
            {allDone
              ? steps.some((s) => s.locked && !s.done)
                ? "사무소 정보를 등록하면 브리핑 공유·구성원 초대도 할 수 있어요. 시작하기를 완료해 주세요."
                : "모든 단계를 마쳤어요. 시작하기를 완료해 주세요."
              : step.prompt}
          </p>
          <div className="flex gap-1">
            {steps.map((s, i) => (
              <span
                key={s.key}
                className={cn("h-1.5 flex-1 rounded-full", s.done ? "bg-primary" : i === currentIndex ? "bg-primary/40" : "bg-muted")}
              />
            ))}
          </div>
        </div>
        <Link href={href} className={buttonVariants({ size: "lg" })}>
          {allDone ? "완료하기" : currentIndex === 0 ? "시작하기" : "이어서 입력하기"}
          <ArrowRight data-icon="inline-end" />
        </Link>
      </CardContent>
    </Card>
  );
}
