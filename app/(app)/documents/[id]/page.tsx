import Link from "next/link";
import { notFound } from "next/navigation";
import { Download, RotateCcw } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { AnalysisStatusBadge } from "@/components/status-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { documents, getAnalysis, getDocument } from "@/lib/mock/documents";
import { AnalysisReview } from "./analysis-review";

export function generateStaticParams() {
  return documents.map((d) => ({ id: d.id }));
}

export async function generateMetadata({ params }: PageProps<"/documents/[id]">) {
  const { id } = await params;
  return { title: `${getDocument(id)?.type ?? "문서"} 분석 결과` };
}

export default async function DocumentDetailPage({ params }: PageProps<"/documents/[id]">) {
  const { id } = await params;
  const doc = getDocument(id);
  if (!doc) notFound();
  const analysis = getAnalysis(id);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${doc.type} 분석 결과`}
        description={`${doc.propertyTitle} · ${doc.fileName}`}
        backHref="/documents"
        backLabel="AI 문서 분석"
        actions={
          <>
            <Button variant="outline">
              <RotateCcw data-icon="inline-start" />
              재분석
            </Button>
            <Button variant="outline">
              <Download data-icon="inline-start" />
              결과 내보내기
            </Button>
          </>
        }
      />

      <Card size="sm">
        <CardContent className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <AnalysisStatusBadge status={doc.status} />
          <span>
            <span className="text-muted-foreground">발급일 </span>
            {doc.issuedAt ?? "-"}
          </span>
          <span>
            <span className="text-muted-foreground">페이지 </span>
            {doc.pages}
          </span>
          <span>
            <span className="text-muted-foreground">업로드 </span>
            {doc.uploadedAt}
          </span>
          {analysis && (
            <span className="text-xs text-muted-foreground sm:ml-auto">분석 모델 {analysis.modelVersion}</span>
          )}
        </CardContent>
      </Card>

      {analysis ? (
        <AnalysisReview doc={doc} analysis={analysis} />
      ) : (
        <Card className="items-center gap-3 py-16 text-center">
          <p className="text-sm text-muted-foreground">이 문서의 상세 분석 결과는 목업 데이터에 없어요.</p>
          <Link href="/documents/d-2001" className={buttonVariants({ variant: "outline", size: "sm" })}>
            예시 결과 보기
          </Link>
        </Card>
      )}
    </div>
  );
}
