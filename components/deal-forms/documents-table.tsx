"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Download, Printer, RotateCcw, Search, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { DocumentsWriteControls } from "@/components/deal-forms/contract-write-entry";
import type {
  WriteDealOption,
  WritePropertyOption,
} from "@/components/deal-forms/contract-write-dialog";
import { openContractWriteWindow } from "@/lib/open-contract-write";
import { PrivacyConsentWriteButton } from "@/components/deal-forms/privacy-consent-dialog";
import {
  RegistryInquiryButton,
  type RegistryPropertyOption,
} from "@/components/deal-forms/registry-inquiry-dialog";
import {
  RelatedFormsWriteButton,
  type RelatedFormsOfficeDefaults,
} from "@/components/deal-forms/related-forms-dialog";
import { ConfirmDialog } from "@/components/dialogs";
import { DatePicker } from "@/components/form/date-picker";
import { NativeSelect } from "@/components/form/native-select";
import { Button, buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deleteDealForms } from "@/lib/actions/deal-forms";
import { useBusy } from "@/lib/busy";
import { CONTRACT_DEAL_TYPES, CONTRACT_PROPERTY_TYPES } from "@/lib/contract-templates";
import {
  DEAL_FORM_KIND_LABELS,
  formatDealAmount,
  formatShortDate,
  type DealFormKind,
} from "@/lib/deal-forms";
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
  /** 목록 세트 정렬용 */
  createdAt: string;
  /** 계약서 작성 창에서 다시 열 때 사용 */
  data: Record<string, string>;
  contractDate: string;
  expiryDate: string;
  interim1: string;
  interim2: string;
  balanceDate: string;
  amount: string;
  monthlyRent: string;
  dealType: string;
  propertyType: string;
  /** 연결 매물 표시명 */
  linkedProperty: string;
  /** 연결 매물 ID — 있으면 매물관리로 이동 */
  linkedPropertyId: string | null;
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
  "연결매물",
] as const;

type DateField = "all" | "contractDate" | "expiryDate" | "balanceDate";
type SearchField =
  | "all"
  | "title"
  | "address"
  | "lessorName"
  | "lesseeName"
  | "contractNo"
  | "memo"
  | "phone";

type Filters = {
  dateField: DateField;
  dateFrom: string;
  dateTo: string;
  searchField: SearchField;
  keyword: string;
  kind: string;
  dealType: string;
  propertyType: string;
  completed: string;
};

const EMPTY_FILTERS: Filters = {
  dateField: "all",
  dateFrom: "",
  dateTo: "",
  searchField: "all",
  keyword: "",
  kind: "",
  dealType: "",
  propertyType: "",
  completed: "",
};

const DATE_FIELD_OPTIONS = [
  { value: "all", label: "전체" },
  { value: "contractDate", label: "계약일" },
  { value: "expiryDate", label: "만기일" },
  { value: "balanceDate", label: "잔금일" },
] as const;

const SEARCH_FIELD_OPTIONS = [
  { value: "all", label: "전체" },
  { value: "title", label: "계약서 제목" },
  { value: "address", label: "소재지" },
  { value: "lessorName", label: "매도/임대인" },
  { value: "lesseeName", label: "매수/임차인" },
  { value: "phone", label: "전화번호" },
  { value: "contractNo", label: "계약서번호" },
  { value: "memo", label: "메모" },
] as const;

function formHref(row: DocumentRow) {
  return row.dealId ? `/contracts/${row.dealId}/forms/${row.id}` : `/contracts/forms/${row.id}`;
}

/** YYYY-MM-DD / YY-MM-DD → 비교용 숫자(YYYYMMDD), 없으면 null */
function dateKey(value: string | null | undefined): number | null {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (digits.length === 8) return Number(digits);
  if (digits.length === 6) {
    const yy = Number(digits.slice(0, 2));
    const century = yy <= 30 ? 2000 : 1900;
    return Number(`${century + yy}${digits.slice(2)}`);
  }
  return null;
}

function inDateRange(value: string, from: string, to: string) {
  const key = dateKey(value);
  if (key == null) return false;
  const fromKey = from ? dateKey(from) : null;
  const toKey = to ? dateKey(to) : null;
  if (fromKey != null && key < fromKey) return false;
  if (toKey != null && key > toKey) return false;
  return true;
}

