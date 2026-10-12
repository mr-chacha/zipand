"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2, FileText, Quote } from "lucide-react";
import { SignalBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { DocumentAnalysis, Evidence, PropertyDocument } from "@/types";

const LOW_CONFIDENCE = 0.8;

function ConfidenceLabel({ value }: { value: number }) {
  const low = value < LOW_CONFIDENCE;
  return (
    <span className={cn("text-xs tabular-nums", low ? "font-medium text-warning" : "text-muted-foreground")}>
      신뢰도 {Math.round(value * 100)}%{low && " · 원문 대조 필요"}
    </span>
  );
}

function EvidenceButton({
  evidence,
  active,
  onSelect,
}: {
  evidence: Evidence;
  active: boolean;
  onSelect: (e: Evidence) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(evidence)}
      className={cn(
        "flex w-full items-start gap-2 rounded-md border px-2.5 py-2 text-left text-xs transition-colors",
        active ? "border-primary bg-primary/5" : "bg-muted/40 hover:bg-muted"
      )}
    >
      <Quote className="mt-0.5 size-3 shrink-0 text-muted-foreground" />
      <span className="flex-1 text-muted-foreground">{evidence.text}</span>
      <Badge variant="outline" className="shrink-0 text-[10px]">
        p.{evidence.page}
      </Badge>
    </button>
  );
}

export function AnalysisReview({ doc, analysis }: { doc: PropertyDocument; analysis: DocumentAnalysis }) {
  const [selected, setSelected] = useState<Evidence>(analysis.fields[0].evidence);
  const [reviewed, setReviewed] = useState<Record<string, boolean>>(
    Object.fromEntries(analysis.fields.map((f) => [f.label, f.reviewed]))
  );
  const reviewedCount = Object.values(reviewed).filter(Boolean).length;
  const allReviewed = reviewedCount === analysis.fields.length;

  const pageEvidence = [...analysis.fields.map((f) => f.evidence), ...analysis.signals.map((s) => s.evidence)].filter(
    (e, i, arr) => e.page === selected.page && arr.findIndex((x) => x.text === e.text) === i
  );

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="lg:sticky lg:top-20 lg:self-start">
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5 text-sm">
            <FileText className="size-4" />
            원문 미리보기
          </CardTitle>
          <CardDescription>항목의 근거를 누르면 해당 페이지와 문구가 표시돼요</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-1">
            {Array.from({ length: doc.pages }).map((_, i) => (
              <Button
                key={i}
                size="xs"
                variant={selected.page === i + 1 ? "default" : "outline"}
                onClick={() => setSelected({ page: i + 1, text: "" })}
              >
                {i + 1}
              </Button>
            ))}
          </div>
          <div className="aspect-[1/1.414] space-y-3 overflow-hidden rounded-lg border bg-white p-6 font-mono text-[11px] leading-relaxed text-neutral-500 shadow-inner">
            <p className="text-center text-xs font-bold text-neutral-800">
              {doc.type} — {selected.page} / {doc.pages}
            </p>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <div className="h-2 w-3/4 rounded bg-neutral-200" />
                <div className="h-2 w-full rounded bg-neutral-100" />
                <div className="h-2 w-5/6 rounded bg-neutral-100" />
              </div>
            ))}
            {pageEvidence.map((e) => (
              <p
                key={e.text}
                className={cn(
                  "rounded px-1 py-0.5",
                  e.text === selected.text ? "bg-warning/30 text-neutral-900 ring-2 ring-warning" : "bg-yellow-100/60"
                )}
              >
                {e.text}
              </p>
            ))}
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <div className="h-2 w-full rounded bg-neutral-100" />
                <div className="h-2 w-2/3 rounded bg-neutral-100" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Tabs defaultValue="fields">
          <TabsList className="w-full">
            <TabsTrigger value="fields">추출 항목 ({analysis.fields.length})</TabsTrigger>
            <TabsTrigger value="signals">확인할 사항 ({analysis.signals.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="fields" className="mt-4 space-y-3">
            {analysis.fields.map((field) => (
              <Card key={field.label} size="sm">
                <CardContent className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground">{field.label}</p>
                      <p className="font-medium">{field.value}</p>
                    </div>
                    <label className="flex shrink-0 items-center gap-1.5 text-xs">
                      <Checkbox
                        checked={reviewed[field.label]}
                        onCheckedChange={(v) => setReviewed((r) => ({ ...r, [field.label]: Boolean(v) }))}
                      />
                      확인함
                    </label>
                  </div>
                  <ConfidenceLabel value={field.confidence} />
                  <EvidenceButton
                    evidence={field.evidence}
                    active={selected.text === field.evidence.text}
                    onSelect={setSelected}
                  />
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="signals" className="mt-4 space-y-3">
            {analysis.signals.map((signal) => (
              <Card key={signal.id} size="sm">
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <SignalBadge level={signal.level} />
                    <p className="font-medium">{signal.title}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">{signal.description}</p>
                  <EvidenceButton
                    evidence={signal.evidence}
                    active={selected.text === signal.evidence.text}
                    onSelect={setSelected}
                  />
                  <div className="flex items-start gap-2 rounded-md bg-primary/5 px-3 py-2 text-sm">
                    <ArrowRight className="mt-0.5 size-4 shrink-0 text-primary" />
                    <span>
                      <span className="font-medium text-primary">다음 행동 </span>
                      {signal.nextAction}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
            <p className="px-1 text-xs text-muted-foreground">
              표시된 항목은 문서 문구를 기준으로 한 확인 신호이며 법률적 판단이 아니에요. 표시되지 않았다고 위험이 없다는
              의미는 아니에요.
            </p>
          </TabsContent>
        </Tabs>

        <Card size="sm" className="sticky bottom-4 shadow-lg">
          <CardContent className="flex items-center gap-3">
            <div className="flex-1 text-sm">
              <p className="font-medium">
                검토 {reviewedCount} / {analysis.fields.length}
              </p>
              <p className="text-xs text-muted-foreground">모든 항목을 확인하면 검토를 완료할 수 있어요</p>
            </div>
            <Button disabled={!allReviewed}>
              <CheckCircle2 data-icon="inline-start" />
              검토 완료
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
