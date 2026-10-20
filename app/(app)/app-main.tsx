"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/** 넓은 테이블 화면은 max-width·가운데 정렬 없이 본문 전체 너비를 쓴다 */
function isFullWidth(pathname: string) {
  return pathname === "/contracts" || pathname === "/contracts/documents" || pathname.startsWith("/contracts/documents/");
}

export function AppMain({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const fullWidth = isFullWidth(pathname);

  return (
    <div className={cn("w-full flex-1 p-4 lg:p-8", !fullWidth && "mx-auto max-w-7xl")}>{children}</div>
  );
}
