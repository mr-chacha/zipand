import Link from "next/link";
import { Clock, Hourglass, Sparkles } from "lucide-react";
import { StatusScreen } from "@/components/status-screen";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function ComingSoonBadge({ className }: { className?: string }) {
  return (
    <Badge variant="outline" className={cn("text-[10px] text-muted-foreground", className)}>
      서비스 준비중
    </Badge>
  );
}

/** AI·앱 연동 기능 자리. 클릭할 수 없고 "서비스 준비중" 표시를 함께 보여준다. */
export function ComingSoonButton({
  children,
  icon = true,
  ...props
}: React.ComponentProps<typeof Button> & { icon?: boolean }) {
  return (
    <Button type="button" variant="outline" disabled title="서비스 준비중" {...props}>
      {icon && <Sparkles data-icon="inline-start" />}
      {children}
      <span className="ml-1 rounded-full bg-muted px-1.5 text-[10px] font-normal text-muted-foreground">
        준비중
      </span>
    </Button>
  );
}

/** 메뉴 전체가 준비중일 때 쓰는 화면. 대신 쓸 수 있는 기능 링크를 함께 안내한다. */
export function ComingSoonScreen({
  icon = Hourglass,
  title,
  description,
  alternatives = [],
  children,
}: {
  icon?: React.ElementType;
  title: string;
  description: React.ReactNode;
  alternatives?: { label: string; href: string }[];
  children?: React.ReactNode;
}) {
  return (
    <StatusScreen
      icon={icon}
      badge={<ComingSoonBadge className="text-xs" />}
      title={title}
      description={description}
      actions={alternatives.map((alt, i) => (
        <Link key={alt.href} href={alt.href} className={buttonVariants({ variant: i === 0 ? "default" : "outline" })}>
          {alt.label}
        </Link>
      ))}
    >
      {children}
    </StatusScreen>
  );
}

export function ComingSoonPanel({
  title,
  description,
  className,
}: {
  title: string;
  description: string;
  className?: string;
}) {
  return (
    <Card className={cn("border-dashed bg-muted/20", className)}>
      <CardContent className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Clock className="size-4" />
        </span>
        <div className="space-y-1">
          <p className="flex items-center gap-2 text-sm font-medium">
            {title}
            <ComingSoonBadge />
          </p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}
