import type { Metadata } from "next";
import Link from "next/link";
import { FileSearch, ShieldCheck } from "lucide-react";
import { OfficeRequiredNotice } from "@/components/office-gate";
import { PageHeader } from "@/components/page-header";
import { PropertySubnav } from "@/components/property-subnav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSession } from "@/lib/auth";
import { getOfficeGate } from "@/lib/office-gate";
import { getPropertyOptions } from "@/lib/queries";
import { DocumentUploader } from "./document-uploader";
import {
  PropertyDocumentsTable,
  type PropertyDocumentRow,
  type PropertyWithDocuments,
} from "./property-documents-table";

export const metadata: Metadata = { title: "문서 관리" };

export default async function DocumentsPage({ searchParams }: PageProps<"/documents">) {
  const { property, q } = await searchParams;
  const keyword = typeof q === "string" ? q.trim() : "";
  const selectedPropertyId = typeof property === "string" ? property : "";
  const { supabase, office } = await getSession();

  const [{ data: propertyRows }, propertyOptions, gate] = await Promise.all([
    supabase
      .from("properties")
      .select(
        "id, title, address, property_type, deal_type, updated_at, documents(id, doc_type, file_name, status, issued_at, created_at)"
      )
      .order("updated_at", { ascending: false }),
    getPropertyOptions(),
    getOfficeGate(),
  ]);

  let properties: PropertyWithDocuments[] = (propertyRows ?? []).map((p) => {
    const docs = Array.isArray(p.documents) ? p.documents : [];
    return {
      id: p.id,
      title: p.title,
      address: p.address,
      property_type: p.property_type,
      deal_type: p.deal_type,
      documents: docs as PropertyDocumentRow[],
    };
  });

  if (selectedPropertyId) {
    properties = properties.filter((p) => p.id === selectedPropertyId);
  }
  if (keyword) {
    properties = properties.filter((p) =>
      `${p.title} ${p.address} ${p.documents.map((d) => `${d.doc_type} ${d.file_name}`).join(" ")}`.includes(
        keyword
      )
    );
  }

  const totalDocs = properties.reduce((n, p) => n + p.documents.length, 0);
  const selectedTitle = selectedPropertyId
    ? (propertyRows ?? []).find((p) => p.id === selectedPropertyId)?.title
    : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="문서 관리"
        description={
          selectedTitle
            ? `「${selectedTitle}」 서류 · 등기·건축물대장 등을 업로드·검토할 수 있어요.`
            : "등록한 매물별로 등기·건축물대장·지적도 등 보관 서류를 보고, 업로드·검토할 수 있어요. 문서 상세에서 PDF 자동 추출로 면적·구조를 채울 수 있어요."
        }
        backHref={selectedPropertyId ? `/properties/${selectedPropertyId}` : undefined}
        backLabel={selectedPropertyId ? "매물 상세" : undefined}
      />
      {selectedPropertyId ? <PropertySubnav propertyId={selectedPropertyId} active="docs" /> : null}

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>서류 업로드</CardTitle>
            <CardDescription>PDF, JPG, PNG · 최대 20MB · 매물에 연결해 보관</CardDescription>
          </CardHeader>
          <CardContent>
            {gate.blocked.document ? (
              <OfficeRequiredNotice kind="document" isOwner={gate.isOwner} next="/documents" />
            ) : (
              <DocumentUploader
                officeId={office.id}
                properties={propertyOptions.map((p) => ({ value: p.id, label: p.title }))}
                defaultPropertyId={selectedPropertyId || undefined}
              />
            )}
          </CardContent>
        </Card>
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <FileSearch className="size-4 text-primary" />
                PDF 자동 추출
              </CardTitle>
              <CardDescription>
                PDF를 올리면 전용면적·구조·소유자 등을 자동으로 읽어요. 문서 상세에서 값을 검토하면 확인설명서·계약서에 반영됩니다.
                스캔(사진) PDF는 인식이 어려울 수 있어요 — 그때는 「자동 추출」을 다시 누르거나 직접 입력하세요.
              </CardDescription>
            </CardHeader>
          </Card>
          <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-4 shrink-0" />
            업로드한 문서는 비공개 저장소에 보관되고, 같은 사무소 구성원만 열람할 수 있어요. 열람 링크는 1시간 후 만료돼요.
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold">
              매물별 보관 문서
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                매물 {properties.length} · 서류 {totalDocs}건
              </span>
            </h2>
            {selectedTitle ? (
              <p className="mt-1 text-xs text-muted-foreground">
                「{selectedTitle}」만 보는 중 ·{" "}
                <Link href="/documents" className="underline underline-offset-2">
                  전체 매물 보기
                </Link>
              </p>
            ) : (
              <p className="mt-1 text-xs text-muted-foreground">
                칸의 — 는 미등록 · 배지를 누르면 문서 검토로 이동합니다.
              </p>
            )}
          </div>
        </div>

        <PropertyDocumentsTable
          properties={properties}
          emptyHint={
            selectedPropertyId
              ? "해당 매물을 찾을 수 없어요."
              : keyword
                ? "검색 조건에 맞는 매물이 없어요."
                : "등록한 매물이 없어요. 매물을 먼저 등록한 뒤 서류를 올려 주세요."
          }
        />
      </div>
    </div>
  );
}
