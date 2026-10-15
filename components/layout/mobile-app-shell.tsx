"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Bell, ChevronLeft, Search, X } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";
import { appTabItems } from "./nav-items";

const SEARCH_SCOPES = [
  { path: "/properties", placeholder: "매물명, 주소, 지역 검색" },
  { path: "/customers", placeholder: "고객 이름, 연락처, 지역 검색" },
];

/** 안드로이드 앱(WebView) 전용 레이아웃: 상단 바 + 하단 탭 */
export function MobileAppShell({ officeName, children }: { officeName: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searching, setSearching] = useState(false);

  const isTabRoot = appTabItems.some((t) => t.href === pathname);
  const scope = SEARCH_SCOPES.find((s) => s.path === pathname);
  const currentQuery = scope ? (searchParams.get("q") ?? "") : "";

  const onSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!scope) return;
    const q = String(new FormData(e.currentTarget).get("q") ?? "").trim();
    router.push(q ? `${scope.path}?q=${encodeURIComponent(q)}` : scope.path);
  };

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/95 px-3 backdrop-blur">
        {scope && searching ? (
          <form onSubmit={onSearch} className="flex flex-1 items-center gap-2">
            <Input
              key={`${scope.path}:${currentQuery}`}
              name="q"
              type="search"
              autoFocus
              defaultValue={currentQuery}
              placeholder={scope.placeholder}
              aria-label={scope.placeholder}
            />
            <Button type="button" variant="ghost" size="icon" aria-label="검색 닫기" onClick={() => setSearching(false)}>
              <X />
            </Button>
          </form>
        ) : (
          <>
            {isTabRoot ? (
              <div className="flex min-w-0 items-center gap-2">
                <Logo />
                <span className="truncate text-xs text-muted-foreground">{officeName}</span>
              </div>
            ) : (
              <Button variant="ghost" size="icon" aria-label="뒤로" onClick={() => router.back()}>
                <ChevronLeft className="size-5" />
              </Button>
            )}
            <div className="ml-auto flex items-center">
              {scope && (
                <Button variant="ghost" size="icon" aria-label="검색" onClick={() => setSearching(true)}>
                  <Search />
                </Button>
              )}
              <Link href="/notifications" aria-label="알림" className={buttonVariants({ variant: "ghost", size: "icon" })}>
                <Bell />
              </Link>
            </div>
          </>
        )}
      </header>

      <main className="w-full flex-1 p-4 pb-24">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        {appTabItems.map((tab) => {
          const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <tab.icon className="size-5" />
              {tab.title}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
