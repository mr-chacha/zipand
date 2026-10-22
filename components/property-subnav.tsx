"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, FileText, Mic, Presentation, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export type PropertySubnavKey = "detail" | "visit" | "docs" | "customers" | "briefing";

const items: { key: PropertySubnavKey; label: string; icon: typeof Building2; href: (id: string) => string }[] = [
  { key: "detail", label: "매물 상세", icon: Building2, href: (id) => `/properties/${id}` },
  { key: "visit", label: "임장 기록", icon: Mic, href: (id) => `/properties/${id}/visit` },
  { key: "docs", label: "서류", icon: FileText, href: (id) => `/properties/${id}?tab=docs` },
  { key: "customers", label: "연결 고객", icon: Users, href: (id) => `/properties/${id}?tab=customers` },
  { key: "briefing", label: "고객 브리핑", icon: Presentation, href: (id) => `/properties/${id}/briefing` },
];

function activeFromPath(pathname: string, propertyId: string): PropertySubnavKey | null {
  if (pathname.startsWith(`/properties/${propertyId}/visit`)) return "visit";
  if (pathname.startsWith(`/properties/${propertyId}/briefing`)) return "briefing";
  if (pathname.startsWith("/documents")) return "docs";
  if (pathname === `/properties/${propertyId}` || pathname.startsWith(`/properties/${propertyId}/edit`)) {
    return "detail";
  }
  return null;
}

/** 매물 상세·임장·서류·브리핑을 오갈 때 쓰는 하위 탭 */
export function PropertySubnav({
  propertyId,
  active,
  className,
}: {
  propertyId: string;
  /** 매물 상세에서 서류 탭일 때 등 — 경로만으로 구분 안 될 때 지정 */
  active?: PropertySubnavKey;
  className?: string;
}) {
  const pathname = usePathname();
  const current = active ?? activeFromPath(pathname, propertyId);

  return (
    <nav
      className={cn("flex gap-1 overflow-x-auto rounded-xl border bg-muted/40 p-1", className)}
      aria-label="매물 메뉴"
    >
      {items.map((item) => {
        const href = item.href(propertyId);
        const isActive = current === item.key;
        return (
          <Link
            key={item.key}
            href={href}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              "app:min-h-11 app:px-3.5 app:text-base",
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-background/60 hover:text-foreground"
            )}
            aria-current={isActive ? "page" : undefined}
          >
            <item.icon className="size-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
