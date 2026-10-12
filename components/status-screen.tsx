import { cn } from "@/lib/utils";

interface StatusScreenProps {
  icon: React.ElementType;
  /** 404, 500 등 큰 숫자 표기 */
  code?: string;
  badge?: React.ReactNode;
  title: string;
  description: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  /** 사이드바 없는 전체 화면이면 true */
  fullScreen?: boolean;
  className?: string;
}

/** 404·오류·서비스 준비중 등 안내 화면 공용 레이아웃 */
export function StatusScreen({
  icon: Icon,
  code,
  badge,
  title,
  description,
  actions,
  children,
  fullScreen,
  className,
}: StatusScreenProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-6 text-center",
        fullScreen ? "min-h-screen bg-muted/30" : "min-h-[60vh] py-12",
        className
      )}
    >
      <div className="relative mb-6">
        <span className="absolute inset-0 -m-3 rounded-full bg-primary/5" />
        <span className="relative flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="size-7" />
        </span>
      </div>
      {code && <p className="mb-1 text-sm font-semibold tracking-widest text-primary">{code}</p>}
      {badge && <div className="mb-2">{badge}</div>}
      <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{title}</h1>
      <div className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">{description}</div>
      {actions && <div className="mt-6 flex flex-wrap justify-center gap-2">{actions}</div>}
      {children && <div className="mt-8 w-full max-w-2xl">{children}</div>}
    </div>
  );
}
