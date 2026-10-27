"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { FileText, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { DocumentExtractionBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { extractDocumentsAi } from "@/lib/actions/document-extract";
import { useBusy } from "@/lib/busy";

export type PropertyDocumentListItem = {
  id: string;
  doc_type: string;
  file_name: string;
  extraction_status: string;
};

export function PropertyDocumentsList({
  propertyId,
  documents,
}: {
  propertyId: string;
  documents: PropertyDocumentListItem[];
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();
  useBusy(pending);
  const allSelected = documents.length > 0 && documents.every((doc) => selected.includes(doc.id));

  const toggle = (id: string, checked: boolean) => {
    setSelected((current) => (checked ? [...new Set([...current, id])] : current.filter((item) => item !== id)));
  };

  const extract = () => {
    startTransition(async () => {
      const result = await extractDocumentsAi(selected);
      if (result.error && !result.succeeded) toast.error(result.error);
      else if (result.message) toast.success(result.message);
      setSelected([]);
    });
  };

  if (!documents.length) {
    return <p className="py-8 text-center text-sm text-muted-foreground">등록된 서류가 없어요.</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/30 p-3">
        <div>
          <p className="text-sm font-medium">AI 추출할 서류 선택</p>
          <p className="text-xs text-muted-foreground">
            선택 {selected.length}건 · 서류마다 AI 사용량 1회가 차감됩니다.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() => setSelected(allSelected ? [] : documents.map((doc) => doc.id))}
          >
            {allSelected ? "전체 선택 해제" : "전체 선택"}
          </Button>
          <Button type="button" size="sm" disabled={!selected.length || pending} onClick={extract}>
            {pending ? (
              <Loader2 className="animate-spin" data-icon="inline-start" />
            ) : (
              <Sparkles data-icon="inline-start" />
            )}
            {pending ? "AI 추출 중…" : "선택 서류 AI 추출"}
          </Button>
        </div>
      </div>

      {documents.map((doc) => (
        <div key={doc.id} className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50">
          <Checkbox
            checked={selected.includes(doc.id)}
            onCheckedChange={(value) => toggle(doc.id, Boolean(value))}
            aria-label={`${doc.doc_type} AI 추출 선택`}
          />
          <Link
            href={`/documents/${doc.id}?return=${encodeURIComponent(`/properties/${propertyId}?tab=docs`)}`}
            className="flex min-w-0 flex-1 items-center gap-3"
          >
            <FileText className="size-5 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{doc.doc_type}</p>
              <p className="truncate text-xs text-muted-foreground">{doc.file_name}</p>
            </div>
            <DocumentExtractionBadge status={doc.extraction_status} />
          </Link>
        </div>
      ))}
    </div>
  );
}