function matchKeyword(row: DocumentRow, field: SearchField, keyword: string) {
  const q = keyword.trim().toLowerCase();
  if (!q) return true;
  const haystacks: string[] =
    field === "title"
      ? [row.title]
      : field === "address"
        ? [row.address]
        : field === "lessorName"
          ? [row.lessorName]
          : field === "lesseeName"
            ? [row.lesseeName]
            : field === "contractNo"
              ? [row.contractNo]
              : field === "memo"
                ? [row.memo]
                : field === "phone"
                  ? [row.lessorPhone, row.lesseePhone]
                  : [
                      row.title,
                      row.linkedProperty,
                      row.address,
                      row.lessorName,
                      row.lesseeName,
                      row.lessorPhone,
                      row.lesseePhone,
                      row.contractNo,
                      row.memo,
                      row.building,
                      row.unit,
                    ];
  return haystacks.some((v) => v.toLowerCase().includes(q));
}

function filterRows(rows: DocumentRow[], f: Filters) {
  return rows.filter((row) => {
    if (f.kind && row.kind !== f.kind) return false;
    if (f.dealType && row.dealType !== f.dealType) return false;
    if (f.propertyType && row.propertyType !== f.propertyType) return false;
    if (f.completed === "done" && !row.completed) return false;
    if (f.completed === "pending" && row.completed) return false;

    if (f.dateFrom || f.dateTo) {
      const fields: (keyof DocumentRow)[] =
        f.dateField === "contractDate"
          ? ["contractDate"]
          : f.dateField === "expiryDate"
            ? ["expiryDate"]
            : f.dateField === "balanceDate"
              ? ["balanceDate"]
              : ["contractDate", "expiryDate", "balanceDate"];
      const hit = fields.some((key) => inDateRange(String(row[key] ?? ""), f.dateFrom, f.dateTo));
      if (!hit) return false;
    }

    if (!matchKeyword(row, f.searchField, f.keyword)) return false;
    return true;
  });
}

