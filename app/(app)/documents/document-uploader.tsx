"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileUp, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { NativeSelect } from "@/components/form/native-select";
import { DatePicker } from "@/components/form/date-picker";
import { Button, buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useBusy } from "@/lib/busy";
import { createDocument } from "@/lib/actions/documents";
import { DOC_TYPES, type DocType } from "@/lib/constants";
import { formatFileSize, todayKst } from "@/lib/format";
import { toErrorMessage } from "@/lib/errors";
import { uploadToStorage } from "@/lib/upload-client";
import { cn } from "@/lib/utils";

const MAX_SIZE = 20 * 1024 * 1024;

interface DocumentUploaderProps {
  officeId: string;
  properties: { value: string; label: string }[];
  defaultPropertyId?: string;
  /** true면 매물 선택을 숨기고 defaultPropertyId만 사용 */
  lockProperty?: boolean;
  /** true면 업로드 후 문서 상세로 이동 (기본 false) */
  goToDetail?: boolean;
}

export function DocumentUploader({
  officeId,
  properties,
  defaultPropertyId,
  lockProperty = false,
  goToDetail = false,
}: DocumentUploaderProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [propertyId, setPropertyId] = useState(defaultPropertyId ?? properties[0]?.value ?? "");
  const [docType, setDocType] = useState<DocType>("등기사항증명서");
  const [issuedAt, setIssuedAt] = useState(() => todayKst());
  const [pending, startTransition] = useTransition();
  useBusy(pending);

  if (properties.length === 0) {
    return (
      <div className="space-y-3 rounded-xl border-2 border-dashed p-8 text-center text-sm text-muted-foreground">
        <p>서류는 매물에 연결해 보관해요. 먼저 매물을 등록해 주세요.</p>
        <Link href="/properties/new" className={buttonVariants({ size: "sm" })}>
          매물 등록
        </Link>
      </div>
    );
  }

  const pick = (f: File | undefined) => {
    if (!f) return;
    if (f.size > MAX_SIZE) {
      toast.error("20MB 이하 파일만 올릴 수 있어요.");
      return;
    }
    setFile(f);
  };

  const submit = () => {
    if (!file || !propertyId) return;
    startTransition(async () => {
      try {
        const storagePath = await uploadToStorage("documents", officeId, propertyId, file);
        const result = await createDocument({
          propertyId,
          docType,
          fileName: file.name,
          storagePath,
          fileSize: file.size,
          issuedAt: issuedAt || null,
        });
        if (result.error || !result.id) {
          toast.error(result.error ?? "업로드에 실패했어요.");
          return;
        }
        toast.success(result.message ?? "업로드했어요.");
        setFile(null);
        if (goToDetail) router.push(`/documents/${result.id}`);
        else router.refresh();
      } catch (e) {
        toast.error(toErrorMessage(e));
      }
    });
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          pick(e.dataTransfer.files[0]);
        }}
        className={cn(
          "flex min-h-44 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-4 text-center transition-colors",
          dragging ? "border-primary bg-primary/5" : "bg-muted/30 hover:border-primary/40"
        )}
      >
        <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
          {file ? <FileUp className="size-5" /> : <Upload className="size-5" />}
        </span>
        {file ? (
          <>
            <p className="max-w-full truncate text-sm font-medium">{file.name}</p>
            <p className="text-xs text-muted-foreground">{formatFileSize(file.size)} · 눌러서 변경</p>
          </>
        ) : (
          <>
            <p className="text-sm font-medium">파일을 끌어다 놓거나 선택하세요</p>
            <p className="text-xs text-muted-foreground">PDF, JPG, PNG</p>
          </>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,image/jpeg,image/png"
        className="hidden"
        onChange={(e) => {
          pick(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      <div className="space-y-3">
        {!lockProperty && (
          <div className="space-y-1.5">
            <Label htmlFor="doc-property">연결할 매물</Label>
            <NativeSelect id="doc-property" value={propertyId} onChange={(e) => setPropertyId(e.target.value)} options={properties} />
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="doc-type">문서 종류</Label>
          <NativeSelect id="doc-type" value={docType} onChange={(e) => setDocType(e.target.value as DocType)} options={DOC_TYPES} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="doc-issued">발급일</Label>
          <DatePicker id="doc-issued" value={issuedAt} onChange={setIssuedAt} />
        </div>
        <Button className="w-full" onClick={submit} disabled={!file || pending}>
          {pending ? <Loader2 data-icon="inline-start" className="animate-spin" /> : <Upload data-icon="inline-start" />}
          업로드
        </Button>
      </div>
    </div>
  );
}
