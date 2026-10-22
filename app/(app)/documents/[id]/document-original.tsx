"use client";

import { useState } from "react";
import Link from "next/link";
import { Download, Expand, ExternalLink, Loader2, Printer } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDateTime, formatFileSize } from "@/lib/format";

type Props = {
  fileUrl: string | null;
  fileName: string;
  isPdf: boolean;
  fileSize: number | null;
  property: { id: string; title: string } | null;
  createdAt: string;
  uploaderName: string | null;
  reviewedAt: string | null;
  reviewerName: string | null;
};

export function DocumentOriginal({
  fileUrl,
  fileName,
  isPdf,
  fileSize,
  property,
  createdAt,
  uploaderName,
  reviewedAt,
  reviewerName,
}: Props) {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [busy, setBusy] = useState<"download" | "print" | null>(null);

  const download = async () => {
    if (!fileUrl) return;
    setBusy("download");
    try {
      const res = await fetch(fileUrl);
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        if (/InvalidJWT|exp/.test(body)) {
          throw new Error("파일 링크가 만료됐어요. 페이지를 새로고침해 주세요.");
        }
        throw new Error("파일을 받지 못했어요.");
      }
      const blob = await res.blob();
      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      a.download = fileName || "document.pdf";
      a.click();
      URL.revokeObjectURL(href);
      toast.success("다운로드를 시작했어요.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "다운로드에 실패했어요.");
    } finally {
      setBusy(null);
    }
  };

  const print = () => {
    if (!fileUrl) return;
    setBusy("print");
    try {
      const w = window.open(fileUrl, "_blank", "noopener,noreferrer");
      if (!w) {
        toast.error("팝업이 막혀 있어요. 브라우저에서 허용해 주세요.");
        return;
      }
      // PDF는 load 이벤트가 안 오는 경우가 많아 잠시 후 인쇄 시도
      window.setTimeout(() => {
        try {
          w.focus();
          w.print();
        } catch {
          toast.message("새 창에서 인쇄(⌘/Ctrl+P)를 눌러 주세요.");
        } finally {
          setBusy(null);
        }
      }, 800);
    } catch {
      toast.error("인쇄 창을 열지 못했어요.");
      setBusy(null);
    }
  };

  return (
    <>
      <Card className="flex h-full min-h-0 flex-col overflow-hidden xl:sticky xl:top-4 xl:max-h-[calc(100vh-5.5rem)]">
        <CardHeader className="flex-row flex-wrap items-center justify-between gap-2 space-y-0 pb-3">
          <CardTitle>원문</CardTitle>
          <div className="flex flex-wrap items-center gap-1.5">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={!fileUrl || busy !== null}
              onClick={() => void download()}
            >
              {busy === "download" ? (
                <Loader2 data-icon="inline-start" className="animate-spin" />
              ) : (
                <Download data-icon="inline-start" />
              )}
              다운로드
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={!fileUrl || busy !== null}
              onClick={print}
            >
              {busy === "print" ? (
                <Loader2 data-icon="inline-start" className="animate-spin" />
              ) : (
                <Printer data-icon="inline-start" />
              )}
              인쇄
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={!fileUrl}
              onClick={() => setViewerOpen(true)}
            >
              <Expand data-icon="inline-start" />
              크게 보기
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex min-h-0 flex-1 flex-col gap-3">
          {!fileUrl ? (
            <p className="flex flex-1 items-center justify-center py-16 text-sm text-muted-foreground">
              파일을 불러오지 못했어요.
            </p>
          ) : (
            <div className="group relative min-h-[28rem] flex-1 overflow-hidden rounded-lg border bg-muted/30 xl:min-h-0">
              {isPdf ? (
                <iframe
                  src={`${fileUrl}#view=FitH`}
                  title={fileName}
                  className="absolute inset-0 h-full w-full"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={fileUrl} alt={fileName} className="mx-auto h-full max-h-full w-full object-contain" />
              )}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-background/95 via-background/70 to-transparent px-3 pb-2.5 pt-8">
                <span className="text-xs text-muted-foreground">미리보기 · 크게 보기에서 자세히 확인</span>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="pointer-events-auto shadow-sm"
                  onClick={() => setViewerOpen(true)}
                >
                  <Expand data-icon="inline-start" />
                  크게 보기
                </Button>
              </div>
            </div>
          )}

          <dl className="grid shrink-0 grid-cols-2 gap-2 text-xs text-muted-foreground">
            <div>
              <dt>매물</dt>
              <dd className="text-foreground">
                {property ? (
                  <Link href={`/properties/${property.id}`} className="hover:underline">
                    {property.title}
                  </Link>
                ) : (
                  "-"
                )}
              </dd>
            </div>
            <div>
              <dt>파일 크기</dt>
              <dd className="text-foreground">{formatFileSize(fileSize)}</dd>
            </div>
            <div>
              <dt>업로드</dt>
              <dd className="text-foreground">
                {formatDateTime(createdAt)}
                {uploaderName ? ` · ${uploaderName}` : ""}
              </dd>
            </div>
            <div>
              <dt>검토</dt>
              <dd className="text-foreground">
                {reviewedAt ? `${formatDateTime(reviewedAt)}${reviewerName ? ` · ${reviewerName}` : ""}` : "-"}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Dialog open={viewerOpen} onOpenChange={setViewerOpen}>
        <DialogContent
          className="flex h-[min(92vh,920px)] w-[min(96vw,1100px)] max-w-none flex-col gap-3 p-3 sm:max-w-none"
          showCloseButton
        >
          <DialogHeader className="shrink-0 space-y-1 pr-8 text-left">
            <DialogTitle className="truncate text-base">{fileName}</DialogTitle>
            <DialogDescription className="flex flex-wrap items-center gap-2">
              원문을 크게 보며 오른쪽 추출 항목과 대조하세요.
              {fileUrl && (
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  새 탭에서 열기
                  <ExternalLink className="size-3" />
                </a>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button type="button" size="sm" variant="outline" disabled={!fileUrl || busy !== null} onClick={() => void download()}>
              <Download data-icon="inline-start" />
              다운로드
            </Button>
            <Button type="button" size="sm" variant="outline" disabled={!fileUrl || busy !== null} onClick={print}>
              <Printer data-icon="inline-start" />
              인쇄
            </Button>
          </div>
          <div className="min-h-0 flex-1 overflow-hidden rounded-lg border bg-muted/20">
            {fileUrl &&
              (isPdf ? (
                <iframe src={`${fileUrl}#view=FitH`} title={fileName} className="h-full w-full" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={fileUrl} alt={fileName} className="mx-auto h-full max-h-full object-contain" />
              ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
