"use client";

import { useTransition } from "react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logout } from "@/lib/actions/auth";

export function LogoutButton() {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="outline"
      className="w-full text-destructive"
      disabled={pending}
      onClick={() => startTransition(() => logout())}
    >
      <LogOut data-icon="inline-start" />
      로그아웃
    </Button>
  );
}
