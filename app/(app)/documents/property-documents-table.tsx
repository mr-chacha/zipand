import Link from "next/link";
import { FileText, Plus } from "lucide-react";
import { DocumentExtractionBadge } from "@/components/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DOC_TYPES, type DocType } from "@/lib/constants";
import { formatDate } from "@/lib/format";

export type PropertyDocumentRow = {
  id: string;
  doc_type: string;
  file_name: string;
  status: string;
  extraction_status: string;
  extraction_error: string | null;
  issued_at: string | null;
  created_at: string;
};

export type PropertyWithDocuments = {
  id: string;
  title: string;
  address: string;
  property_type: string;
  deal_type: string;
  documents: PropertyDocumentRow[];
};

/** 테이블 헤더용 짧은 이름 */
const DOC_TYPE_SHORT: Record<DocType, string> = {
  등기사항증명서: "등기",
  건축물대장: "건축물대장",
  토지대장: "토지대장",
  지적도: "지적도",
  토지이용계획확인서: "토지이용",
  부동산종합공부: "종합공부",
  기타: "기타",
};

function latestByType(docs: PropertyDocumentRow[], docType: DocType) {
  const list = docs.filter((d) => d.doc_type === docType);
  if (!list.length) return null;
  return list.sort((a, b) => b.created_at.localeCompare(a.created_at))[0]!;
}

function DocCell({
  doc,
  propertyId,
  docType,
}: {
  doc: PropertyDocumentRow | null;
  propertyId: string;
  docType: DocType;
}) {
  if (!doc) {
    return (
      <Link
        href={`/documents?property=${propertyId}`}
        className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
        title={`${docType} 없음`}
      >
        —
      </Link>
    );
  }
  return (
    <Link href={`/documents/${doc.id}`} className="group flex min-w-0 flex-col gap-0.5">
      <span className="flex items-center gap-1">
        <FileText className="size-3.5 shrink-0 text-muted-foreground group-hover:text-foreground" />
        <DocumentExtractionBadge status={doc.extraction_status} />
      </span>
      <span className="truncate text-[11px] text-muted-foreground group-hover:underline">
        {doc.issued_at ? formatDate(doc.issued_at) : formatDate(doc.created_at)}
      </span>
    </Link>
  );
}

export function PropertyDocumentsTable({
  properties,
  emptyHint,
}: {
  properties: PropertyWithDocuments[];
  emptyHint?: string;
}) {
  if (properties.length === 0) {
    return (
      <Card className="items-center gap-3 py-16 text-center text-sm text-muted-foreground">
        <p>{emptyHint ?? "등록한 매물이 없어요."}</p>
        <Link href="/properties/new" className={buttonVariants({ size: "sm" })}>
          <Plus data-icon="inline-start" />
          매물 등록
        </Link>
      </Card>
    );
  }

  return (
    <>
      {/* 데스크톱 테이블 */}
      <Card className="hidden py-0 md:flex">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-48 pl-4">매물</TableHead>
              {DOC_TYPES.map((t) => (
                <TableHead key={t} className="whitespace-nowrap">
                  {DOC_TYPE_SHORT[t]}
                </TableHead>
              ))}
              <TableHead className="pr-4 text-right">서류</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {properties.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="pl-4">
                  <Link href={`/properties/${p.id}`} className="block min-w-0 hover:underline">
                    <p className="max-w-56 truncate font-medium">{p.title}</p>
                    <p className="max-w-56 truncate text-xs text-muted-foreground">{p.address}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {p.property_type} · {p.deal_type}
                    </p>
                  </Link>
                </TableCell>
                {DOC_TYPES.map((t) => (
                  <TableCell key={t} className="align-top">
                    <DocCell doc={latestByType(p.documents, t)} propertyId={p.id} docType={t} />
                  </TableCell>
                ))}
                <TableCell className="pr-4 text-right tabular-nums text-sm font-medium">
                  {p.documents.length}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* 모바일 카드 */}
      <div className="grid gap-3 md:hidden">
        {properties.map((p) => {
          const filled = DOC_TYPES.filter((t) => latestByType(p.documents, t));
          return (
            <Card key={p.id} className="gap-3 p-4">
              <div className="min-w-0">
                <Link href={`/properties/${p.id}`} className="font-medium hover:underline">
                  {p.title}
                </Link>
                <p className="truncate text-xs text-muted-foreground">{p.address}</p>
              </div>
              {p.documents.length === 0 ? (
                <p className="text-xs text-muted-foreground">등록된 서류 없음</p>
              ) : (
                <ul className="space-y-1.5">
                  {p.documents
                    .slice()
                    .sort((a, b) => b.created_at.localeCompare(a.created_at))
                    .map((d) => (
                      <li key={d.id}>
                        <Link
                          href={`/documents/${d.id}`}
                          className="flex items-center justify-between gap-2 rounded-md border px-2.5 py-1.5 text-sm hover:bg-muted/50"
                        >
                          <span className="min-w-0 truncate">
                            {d.doc_type}
                            <span className="ml-1 text-xs text-muted-foreground">{d.file_name}</span>
                          </span>
                          <DocumentExtractionBadge status={d.extraction_status} />
                        </Link>
                      </li>
                    ))}
                </ul>
              )}
              <p className="text-[11px] text-muted-foreground">
                {filled.length}/{DOC_TYPES.length} 종류 · 총 {p.documents.length}건
              </p>
            </Card>
          );
        })}
      </div>
    </>
  );
}
