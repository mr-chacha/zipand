import { AppHeader } from "@/components/layout/app-header";
import { Logo } from "@/components/layout/logo";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { currentUser } from "@/lib/mock/dashboard";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-muted/30">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-6 border-r bg-sidebar p-4 lg:flex">
        <Logo className="px-2" />
        <SidebarNav />
        <div className="rounded-lg border bg-background p-3 text-xs">
          <p className="font-medium">{currentUser.office}</p>
          <p className="text-muted-foreground">{currentUser.role}</p>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader />
        <main className="mx-auto w-full max-w-7xl flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
