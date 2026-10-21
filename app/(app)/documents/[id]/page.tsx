import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { DocStatusBadge } from "@/components/status-badge";
import { getSession } from "@/lib/auth";
import { DOC_FIELD_PRESETS, type DocType } from "@/lib/constants";
import { signedUrls } from "@/lib/storage";
import { DocumentOriginal } from "./document-original";
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
  const fileUrl = urls[doc.storage_path] ?? null;
  const isPdf = doc.file_name.toLowerCase().endsWith(".pdf");
  const property = Array.isArray(doc.property) ? doc.property[0] : doc.property;
  const uploader = Array.isArray(doc.uploader) ? doc.uploader[0] : doc.uploader;
  const reviewer = Array.isArray(doc.reviewer) ? doc.reviewer[0] : doc.reviewer;

  return (
    <div className="space-y-6">
      <PageHeader
        title={doc.doc_type}
        description={`${property?.title ?? ""} · ${doc.file_name}`}
        backHref="/documents"
        backLabel="문서 관리"
        actions={<DocStatusBadge status={doc.status} />}
      />

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(20rem,1fr)]">
        <DocumentOriginal
          fileUrl={fileUrl}
          fileName={doc.file_name}
          isPdf={isPdf}
          fileSize={doc.file_size}
          property={property ? { id: property.id, title: property.title } : null}
          createdAt={doc.created_at}
          uploaderName={uploader?.name ?? null}
          reviewedAt={doc.reviewed_at}
          reviewerName={reviewer?.name ?? null}
        />

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
