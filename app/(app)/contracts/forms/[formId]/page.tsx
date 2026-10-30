import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { PrintButton } from "@/app/b/[token]/print-button";
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

export const metadata: Metadata = { title: "서식" };

/** 거래에 연결되지 않은 수기 서식 상세 */
export default async function StandaloneDealFormPage({
  params,
}: PageProps<"/contracts/forms/[formId]">) {
  const { formId } = await params;
  const [{ supabase }, isApp] = await Promise.all([getSession(), isAppRequest()]);

  const { data: form } = await supabase
    .from("deal_forms")
    .select("id, deal_id, kind, title, status, data, finalized_at")
    .eq("id", formId)
    .is("deal_id", null)
    .maybeSingle();
  if (!form) notFound();

  if (isApp && form.status !== "finalized") {
    redirect("/contracts");
  }

  const { data: shares } = await supabase
    .from("deal_form_shares")
    .select("id, token, expires_at, view_count, created_at")
    .eq("form_id", formId)
    .order("created_at", { ascending: false });

  const kind = form.kind as DealFormKind;
  const data = asStringRecord(form.data);

  return (
    <div className="space-y-6">
      <PageHeader
        title={form.title}
        description={`${DEAL_FORM_KIND_LABELS[kind]} · ${DEAL_FORM_STATUS_LABELS[form.status as DealFormStatus]}`}
        backHref="/contracts"
        backLabel="계약관리"
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

      <div>
        <Card className="print:hidden">
          <CardHeader>
            <CardTitle>{isApp || form.status === "finalized" ? "공유·관리" : "작성"}</CardTitle>
          </CardHeader>
          <CardContent>
            <DealFormEditor
              formId={form.id}
              dealId={null}
              kind={kind}
              title={form.title}
              status={form.status as "draft" | "finalized"}
              data={data}
              shares={(shares ?? []).map((s) => ({ ...s, expired: isPast(s.expires_at) }))}
              siteUrl={process.env.NEXT_PUBLIC_SITE_URL ?? ""}
            />
          </CardContent>
        </Card>

        <div className="hidden print:block">
          <DealFormDocumentView kind={kind} title={form.title} data={data} />
        </div>
      </div>
    </div>
  );
}