export function DocumentsTable({
  rows,
  deals,
  office,
  guaranteeCertificate,
  properties = [],
  writeProperties = [],
}: {
  rows: DocumentRow[];
  deals: DealOption[];
  office: RelatedFormsOfficeDefaults;
  /** 업로드된 공제증서 — 없으면 설정으로 이동 */
  guaranteeCertificate: { url: string; fileName: string } | null;
  /** 공부서류 발급 안내·업로드용 매물 목록 */
  properties?: RegistryPropertyOption[];
  /** 계약서 작성 「연결 매물」 */
  writeProperties?: WritePropertyOption[];
}) {
  const isApp = useIsApp();
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [draft, setDraft] = useState<Filters>(EMPTY_FILTERS);
  const [applied, setApplied] = useState<Filters>(EMPTY_FILTERS);
  useBusy(pending);

  const openContractRow = (row: DocumentRow) => {
    if (row.kind !== "contract") {
      router.push(formHref(row));
      return;
    }
    openContractWriteWindow(row.id);
  };

  const filtered = useMemo(() => filterRows(rows, applied), [rows, applied]);
  const allIds = useMemo(() => filtered.map((r) => r.id), [filtered]);
  const allSelected = filtered.length > 0 && selected.length === filtered.length && filtered.every((r) => selected.includes(r.id));

  const patchDraft = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const runSearch = () => {
    const next = { ...draft };
    setApplied(next);
    const nextIds = new Set(filterRows(rows, next).map((r) => r.id));
    setSelected((prev) => prev.filter((id) => nextIds.has(id)));
  };

  const resetFilters = () => {
    setDraft(EMPTY_FILTERS);
    setApplied(EMPTY_FILTERS);
    setSelected([]);
  };

  const toggle = (id: string, on: boolean) => {
    setSelected((prev) => (on ? [...new Set([...prev, id])] : prev.filter((x) => x !== id)));
  };

  const toggleAll = (on: boolean) => setSelected(on ? allIds : []);

  const exportExcel = () => {
    const source = selected.length ? filtered.filter((r) => selected.includes(r.id)) : filtered;
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
          r.linkedProperty,
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
    const row = filtered.find((r) => r.id === selected[0]) ?? rows.find((r) => r.id === selected[0]);
    if (!row) return;
    router.push(formHref(row));
  };

  return (
    <div className="space-y-3">
      <section className="space-y-3 rounded-lg border bg-card p-3 sm:p-4">
        <div className="flex flex-wrap items-end gap-x-3 gap-y-2">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">날짜조회</Label>
            <div className="flex flex-wrap items-center gap-1.5">
              <NativeSelect
                value={draft.dateField}
                onChange={(e) => patchDraft("dateField", e.target.value as DateField)}
                options={[...DATE_FIELD_OPTIONS]}
                className="w-28"
              />
              <DatePicker
                value={draft.dateFrom}
                onChange={(v) => patchDraft("dateFrom", v)}
                className="w-36"
                aria-label="시작일"
              />
              <span className="text-muted-foreground">~</span>
              <DatePicker
                value={draft.dateTo}
                onChange={(v) => patchDraft("dateTo", v)}
                className="w-36"
                aria-label="종료일"
              />
            </div>
          </div>

          <div className="min-w-[16rem] flex-1 space-y-1">
            <Label className="text-xs text-muted-foreground">조회조건</Label>
            <div className="flex flex-wrap items-center gap-1.5">
              <NativeSelect
                value={draft.searchField}
                onChange={(e) => patchDraft("searchField", e.target.value as SearchField)}
                options={[...SEARCH_FIELD_OPTIONS]}
                className="w-32"
              />
              <Input
                value={draft.keyword}
                onChange={(e) => patchDraft("keyword", e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    runSearch();
                  }
                }}
                placeholder="검색어 입력"
                className="h-8 min-w-[10rem] flex-1"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-x-3 gap-y-2">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">서식종류</Label>
            <NativeSelect
              value={draft.kind}
              onChange={(e) => patchDraft("kind", e.target.value)}
              options={[
                { value: "", label: "전체" },
                { value: "contract", label: DEAL_FORM_KIND_LABELS.contract },
              ]}
              className="w-32"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">부동산 종류</Label>
            <NativeSelect
              value={draft.propertyType}
              onChange={(e) => patchDraft("propertyType", e.target.value)}
              options={[{ value: "", label: "전체" }, ...CONTRACT_PROPERTY_TYPES.map((v) => ({ value: v, label: v }))]}
              className="w-28"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">거래유형</Label>
            <NativeSelect
              value={draft.dealType}
              onChange={(e) => patchDraft("dealType", e.target.value)}
              options={[{ value: "", label: "전체" }, ...CONTRACT_DEAL_TYPES.map((v) => ({ value: v, label: v }))]}
              className="w-28"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">완료여부</Label>
            <NativeSelect
              value={draft.completed}
              onChange={(e) => patchDraft("completed", e.target.value)}
              options={[
                { value: "", label: "전체" },
                { value: "done", label: "완료" },
                { value: "pending", label: "미완료" },
              ]}
              className="w-28"
            />
          </div>
          <div className="ml-auto flex flex-wrap gap-2">
            <Button type="button" size="sm" onClick={runSearch}>
              <Search data-icon="inline-start" />
              검색하기
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={resetFilters}>
              <RotateCcw data-icon="inline-start" />
              검색조건 초기화
            </Button>
          </div>
        </div>
      </section>

      {!isApp && (
        <DocumentsWriteControls
          trailing={
            <Button
              type="button"
              size="sm"
              variant="destructive"
              className="bg-destructive text-white hover:bg-destructive/90"
              disabled={!selected.length || pending}
              onClick={() => setConfirmOpen(true)}
            >
              <Trash2 data-icon="inline-start" />
              삭제
            </Button>
          }
        >
          <RelatedFormsWriteButton office={office} />
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
          <RegistryInquiryButton properties={properties} allowUnlinked />
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
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={COLS.length + (isApp ? 0 : 1)}
                  className="px-4 py-12 text-center text-sm text-muted-foreground"
                >
                  {rows.length === 0
                    ? isApp
                      ? "공유할 확정 계약서가 없어요."
                      : "작성된 계약서가 없어요. 위에서 계약서 작성으로 초안을 만들어 주세요."
                    : "검색 조건에 맞는 계약서가 없어요. 조건을 바꿔 다시 검색해 주세요."}
                </td>
              </tr>
            ) : (
              filtered.map((row) => {
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
                  row.linkedProperty,
                ];
                const linkedCol = COLS.length - 1;
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
                          (i === 6 || i === linkedCol) && "max-w-56 text-left"
                        )}
                      >
                        {i === linkedCol && row.linkedPropertyId && value ? (
                          <Link
                            href={`/properties/${row.linkedPropertyId}`}
                            className="text-primary hover:underline"
                          >
                            {value}
                          </Link>
                        ) : i === 6 || i === 13 ? (
                          row.kind === "contract" ? (
                            <button
                              type="button"
                              className="cursor-pointer text-left text-primary hover:underline"
                              onClick={() => openContractRow(row)}
                            >
                              {value || "—"}
                            </button>
                          ) : (
                            <Link href={href} className="text-primary hover:underline">
                              {value || "—"}
                            </Link>
                          )
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
        검색결과 {filtered.length}건
        {filtered.length !== rows.length ? ` · 전체 ${rows.length}건` : ""}
      </p>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="선택한 계약을 삭제할까요?"
        description="삭제하면 되돌릴 수 없습니다."
        confirmLabel="삭제"
        destructive
        pending={pending}
        onConfirm={removeSelected}
      />
    </div>
  );
}
