"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, Printer, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ComingSoonButton } from "@/components/coming-soon";
import { DocumentsWriteControls } from "@/components/deal-forms/contract-write-entry";
import type { WriteDealOption } from "@/components/deal-forms/contract-write-dialog";
import { ConfirmDialog } from "@/components/dialogs";
import { NativeSelect } from "@/components/form/native-select";
import { Button, buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { createDealFormForDeal, deleteDealForms } from "@/lib/actions/deal-forms";
import { useBusy } from "@/lib/busy";
import {
  DEAL_FORM_KIND_LABELS,
  DEAL_FORM_KINDS,
  formatDealAmount,
  formatShortDate,
  type DealFormKind,
} from "@/lib/deal-forms";
import { useIsApp } from "@/lib/use-is-app";
import { cn } from "@/lib/utils";

export type DocumentRow = {
  id: string;
  dealId: string;
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

function CreateOtherFormDialog({ deals }: { deals: DealOption[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  useBusy(pending);
  const [dealId, setDealId] = useState(deals[0]?.value ?? "");
  const [kind, setKind] = useState<DealFormKind>("receipt");

  const submit = () => {
    if (!dealId) {
      toast.error("연결할 거래를 선택해 주세요. 먼저 계약 시작으로 거래를 만들어 주세요.");
      return;
    }
    startTransition(async () => {
      const result = await createDealFormForDeal(dealId, { kind });
      if (result.error || !result.id) {
        toast.error(result.error ?? "초안을 만들지 못했어요.");
        return;
      }
      toast.success(result.message);
      setOpen(false);
      router.push(`/contracts/${dealId}/forms/${result.id}`);
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="secondary" size="sm" disabled={deals.length === 0}>
            <FileText data-icon="inline-start" />
            기타서식
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>기타서식</DialogTitle>
          <DialogDescription>영수증 등 기타 서식을 거래에 연결해 작성해요.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="doc-deal">거래</Label>
            {deals.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                등록된 거래가 없어요.{" "}
                <Link href="/contracts/new" className="text-primary underline">
                  계약 시작
                </Link>
                으로 먼저 만들어 주세요.
              </p>
            ) : (
              <NativeSelect id="doc-deal" value={dealId} onChange={(e) => setDealId(e.target.value)} options={deals} />
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="doc-kind">서식 종류</Label>
            <NativeSelect
              id="doc-kind"
              value={kind}
              onChange={(e) => setKind(e.target.value as DealFormKind)}
              options={DEAL_FORM_KINDS.filter((k) => k !== "contract" && k !== "disclosure").map((k) => ({
                value: k,
                label: DEAL_FORM_KIND_LABELS[k],
              }))}
            />
          </div>
          <Button className="w-full" disabled={pending || !deals.length} onClick={submit}>
            초안 만들기
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function DocumentsTable({ rows, deals }: { rows: DocumentRow[]; deals: DealOption[] }) {
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
    router.push(`/contracts/${row.dealId}/forms/${row.id}`);
  };

  return (
    <div className="space-y-3">
      {!isApp && (
        <DocumentsWriteControls deals={deals}>
          <CreateOtherFormDialog deals={deals} />
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
          <ComingSoonButton size="sm">공제증서 인쇄</ComingSoonButton>
          <ComingSoonButton size="sm">자금조달계획서 인쇄</ComingSoonButton>
          <ComingSoonButton size="sm">개인정보활용동의서 인쇄</ComingSoonButton>
          <ComingSoonButton size="sm">중개사무소찾기</ComingSoonButton>
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
                const href = `/contracts/${row.dealId}/forms/${row.id}`;
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

      {!isApp && (
        <div className="flex flex-wrap gap-2">
          <Link href="/contracts" className={buttonVariants({ variant: "outline", size: "sm" })}>
            계약관리로
          </Link>
          <p className="self-center text-xs text-muted-foreground">
            선택 {selected.length}건 · 전체 {rows.length}건
          </p>
        </div>
      )}

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
