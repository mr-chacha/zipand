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
import { DocumentIssueLinks } from "./document-issue-links";
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
        "id, title, address, property_type, deal_type, updated_at, documents(id, doc_type, file_name, status, extraction_status, extraction_error, issued_at, created_at)"
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
            : "등록한 매물별 보관 서류와 AI 추출·검토 상태를 확인할 수 있어요."
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
          <DocumentIssueLinks />
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <FileSearch className="size-4 text-primary" />
                AI 추출 안내
              </CardTitle>
              <CardDescription>
                매물 목록에서 매물의 「서류」 탭을 열고 분석할 문서를 선택해 AI 추출을 해서 계약서 작성시간을 줄일 수 있어요.
              </CardDescription>
            </CardHeader>
          </Card>
         
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold">
              매물별 보관 문서
             
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
