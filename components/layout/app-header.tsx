"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, LogOut, Menu, Search, User } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { currentUser } from "@/lib/mock/dashboard";
import { Logo } from "./logo";
import { SidebarNav } from "./sidebar-nav";

export function AppHeader() {
  const [open, setOpen] = useState(false);

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

      <div className="relative hidden max-w-md flex-1 md:block">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="매물명, 주소, 고객 검색" className="pl-8" />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Badge variant="secondary" className="hidden sm:inline-flex">
          {currentUser.plan} 플랜
        </Badge>
        <Button variant="ghost" size="icon" className="relative">
          <Bell />
          <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-destructive" />
          <span className="sr-only">알림</span>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="ghost" className="h-9 gap-2 px-1.5" />}
          >
            <Avatar className="size-7">
              <AvatarFallback className="bg-primary/10 text-xs text-primary">
                {currentUser.name.slice(0, 1)}
              </AvatarFallback>
            </Avatar>
            <span className="hidden text-sm sm:inline">{currentUser.name}</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel>
                <p className="font-medium text-foreground">{currentUser.name}</p>
                <p className="text-xs">{currentUser.office}</p>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User />
              내 계정
            </DropdownMenuItem>
            <DropdownMenuItem render={<Link href="/login" />}>
              <LogOut />
              로그아웃
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
