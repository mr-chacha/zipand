import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { DealFormDocumentView } from "@/components/deal-forms/form-document-view";
import { DealFormEditor } from "@/components/deal-forms/form-editor";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isAppRequest } from "@/lib/app-mode";
import { getSession } from "@/lib/auth";
import {
  DEAL_FORM_KIND_LABELS,
  DEAL_FORM_STATUS_LABELS,
  asStringRecord,
  type DealFormKind,
  type DealFormStatus,
} from "@/lib/deal-forms";
import { isPast } from "@/lib/format";
import { cn } from "@/lib/utils";
import { PrintButton } from "@/app/b/[token]/print-button";

export const metadata: Metadata = { title: "서식" };

export default async function DealFormDetailPage({
  params,
}: PageProps<"/contracts/[id]/forms/[formId]">) {
  const { id, formId } = await params;
  const [{ supabase }, isApp] = await Promise.all([getSession(), isAppRequest()]);

  const { data: form } = await supabase
    .from("deal_forms")
    .select("id, deal_id, kind, title, status, data, finalized_at")
    .eq("id", formId)
    .eq("deal_id", id)
    .maybeSingle();
  if (!form) notFound();

  // 앱에서는 확정본만 열람·공유
  if (isApp && form.status !== "finalized") {
    redirect(`/contracts/${id}/forms`);
  }

  const [{ data: shares }, { data: deal }] = await Promise.all([
    supabase
      .from("deal_form_shares")
      .select("id, token, expires_at, view_count, created_at")
      .eq("form_id", formId)
      .order("created_at", { ascending: false }),
    supabase.from("deals").select("property:properties(title, address, deal_type)").eq("id", id).maybeSingle(),
  ]);

  const kind = form.kind as DealFormKind;
  const data = asStringRecord(form.data);

  return (
    <div className="space-y-6">
      <PageHeader
        title={form.title}
        description={`${DEAL_FORM_KIND_LABELS[kind]} · ${DEAL_FORM_STATUS_LABELS[form.status as DealFormStatus]}`}
        backHref={`/contracts/${id}/forms`}
        backLabel="서식 목록"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="secondary"
              className={cn(form.status === "finalized" && "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300")}
            >
              {DEAL_FORM_STATUS_LABELS[form.status as DealFormStatus]}
            </Badge>
            <div className="print:hidden">
              <PrintButton autoPrint={false} />
            </div>
          </div>
        }
      />

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-2">
        <Card className="print:hidden">
          <CardHeader>
            <CardTitle>{isApp || form.status === "finalized" ? "공유·관리" : "작성"}</CardTitle>
          </CardHeader>
          <CardContent>
            <DealFormEditor
              formId={form.id}
              dealId={id}
              kind={kind}
              title={form.title}
              status={form.status as "draft" | "finalized"}
              data={data}
              shares={(shares ?? []).map((s) => ({ ...s, expired: isPast(s.expires_at) }))}
              siteUrl={process.env.NEXT_PUBLIC_SITE_URL ?? ""}
            />
          </CardContent>
        </Card>

        <div className="space-y-3">
          <p className="text-sm font-medium print:hidden">미리보기</p>
          <DealFormDocumentView
            kind={kind}
            title={form.title}
            data={data}
            property={deal?.property}
          />
        </div>
      </div>
    </div>
  );
}
