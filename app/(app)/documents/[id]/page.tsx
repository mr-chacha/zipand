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

/** 상대 경로만 허용 (오픈 리다이렉트 방지) */
function safeReturnPath(raw: string | string[] | undefined): string | null {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (!v || !v.startsWith("/") || v.startsWith("//") || v.includes("://")) return null;
  return v;
}

export default async function DocumentDetailPage({
  params,
  searchParams,
}: PageProps<"/documents/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
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
    // 문서 원문은 캐시된 만료 토큰(InvalidJWT exp)이 남지 않게 항상 새로 발급
    signedUrls(supabase, "documents", [doc.storage_path], 60 * 60, { fresh: true }),
  ]);
  const fileUrl = urls[doc.storage_path] ?? null;
  const isPdf = doc.file_name.toLowerCase().endsWith(".pdf");
  const property = Array.isArray(doc.property) ? doc.property[0] : doc.property;
  const uploader = Array.isArray(doc.uploader) ? doc.uploader[0] : doc.uploader;
  const reviewer = Array.isArray(doc.reviewer) ? doc.reviewer[0] : doc.reviewer;
  const presets = DOC_FIELD_PRESETS[doc.doc_type as DocType] ?? [];
  const presetRank = new Map(presets.map((label, i) => [label, i]));
  const orderedFields = [...(fields.data ?? [])].sort((a, b) => {
    const ai = presetRank.get(a.label) ?? 1000;
    const bi = presetRank.get(b.label) ?? 1000;
    if (ai !== bi) return ai - bi;
    return a.created_at.localeCompare(b.created_at);
  });
  const reviewKey = [
    doc.status,
    ...orderedFields.map((field) => `${field.id}:${field.reviewed}`),
    ...(signals.data ?? []).map((signal) => `${signal.id}:${signal.reviewed}`),
  ].join("|");

  const returnTo = safeReturnPath(sp.return);
  const backHref =
    returnTo ?? (property ? `/properties/${property.id}?tab=docs` : "/documents");
  const backLabel = property || returnTo?.includes("/properties/") ? "매물 문서" : "문서 관리";

  return (
    <div className="space-y-6">
      <PageHeader
        title={doc.doc_type}
        description={`${property?.title ?? ""} · ${doc.file_name}`}
        backHref={backHref}
        backLabel={backLabel}
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
          key={reviewKey}
          documentId={id}
          docType={doc.doc_type}
          status={doc.status}
          issuedAt={doc.issued_at}
          presets={presets}
          fields={orderedFields}
          signals={signals.data ?? []}
        />
      </div>
    </div>
  );
}
