import type { Metadata } from "next";
import Link from "next/link";
import { FileText, ShieldCheck } from "lucide-react";
import { ComingSoonPanel } from "@/components/coming-soon";
import { OfficeRequiredNotice } from "@/components/office-gate";
import { PageHeader } from "@/components/page-header";
import { DocStatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSession } from "@/lib/auth";
import { formatDate, formatDateTime, formatFileSize } from "@/lib/format";
import { getOfficeGate } from "@/lib/office-gate";
import { getPropertyOptions } from "@/lib/queries";
import { DocumentUploader } from "./document-uploader";

export const metadata: Metadata = { title: "문서 관리" };

export default async function DocumentsPage({ searchParams }: PageProps<"/documents">) {
  const { property, status, q } = await searchParams;
  const keyword = typeof q === "string" ? q.trim() : "";
  const { supabase, office } = await getSession();

  let query = supabase
    .from("documents")
    .select("id, doc_type, file_name, file_size, status, issued_at, created_at, property:properties(id, title)")
    .order("created_at", { ascending: false });
  if (typeof status === "string" && status) query = query.eq("status", status);
  const [{ data: allDocuments }, propertyOptions, gate] = await Promise.all([query, getPropertyOptions(), getOfficeGate()]);
  const documents = keyword
    ? (allDocuments ?? []).filter((d) => `${d.doc_type} ${d.file_name} ${d.property?.title ?? ""}`.includes(keyword))
    : allDocuments;

  const filters = [
    { label: "전체", value: "" },
    { label: "검토 필요", value: "검토 필요" },
    { label: "검토 완료", value: "검토 완료" },
  ];
  const currentStatus = typeof status === "string" ? status : "";

  return (
    <div className="space-y-6">
      <PageHeader
        title="문서 관리"
        description="등기사항증명서·건축물대장을 매물에 연결해 보관하고, 핵심 항목과 확인할 사항을 원문 근거와 함께 정리해요."
      />

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>서류 업로드</CardTitle>
            <CardDescription>PDF, JPG, PNG · 최대 20MB</CardDescription>
          </CardHeader>
          <CardContent>
            {gate.blocked.document ? (
              <OfficeRequiredNotice kind="document" isOwner={gate.isOwner} next="/documents" />
            ) : (
              <DocumentUploader
                officeId={office.id}
                properties={propertyOptions.map((p) => ({ value: p.id, label: p.title }))}
                defaultPropertyId={typeof property === "string" ? property : undefined}
              />
            )}
          </CardContent>
        </Card>
        <div className="space-y-4 lg:col-span-2">
          <ComingSoonPanel
            title="AI 문서 분석"
            description="OCR로 소유자·근저당권·위반건축물 등 핵심 항목을 자동 추출하고 원문 근거를 연결하는 기능은 서비스 준비중이에요. 지금은 문서 상세에서 직접 입력하고 검토할 수 있어요."
          />
          <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-4 shrink-0" />
            업로드한 문서는 비공개 저장소에 보관되고, 같은 사무소 구성원만 열람할 수 있어요. 열람 링크는 1시간 후 만료돼요.
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {keyword ? `'${keyword}' 검색 결과` : "보관 문서"} ({documents?.length ?? 0})
          </CardTitle>
          <div className="flex gap-1 pt-1">
            {filters.map((f) => (
              <Link
                key={f.label}
                href={`/documents?${new URLSearchParams({ ...(f.value && { status: f.value }), ...(keyword && { q: keyword }) })}`}
                className={`rounded-full px-3 py-1 text-xs ${
                  currentStatus === f.value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {f.label}
              </Link>
            ))}
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {(documents ?? []).length === 0 && (
            <p className="py-10 text-center text-sm text-muted-foreground">문서가 없어요.</p>
          )}
          {documents?.map((doc) => (
            <Link
              key={doc.id}
              href={`/documents/${doc.id}`}
              className="flex flex-col gap-2 rounded-lg border p-3 hover:bg-muted/50 sm:flex-row sm:items-center"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                <FileText className="size-5 text-muted-foreground" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{doc.doc_type}</p>
                  <DocStatusBadge status={doc.status} />
                </div>
                <p className="truncate text-sm text-muted-foreground">
                  {doc.property?.title} · {doc.file_name} · {formatFileSize(doc.file_size)}
                </p>
              </div>
              <div className="text-xs text-muted-foreground sm:text-right">
                <p>업로드 {formatDateTime(doc.created_at)}</p>
                <p>발급일 {formatDate(doc.issued_at)}</p>
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
