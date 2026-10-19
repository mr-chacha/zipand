"use client";

import { useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Download, FileText, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { removeGuaranteeCertificate, saveGuaranteeCertificate } from "@/lib/actions/office";
import { useBusy } from "@/lib/busy";
import { FormError, toErrorMessage } from "@/lib/errors";
import { removeFromStorage, uploadToStorage } from "@/lib/upload-client";
import { cn } from "@/lib/utils";

const ACCEPT = "application/pdf,image/jpeg,image/png,image/webp";
const MAX_BYTES = 20 * 1024 * 1024;

/** 사무소 공제증서 업로드·교체·삭제 (업로드는 대표만) */
export function GuaranteeCertificateUpload({
  officeId,
  fileName,
  downloadUrl,
  canEdit,
}: {
  officeId: string;
  fileName: string | null;
  downloadUrl: string | null;
  canEdit: boolean;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  useBusy(pending);

  const hasFile = Boolean(downloadUrl || fileName);

  const upload = (file: File) => {
    startTransition(async () => {
      let uploaded: string | null = null;
      try {
        if (file.size > MAX_BYTES) throw new FormError("파일은 20MB 이하로 올려 주세요.");
        if (!ACCEPT.split(",").some((t) => file.type === t || (t === "application/pdf" && file.name.toLowerCase().endsWith(".pdf")))) {
          throw new FormError("PDF 또는 이미지 파일만 올릴 수 있어요.");
        }
        uploaded = await uploadToStorage("office-docs", officeId, "guarantee", file);
        const fd = new FormData();
        fd.set("path", uploaded);
        fd.set("file_name", file.name);
        const result = await saveGuaranteeCertificate(null, fd);
        if (result.error) {
          await removeFromStorage("office-docs", [uploaded]);
          toast.error(result.error);
          return;
        }
        toast.success(result.message ?? "공제증서를 저장했어요.");
        router.refresh();
      } catch (e) {
        if (uploaded) await removeFromStorage("office-docs", [uploaded]);
        toast.error(toErrorMessage(e));
      }
    });
  };

  const remove = () =>
    startTransition(async () => {
      const result = await removeGuaranteeCertificate();
      if (result.error) toast.error(result.error);
      else {
        toast.success(result.message ?? "삭제했어요.");
        router.refresh();
      }
    });

  return (
    <div className="space-y-3 rounded-lg border px-3 py-3">
      <div className="flex items-start gap-2">
        <FileText className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-sm font-medium">공제증서</p>
          <p className="text-xs text-muted-foreground">
            업로드하면 계약관리에서 바로 인쇄·다운로드할 수 있어요. PDF 또는 이미지(최대 20MB).
          </p>
        </div>
      </div>

      {hasFile ? (
        <div className="flex flex-wrap items-center gap-2">
          <p className="min-w-0 flex-1 truncate text-sm">{fileName || "공제증서"}</p>
          {downloadUrl && (
            <a
              href={downloadUrl}
              download={fileName ?? "공제증서.pdf"}
              target="_blank"
              rel="noreferrer"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              <Download data-icon="inline-start" />
              다운로드
            </a>
          )}
          {canEdit && (
            <>
              <Button type="button" size="sm" variant="outline" disabled={pending} onClick={() => inputRef.current?.click()}>
                <Upload data-icon="inline-start" />
                교체
              </Button>
              <Button type="button" size="sm" variant="outline" className="text-destructive" disabled={pending} onClick={remove}>
                <Trash2 data-icon="inline-start" />
                삭제
              </Button>
            </>
          )}
        </div>
      ) : canEdit ? (
        <Button type="button" size="sm" variant="secondary" disabled={pending} onClick={() => inputRef.current?.click()}>
          <Upload data-icon="inline-start" />
          공제증서 업로드
        </Button>
      ) : (
        <p className="text-xs text-muted-foreground">아직 업로드된 공제증서가 없어요. 대표가 업로드하면 사용할 수 있어요.</p>
      )}

      {canEdit && (
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) upload(file);
          }}
        />
      )}
    </div>
  );
}
