import Link from "next/link";
import { Logo } from "@/components/layout/logo";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur print:hidden">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
          <Logo />
          <nav className="flex gap-4 text-sm text-muted-foreground">
            <Link href="/terms" className="hover:text-foreground">
              이용약관
            </Link>
            <Link href="/privacy" className="hover:text-foreground">
              개인정보 처리방침
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-8 lg:py-12">{children}</main>
      <footer className="border-t py-6 text-center text-xs text-muted-foreground print:hidden">© 2026 집앤</footer>
    </div>
  );
}
