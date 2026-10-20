"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Bell, LifeBuoy, LogOut, Menu, Search, Settings, UserRound } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { logout } from "@/lib/actions/auth";
import { ROLE_LABELS } from "@/lib/constants";
import { Logo } from "./logo";
import { SidebarNav } from "./sidebar-nav";

const SEARCH_SCOPES = [
  { path: "/properties", placeholder: "매물명, 주소, 지역 검색" },
  { path: "/customers", placeholder: "고객 이름, 연락처, 지역 검색" },
  { path: "/documents", placeholder: "문서 종류, 파일명, 매물명 검색" },
  { path: "/contracts", placeholder: "계약서 제목, 당사자, 소재지 검색" },
];

interface AppHeaderProps {
  userName: string;
  officeName: string;
  role: string;
}

export function AppHeader({ userName, officeName, role }: AppHeaderProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const scope = SEARCH_SCOPES.find((s) => pathname === s.path || pathname.startsWith(`${s.path}/`));
  const currentQuery = scope && pathname === scope.path ? (searchParams.get("q") ?? "") : "";

  const onSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!scope) return;
    const q = String(new FormData(e.currentTarget).get("q") ?? "").trim();
    router.push(q ? `${scope.path}?q=${encodeURIComponent(q)}` : scope.path);
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur lg:px-6">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger render={<Button variant="ghost" size="icon" className="lg:hidden" />}>
          <Menu />
          <span className="sr-only">메뉴 열기</span>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-4">
          <SheetHeader className="p-0">
            <SheetTitle render={<div />}>
              <Logo />
            </SheetTitle>
          </SheetHeader>
          <SidebarNav onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      {scope && (
        <form onSubmit={onSearch} className="relative hidden max-w-md flex-1 md:block">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            key={`${scope.path}:${currentQuery}`}
            name="q"
            type="search"
            defaultValue={currentQuery}
            placeholder={scope.placeholder}
            aria-label={scope.placeholder}
            className="pl-8"
          />
        </form>
      )}

      <div className="ml-auto flex items-center gap-2">
        <Badge variant="secondary" className="hidden sm:inline-flex">
          {ROLE_LABELS[role]}
        </Badge>
        <Link href="/notifications" aria-label="알림" className={buttonVariants({ variant: "ghost", size: "icon" })}>
          <Bell />
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" className="h-9 gap-2 px-1.5" />}>
            <Avatar className="size-7">
              <AvatarFallback className="bg-primary/10 text-xs text-primary">{userName.slice(0, 1)}</AvatarFallback>
            </Avatar>
            <span className="hidden text-sm sm:inline">{userName}</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel>
                <p className="font-medium text-foreground">{userName}</p>
                <p className="text-xs">{officeName}</p>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem render={<Link href="/mypage" />}>
              <UserRound />
              마이페이지
            </DropdownMenuItem>
            <DropdownMenuItem render={<Link href="/settings?tab=account" />}>
              <Settings />
              계정 설정
            </DropdownMenuItem>
            <DropdownMenuItem render={<Link href="/help" />}>
              <LifeBuoy />
              고객센터
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => logout()}>
              <LogOut />
              로그아웃
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
