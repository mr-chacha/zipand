"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, ChevronLeft } from "lucide-react";
import { BusyOverlay } from "@/components/busy-overlay";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";
import { appTabItems } from "./nav-items";

const isEditable = (el: Element | null) =>
  el instanceof HTMLElement && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) && !(el instanceof HTMLInputElement && /^(checkbox|radio|button|submit|file|range)$/.test(el.type));

/** 입력 중(키보드가 올라온 상태)이면 하단 탭을 숨긴다 */
function useTyping() {
  const [typing, setTyping] = useState(false);
  useEffect(() => {
    const update = () => setTyping(isEditable(document.activeElement));
    const onFocusOut = () => setTimeout(update, 0);
    document.addEventListener("focusin", update);
    document.addEventListener("focusout", onFocusOut);
    return () => {
      document.removeEventListener("focusin", update);
      document.removeEventListener("focusout", onFocusOut);
    };
  }, []);
  return typing;
}

/** 안드로이드 앱(WebView) 전용 레이아웃: 상단 바 + 하단 탭. 검색은 각 목록 화면의 검색창을 쓴다 */
export function MobileAppShell({ officeName, children }: { officeName: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isTabRoot = appTabItems.some((t) => t.href === pathname);
  const typing = useTyping();

  // 포털(다이얼로그·팝오버)도 앱 전용 스타일(app:)을 받도록 html에도 표시한다
  useEffect(() => {
    document.documentElement.dataset.app = "";
    return () => {
      delete document.documentElement.dataset.app;
    };
  }, []);

  // 문서 전체가 아니라 본문만 스크롤해 상단 바·하단 탭이 오버스크롤·키보드에 밀리지 않게 한다
  return (
    <div data-app="" className="fixed inset-0 flex flex-col bg-muted/30">
      <BusyOverlay />
      <header className="z-30 flex h-14 shrink-0 items-center gap-2 border-b bg-background px-3">
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
        <Link href="/notifications" aria-label="알림" className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "ml-auto")}>
          <Bell />
        </Link>
      </header>

      <main className="w-full min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-none p-4">{children}</main>

      <nav
        className={cn(
          "z-30 grid shrink-0 grid-cols-5 border-t bg-background pb-[env(safe-area-inset-bottom)]",
          typing && "hidden"
        )}
      >
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
