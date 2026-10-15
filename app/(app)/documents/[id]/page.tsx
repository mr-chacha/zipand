import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { DocStatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSession } from "@/lib/auth";
import { DOC_FIELD_PRESETS, type DocType } from "@/lib/constants";
import { formatDateTime, formatFileSize } from "@/lib/format";
import { signedUrls } from "@/lib/storage";
import { DocumentReview } from "./document-review";

export const metadata: Metadata = { title: "문서 검토" };

export default async function DocumentDetailPage({ params }: PageProps<"/documents/[id]">) {
  const { id } = await params;
  const { supabase } = await getSession();

  const { data: doc } = await supabase
    .from("documents")
    .select(
      "*, property:properties(id, title, address), uploader:profiles!documents_uploaded_by_fkey(name), reviewer:profiles!documents_reviewed_by_fkey(name)"
    )
    .eq("id", id)
    .maybeSingle();
  if (!doc) notFound();

  const [fields, signals, urls] = await Promise.all([
    supabase.from("document_fields").select("*").eq("document_id", id).order("created_at"),
    supabase.from("document_signals").select("*").eq("document_id", id).order("created_at"),
    signedUrls(supabase, "documents", [doc.storage_path]),
  ]);
  const fileUrl = urls[doc.storage_path];
  const isPdf = doc.file_name.toLowerCase().endsWith(".pdf");

  return (
    <div className="space-y-6">
      <PageHeader
        title={doc.doc_type}
        description={`${doc.property?.title ?? ""} · ${doc.file_name}`}
        backHref="/documents"
        backLabel="문서 관리"
        actions={<DocStatusBadge status={doc.status} />}
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="overflow-hidden">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>원문</CardTitle>
            {fileUrl && (
              <a href={fileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-primary hover:underline">
                새 창에서 열기
                <ExternalLink className="size-3" />
              </a>
            )}
          </CardHeader>
          <CardContent>
            {!fileUrl ? (
              <p className="py-20 text-center text-sm text-muted-foreground">파일을 불러오지 못했어요.</p>
            ) : isPdf ? (
              <iframe src={fileUrl} title={doc.file_name} className="h-[70vh] w-full rounded-lg border" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={fileUrl} alt={doc.file_name} className="w-full rounded-lg border" />
            )}
            <dl className="mt-4 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div>
                <dt>매물</dt>
                <dd className="text-foreground">
                  {doc.property ? (
                    <Link href={`/properties/${doc.property.id}`} className="hover:underline">
                      {doc.property.title}
                    </Link>
                  ) : (
                    "-"
                  )}
                </dd>
              </div>
              <div>
                <dt>파일 크기</dt>
                <dd className="text-foreground">{formatFileSize(doc.file_size)}</dd>
              </div>
              <div>
                <dt>업로드</dt>
                <dd className="text-foreground">
                  {formatDateTime(doc.created_at)} {doc.uploader?.name && `· ${doc.uploader.name}`}
                </dd>
              </div>
              <div>
                <dt>검토</dt>
                <dd className="text-foreground">
                  {doc.reviewed_at ? `${formatDateTime(doc.reviewed_at)} · ${doc.reviewer?.name ?? ""}` : "-"}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <DocumentReview
          documentId={id}
          status={doc.status}
          issuedAt={doc.issued_at}
          presets={DOC_FIELD_PRESETS[doc.doc_type as DocType] ?? []}
          fields={fields.data ?? []}
          signals={signals.data ?? []}
        />
      </div>
    </div>
  );
}
