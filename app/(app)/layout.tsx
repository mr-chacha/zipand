import Link from "next/link";
import { redirect } from "next/navigation";
import { AppMain } from "./app-main";
import { AppHeader } from "@/components/layout/app-header";
import { Logo } from "@/components/layout/logo";
import { MobileAppShell } from "@/components/layout/mobile-app-shell";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { NotificationScheduler } from "@/components/notifications/notification-scheduler";
import { isAppRequest } from "@/lib/app-mode";
import { getSession } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/constants";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [{ profile, office }, isApp] = await Promise.all([getSession(), isAppRequest()]);
  if (!profile.onboarded_at) redirect("/onboarding");

  if (isApp) {
    return (
      <MobileAppShell officeName={office.name}>
        <NotificationScheduler />
        {children}
      </MobileAppShell>
    );
  }

  return (
    <div className="flex min-h-screen bg-muted/30">
      <NotificationScheduler />
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-6 border-r bg-sidebar p-4 lg:flex print:hidden">
        <Logo className="px-2" />
        <SidebarNav />
        <Link href="/mypage" className="rounded-lg border bg-background p-3 text-xs transition-colors hover:border-primary/40">
          <p className="truncate font-medium">{office.name}</p>
          <p className="text-muted-foreground">
            {profile.name} · {ROLE_LABELS[profile.role]}
          </p>
        </Link>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="print:hidden">
          <AppHeader userName={profile.name} officeName={office.name} role={profile.role} />
        </div>
        <main className="min-w-0 w-full flex-1">
          <AppMain>{children}</AppMain>
        </main>
      </div>
    </div>
  );
}
