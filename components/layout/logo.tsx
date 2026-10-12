import Link from "next/link";
import { House } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/dashboard" className={cn("flex items-center gap-2 font-bold", className)}>
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <House className="size-4" />
      </span>
      <span className="text-lg tracking-tight">집앤</span>
    </Link>
  );
}
