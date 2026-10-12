import { AlertTriangle, CheckCircle2, Info, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const propertyStatusStyle: Record<string, string> = {
  "임장 전": "bg-muted text-muted-foreground",
  "광고 중": "bg-primary/10 text-primary",
  "계약 진행": "bg-warning/15 text-warning",
  "계약 완료": "bg-success/15 text-success",
  보류: "bg-destructive/10 text-destructive",
};

export function PropertyStatusBadge({ status }: { status: string }) {
  return <Badge className={cn("border-0", propertyStatusStyle[status])}>{status}</Badge>;
}

export function DocStatusBadge({ status }: { status: string }) {
  const done = status === "검토 완료";
  const Icon = done ? CheckCircle2 : AlertTriangle;
  return (
    <Badge className={cn("border-0", done ? "bg-success/15 text-success" : "bg-warning/15 text-warning")}>
      <Icon data-icon="inline-start" />
      {status}
    </Badge>
  );
}

const signalStyle: Record<string, { className: string; icon: React.ElementType }> = {
  "전문가 검토": { className: "bg-destructive/10 text-destructive", icon: ShieldAlert },
  "확인 필요": { className: "bg-warning/15 text-warning", icon: AlertTriangle },
  참고: { className: "bg-muted text-muted-foreground", icon: Info },
};

export function SignalBadge({ level }: { level: string }) {
  const { className, icon: Icon } = signalStyle[level] ?? signalStyle["참고"];
  return (
    <Badge className={cn("border-0", className)}>
      <Icon data-icon="inline-start" />
      {level}
    </Badge>
  );
}

const dealStageStyle: Record<string, string> = {
  "조건 협의": "bg-muted text-muted-foreground",
  "서류 확인": "bg-primary/10 text-primary",
  "계약 준비": "bg-warning/15 text-warning",
  "잔금 대기": "bg-warning/15 text-warning",
  완료: "bg-success/15 text-success",
  취소: "bg-destructive/10 text-destructive",
};

export function DealStageBadge({ stage }: { stage: string }) {
  return <Badge className={cn("border-0", dealStageStyle[stage])}>{stage}</Badge>;
}

const customerStatusStyle: Record<string, string> = {
  "진행 중": "bg-primary/10 text-primary",
  "계약 완료": "bg-success/15 text-success",
  보류: "bg-warning/15 text-warning",
  종료: "bg-muted text-muted-foreground",
};

export function CustomerStatusBadge({ status }: { status: string }) {
  return <Badge className={cn("border-0", customerStatusStyle[status])}>{status}</Badge>;
}
