"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Download, Printer, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { ComingSoonButton } from "@/components/coming-soon";
import { DocumentsWriteControls } from "@/components/deal-forms/contract-write-entry";
import type { WriteDealOption } from "@/components/deal-forms/contract-write-dialog";
import { PrivacyConsentWriteButton } from "@/components/deal-forms/privacy-consent-dialog";
import {
  RelatedFormsWriteButton,
  type RelatedFormsOfficeDefaults,
} from "@/components/deal-forms/related-forms-dialog";
import { ConfirmDialog } from "@/components/dialogs";
import { Button, buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { deleteDealForms } from "@/lib/actions/deal-forms";
import { useBusy } from "@/lib/busy";
import { formatDealAmount, formatShortDate, type DealFormKind } from "@/lib/deal-forms";
import { useIsApp } from "@/lib/use-is-app";
import { cn } from "@/lib/utils";

/** 정적 PDF 서식 다운로드 (입력 폼 없음) */
const STATIC_FORM_DOWNLOADS = [
  {
    href: "/forms/housing-fund-plan.pdf",
    filename: "주택자금조달서.pdf",
    label: "주택자금조달서",
  },
  {
    href: "/forms/balance-prep-checklist.pdf",
    filename: "잔금시 준비서류.pdf",
    label: "잔금시 준비서류",
  },
] as const;

function FormDownloadLink({
  href,
  filename,
  label,
}: {
  href: string;
  filename: string;
  label: string;
}) {
  return (
    <a
      href={href}
      download={filename}
      className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
    >
      <Download data-icon="inline-start" />
      {label}
    </a>
  );
}

export type DocumentRow = {
  id: string;
  dealId: string | null;
  kind: DealFormKind;
  title: string;
  status: "draft" | "finalized";
  contractDate: string;
  expiryDate: string;
  interim1: string;
  interim2: string;
  balanceDate: string;
  amount: string;
  monthlyRent: string;
  dealType: string;
  lessorName: string;
  lessorPhone: string;
  lesseeName: string;
  lesseePhone: string;
  memo: string;
  address: string;
  building: string;
  unit: string;
  completed: string;
  senderName: string;
  receiverName: string;
  contractNo: string;
};

type DealOption = WriteDealOption;

const COLS = [
  "계약일",
  "만기일",
  "중도금1",
  "중도금2",
  "잔금일",
  "거래금액(만원)",
  "계약서 제목",
  "거래유형",
  "매도/임대인",
  "매도/임대인 전화",
  "매수/임차인",
  "매수/임차인 전화",
  "메모",
  "소재지",
  "동",
  "호",
  "완료",
  "전송상호",
  "수신상호",
  "계약서번호",
] as const;

function formHref(row: DocumentRow) {
  return row.dealId ? `/contracts/${row.dealId}/forms/${row.id}` : `/contracts/forms/${row.id}`;
}

export function DocumentsTable({
  rows,
  deals,
  office,
  guaranteeCertificate,
}: {
  rows: DocumentRow[];
  deals: DealOption[];
  office: RelatedFormsOfficeDefaults;
  /** 업로드된 공제증서 — 없으면 설정으로 이동 */
  guaranteeCertificate: { url: string; fileName: string } | null;
}) {
  const isApp = useIsApp();
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  useBusy(pending);

  const allIds = useMemo(() => rows.map((r) => r.id), [rows]);
  const allSelected = rows.length > 0 && selected.length === rows.length;

  const toggle = (id: string, on: boolean) => {
    setSelected((prev) => (on ? [...new Set([...prev, id])] : prev.filter((x) => x !== id)));
  };

  const toggleAll = (on: boolean) => setSelected(on ? allIds : []);

  const exportExcel = () => {
    const source = selected.length ? rows.filter((r) => selected.includes(r.id)) : rows;
    if (!source.length) {
      toast.error("내보낼 계약서가 없어요.");
      return;
    }
    const header = [...COLS];
    const lines = [
      header.join(","),
      ...source.map((r) =>
        [
          formatShortDate(r.contractDate),
          formatShortDate(r.expiryDate),
          r.interim1,
          r.interim2,
          formatShortDate(r.balanceDate),
          formatDealAmount(r.amount, r.monthlyRent),
          r.title,
          r.dealType,
          r.lessorName,
          r.lessorPhone,
          r.lesseeName,
          r.lesseePhone,
          r.memo,
          r.address,
          r.building,
          r.unit,
          r.completed,
          r.senderName,
          r.receiverName,
          r.contractNo,
        ]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(",")
      ),
    ];
    const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `계약서목록_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("엑셀(CSV)로 저장했어요.");
  };

  const removeSelected = () =>
    startTransition(async () => {
      const result = await deleteDealForms(selected);
      if (result.error) toast.error(result.error);
      else {
        toast.success(result.message);
        setSelected([]);
        setConfirmOpen(false);
        router.refresh();
      }
    });

  const openSelected = () => {
    if (selected.length !== 1) {
      toast.error("인쇄할 계약서 1건을 선택해 주세요.");
      return;
    }
    const row = rows.find((r) => r.id === selected[0]);
    if (!row) return;
    router.push(formHref(row));
  };

  return (
    <div className="space-y-3">
      {!isApp && (
        <DocumentsWriteControls deals={deals}>
          <RelatedFormsWriteButton office={office} />
          <Button size="sm" variant="outline" disabled={!selected.length || pending} onClick={() => setConfirmOpen(true)}>
            <Trash2 data-icon="inline-start" />
            삭제
          </Button>
          <Button size="sm" variant="outline" onClick={exportExcel}>
            엑셀저장
          </Button>
          <Button size="sm" variant="outline" onClick={openSelected}>
            <Printer data-icon="inline-start" />
            계약서 인쇄
          </Button>
          {guaranteeCertificate ? (
            <a
              href={guaranteeCertificate.url}
              download={guaranteeCertificate.fileName}
              target="_blank"
              rel="noreferrer"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              <Printer data-icon="inline-start" />
              공제증서 인쇄
            </a>
          ) : (
            <Link href="/settings?tab=office" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
              <Upload data-icon="inline-start" />
              공제증서 업로드
            </Link>
          )}
          {STATIC_FORM_DOWNLOADS.map((f) => (
            <FormDownloadLink key={f.href} href={f.href} filename={f.filename} label={f.label} />
          ))}
          <PrivacyConsentWriteButton deals={deals} />
          <ComingSoonButton size="sm">등기열람</ComingSoonButton>
        </DocumentsWriteControls>
      )}

      {isApp && (
        <p className="rounded-lg border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
          앱에서는 확정된 계약서를 열어 공유할 수 있어요. 작성·삭제는 웹에서 해주세요.
        </p>
      )}

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-max min-w-full border-collapse text-xs">
          <thead>
            <tr className="bg-slate-800 text-white">
              {!isApp && (
                <th className="sticky left-0 z-10 bg-slate-800 px-2 py-2.5 text-center font-medium">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={(v) => toggleAll(Boolean(v))}
                    aria-label="전체 선택"
                    className="border-white/70 data-checked:border-white"
                  />
                </th>
              )}
              {COLS.map((col) => (
                <th key={col} className="whitespace-nowrap px-2.5 py-2.5 text-center font-medium">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={COLS.length + (isApp ? 0 : 1)} className="px-4 py-12 text-center text-sm text-muted-foreground">
                  {isApp ? "공유할 확정 계약서가 없어요." : "작성된 계약서가 없어요. 위에서 계약서 작성으로 초안을 만들어 주세요."}
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const href = formHref(row);
                const cells = [
                  formatShortDate(row.contractDate),
                  formatShortDate(row.expiryDate),
                  row.interim1,
                  row.interim2,
                  formatShortDate(row.balanceDate),
                  formatDealAmount(row.amount, row.monthlyRent),
                  row.title,
                  row.dealType,
                  row.lessorName,
                  row.lessorPhone,
                  row.lesseeName,
                  row.lesseePhone,
                  row.memo,
                  row.address,
                  row.building,
                  row.unit,
                  row.completed,
                  row.senderName,
                  row.receiverName,
                  row.contractNo,
                ];
                return (
                  <tr key={row.id} className="border-t hover:bg-muted/40">
                    {!isApp && (
                      <td className="sticky left-0 z-10 bg-card px-2 py-2 text-center">
                        <Checkbox
                          checked={selected.includes(row.id)}
                          onCheckedChange={(v) => toggle(row.id, Boolean(v))}
                          aria-label="선택"
                        />
                      </td>
                    )}
                    {cells.map((value, i) => (
                      <td
                        key={COLS[i]}
                        className={cn(
                          "max-w-48 truncate whitespace-nowrap px-2.5 py-2 text-center tabular-nums",
                          i === 0 && value && "font-medium text-red-600",
                          i === 6 && "max-w-56 text-left"
                        )}
                      >
                        {i === 6 || i === 13 ? (
                          <Link href={href} className="text-primary hover:underline">
                            {value || "—"}
                          </Link>
                        ) : (
                          value || ""
                        )}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground">
        {!isApp && selected.length > 0 ? `선택 ${selected.length}건 · ` : ""}
        전체 {rows.length}건
      </p>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="선택한 서식을 삭제할까요?"
        description="삭제하면 되돌릴 수 없어요. 공유 링크도 함께 삭제돼요."
        confirmLabel="삭제"
        destructive
        pending={pending}
        onConfirm={removeSelected}
      />
    </div>
  );
}
