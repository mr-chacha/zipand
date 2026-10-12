import type { Metadata } from "next";
import Link from "next/link";
import { FileText, ImageUp, PenLine, RefreshCw, ShieldCheck, Upload } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { AnalysisStatusBadge } from "@/components/status-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { documents } from "@/lib/mock/documents";
import { DocumentUploadOptions } from "./upload-options";

export const metadata: Metadata = { title: "AI 문서 분석" };

export default function DocumentsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="AI 문서 분석"
        description="등기사항증명서·건축물대장을 올리면 핵심 항목을 추출하고 원문 근거와 함께 확인할 사항을 알려드려요."
      />

      <Card>
        <CardContent className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <div className="flex h-full min-h-56 flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed bg-muted/30 p-6 text-center">
              <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Upload className="size-6" />
              </span>
              <div>
                <p className="font-medium">파일을 끌어다 놓거나 선택하세요</p>
                <p className="text-sm text-muted-foreground">PDF, JPG, PNG · 최대 20MB · 최대 20페이지</p>
              </div>
              <Button>파일 선택</Button>
            </div>
          </div>
          <div className="space-y-4 lg:col-span-2">
            <DocumentUploadOptions />
            <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
              <ShieldCheck className="mt-0.5 size-4 shrink-0" />
              업로드한 문서는 암호화해 저장되고, 사무소 권한이 있는 사용자만 볼 수 있어요. AI 분석은 업무 보조
              자료이며 최종 확인은 원문으로 해주세요.
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>분석 이력</CardTitle>
          <CardDescription>최근 업로드 순</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {documents.map((doc) => (
            <div key={doc.id} className="rounded-lg border p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <FileText className="size-5 text-muted-foreground" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{doc.type}</p>
                    <AnalysisStatusBadge status={doc.status} />
                  </div>
                  <p className="truncate text-sm text-muted-foreground">
                    {doc.propertyTitle} · {doc.fileName} · {doc.pages}p
                  </p>
                  <p className="text-xs text-muted-foreground">업로드 {doc.uploadedAt}</p>
                </div>
                {(doc.status === "검토 필요" || doc.status === "검토 완료") && (
                  <Link
                    href={`/documents/${doc.id}`}
                    className={buttonVariants({ variant: doc.status === "검토 필요" ? "default" : "outline", size: "sm" })}
                  >
                    {doc.status === "검토 필요" ? "검토하기" : "결과 보기"}
                  </Link>
                )}
              </div>

              {doc.status === "분석 중" && (
                <div className="mt-3 space-y-1.5">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>텍스트 인식 및 항목 추출 중…</span>
                    <span>{doc.progress}%</span>
                  </div>
                  <Progress value={doc.progress ?? null} />
                </div>
              )}

              {doc.status === "실패" && (
                <div className="mt-3 space-y-3 rounded-lg bg-destructive/5 p-3">
                  <p className="text-sm text-destructive">{doc.failReason}</p>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm">
                      <RefreshCw data-icon="inline-start" />
                      다시 업로드
                    </Button>
                    <Button variant="outline" size="sm">
                      <ImageUp data-icon="inline-start" />
                      이미지 보정 후 재분석
                    </Button>
                    <Button variant="ghost" size="sm">
                      <PenLine data-icon="inline-start" />
                      직접 입력
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
