import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FileText } from "lucide-react";
import { CreateDealFormButton } from "@/components/deal-forms/create-form-button";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { isAppRequest } from "@/lib/app-mode";
import { getSession } from "@/lib/auth";
import {
  DEAL_FORM_KIND_LABELS,
  DEAL_FORM_STATUS_LABELS,
  type DealFormKind,
  type DealFormStatus,
} from "@/lib/deal-forms";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "거래 서식" };

export default async function DealFormsPage({ params }: PageProps<"/contracts/[id]/forms">) {
  const { id } = await params;
  const [{ supabase }, isApp] = await Promise.all([getSession(), isAppRequest()]);

  const { data: deal } = await supabase
    .from("deals")
    .select("id, property:properties(title)")
    .eq("id", id)
    .maybeSingle();
  if (!deal) notFound();

  const { data: forms } = await supabase
    .from("deal_forms")
    .select("id, kind, title, status, updated_at, finalized_at")
    .eq("deal_id", id)
    .order("created_at", { ascending: false });

  const list = forms ?? [];
  const visible = isApp ? list.filter((f) => f.status === "finalized") : list;

  return (
    <div className="space-y-6">
      <PageHeader
        title="거래 서식"
        description={
          isApp
            ? "확정된 계약서·확인설명서·영수증을 임대인·임차인에게 공유해요. 작성은 웹에서 해주세요."
            : "계약서·확인설명서·영수증 등을 작성하고 확정한 뒤 공유할 수 있어요."
        }
        backHref={`/contracts/${id}`}
        backLabel={deal.property?.title ?? "거래"}
        actions={<CreateDealFormButton dealId={id} />}
      />

      {isApp && (
        <p className="rounded-lg border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
          앱에서는 확정된 서식만 보고 공유할 수 있어요. 새 서식 작성은 PC·웹 브라우저에서 진행해 주세요.
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="size-4" />
            서식 목록
          </CardTitle>
          <CardDescription>{visible.length}건</CardDescription>
        </CardHeader>
        <CardContent>
          {visible.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {isApp ? "공유할 확정 서식이 아직 없어요." : "작성한 서식이 없어요. 위에서 초안을 만들어 주세요."}
            </p>
          ) : (
            <ul className="space-y-2">
              {visible.map((form) => (
                <li key={form.id}>
                  <Link
                    href={`/contracts/${id}/forms/${form.id}`}
                    className="flex items-start justify-between gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="text-[10px]">
                          {DEAL_FORM_KIND_LABELS[form.kind as DealFormKind]}
                        </Badge>
                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-[10px]",
                            form.status === "finalized" && "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                          )}
                        >
                          {DEAL_FORM_STATUS_LABELS[form.status as DealFormStatus]}
                        </Badge>
                      </div>
                      <p className="truncate font-medium">{form.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {form.status === "finalized" && form.finalized_at
                          ? `확정 ${formatDateTime(form.finalized_at)}`
                          : `수정 ${formatDateTime(form.updated_at)}`}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
