import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CheckCircle2, Circle, Trash2 } from "lucide-react";
import { ConfirmAction } from "@/components/form/confirm-action";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { deleteVisit } from "@/lib/actions/visits";
import { getSession } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { signedUrls } from "@/lib/storage";
import type { ChecklistEntry, VisitField } from "@/types";
import { VisitForm } from "./visit-form";

export const metadata: Metadata = { title: "스마트 임장장" };

export default async function VisitPage({ params }: PageProps<"/properties/[id]/visit">) {
  const { id } = await params;
  const { supabase, office } = await getSession();

  const { data: property } = await supabase.from("properties").select("id, title, address").eq("id", id).maybeSingle();
  if (!property) notFound();

  const { data: visits } = await supabase
    .from("property_visits")
    .select("*, author:profiles(name)")
    .eq("property_id", id)
    .order("visited_at", { ascending: false });

  const audioUrls = await signedUrls(
    supabase,
    "visit-audio",
    (visits ?? []).map((v) => v.audio_path).filter((p): p is string => Boolean(p))
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="스마트 임장장"
        description={`${property.title} · ${property.address}`}
        backHref={`/properties/${id}`}
        backLabel="매물 상세"
      />

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <VisitForm officeId={office.id} propertyId={id} />
        </div>

        <div className="space-y-4 lg:col-span-2">
          <h2 className="text-sm font-semibold text-muted-foreground">지난 임장 기록 ({visits?.length ?? 0})</h2>
          {(visits ?? []).length === 0 && (
            <Card className="items-center py-10 text-center text-sm text-muted-foreground">아직 기록이 없어요.</Card>
          )}
          {visits?.map((v) => {
            const fields = v.fields as unknown as VisitField[];
            const checklist = v.checklist as unknown as ChecklistEntry[];
            return (
              <Card key={v.id} size="sm">
                <CardHeader>
                  <CardTitle className="text-sm">{formatDateTime(v.visited_at)}</CardTitle>
                  <CardDescription>{v.author?.name}</CardDescription>
                  <CardAction>
                    <ConfirmAction
                      action={deleteVisit.bind(null, v.id, id)}
                      title="임장 기록을 삭제할까요?"
                      successMessage="삭제했어요."
                      trigger={
                        <Button size="icon-sm" variant="ghost" aria-label="삭제">
                          <Trash2 />
                        </Button>
                      }
                    />
                  </CardAction>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {fields.length > 0 && (
                    <dl className="space-y-1.5">
                      {fields.map((f) => (
                        <div key={f.label} className="flex gap-2">
                          <dt className="w-20 shrink-0 text-muted-foreground">{f.label}</dt>
                          <dd>
                            {f.value}
                            {f.note && <span className="ml-1 text-xs text-warning">({f.note})</span>}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  )}
                  {checklist.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {checklist.map((c) => (
                        <Badge key={c.label} variant="outline" className={c.checked ? "text-success" : "text-muted-foreground"}>
                          {c.checked ? <CheckCircle2 data-icon="inline-start" /> : <Circle data-icon="inline-start" />}
                          {c.label}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {v.follow_ups.length > 0 && (
                    <ul className="list-disc space-y-0.5 pl-5 text-muted-foreground">
                      {v.follow_ups.map((f) => (
                        <li key={f}>{f}</li>
                      ))}
                    </ul>
                  )}
                  {v.memo && <p className="whitespace-pre-wrap text-muted-foreground">{v.memo}</p>}
                  {v.audio_path && audioUrls[v.audio_path] && (
                    <audio controls preload="none" src={audioUrls[v.audio_path]} className="h-9 w-full" />
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
