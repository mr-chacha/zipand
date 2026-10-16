"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/** 넓은 테이블 화면은 max-width·가운데 정렬 없이 본문 전체 너비를 쓴다 */
const FULL_WIDTH_PREFIXES = ["/contracts/documents"];

export function AppMain({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const fullWidth = FULL_WIDTH_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  return (
    <div className={cn("w-full flex-1 p-4 lg:p-8", !fullWidth && "mx-auto max-w-7xl")}>{children}</div>
  );
}
