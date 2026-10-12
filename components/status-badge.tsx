import { AlertTriangle, CheckCircle2, Info, Loader2, ShieldAlert, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { AnalysisStatus, ExtractSource, PropertyStatus, SignalLevel } from "@/types";

const propertyStatusStyle: Record<PropertyStatus, string> = {
  "임장 전": "bg-muted text-muted-foreground",
  "광고 중": "bg-primary/10 text-primary",
  "계약 진행": "bg-warning/15 text-warning",
  "계약 완료": "bg-success/15 text-success",
  보류: "bg-destructive/10 text-destructive",
};

export function PropertyStatusBadge({ status }: { status: PropertyStatus }) {
  return <Badge className={cn("border-0", propertyStatusStyle[status])}>{status}</Badge>;
}

const analysisStatusStyle: Record<AnalysisStatus, { className: string; icon: React.ElementType }> = {
  "분석 중": { className: "bg-primary/10 text-primary", icon: Loader2 },
  "검토 필요": { className: "bg-warning/15 text-warning", icon: AlertTriangle },
  "검토 완료": { className: "bg-success/15 text-success", icon: CheckCircle2 },
  실패: { className: "bg-destructive/10 text-destructive", icon: XCircle },
};

export function AnalysisStatusBadge({ status }: { status: AnalysisStatus }) {
  const { className, icon: Icon } = analysisStatusStyle[status];
  return (
    <Badge className={cn("border-0", className)}>
      <Icon data-icon="inline-start" className={cn(status === "분석 중" && "animate-spin")} />
      {status}
    </Badge>
  );
}

const signalStyle: Record<SignalLevel, { className: string; icon: React.ElementType }> = {
  "전문가 검토": { className: "bg-destructive/10 text-destructive", icon: ShieldAlert },
  "확인 필요": { className: "bg-warning/15 text-warning", icon: AlertTriangle },
  참고: { className: "bg-muted text-muted-foreground", icon: Info },
};

export function SignalBadge({ level }: { level: SignalLevel }) {
  const { className, icon: Icon } = signalStyle[level];
  return (
    <Badge className={cn("border-0", className)}>
      <Icon data-icon="inline-start" />
      {level}
    </Badge>
  );
}

const sourceStyle: Record<ExtractSource, string> = {
  "AI 추출": "border-primary/30 text-primary",
  "사용자 수정": "border-success/40 text-success",
  "직접 입력": "border-border text-muted-foreground",
};

export function SourceBadge({ source }: { source: ExtractSource }) {
  return (
    <Badge variant="outline" className={cn("text-[10px]", sourceStyle[source])}>
      {source}
    </Badge>
  );
}
