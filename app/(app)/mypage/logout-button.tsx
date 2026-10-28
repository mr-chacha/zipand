"use client";

import { useTransition } from "react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logout } from "@/lib/actions/auth";
import { useBusy } from "@/lib/busy";

export function LogoutButton() {
  const [pending, startTransition] = useTransition();
  useBusy(pending, "로그아웃하고 있습니다…");
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
