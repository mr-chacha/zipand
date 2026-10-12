import Link from "next/link";
import { notFound } from "next/navigation";
import { Compass, FileText, Layers, Lock, Maximize, Mic, Presentation, Upload, Users } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { DocStatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getSession } from "@/lib/auth";
import { formatDate, formatDateTime, formatPrice, toPyeong } from "@/lib/format";
import { getCustomerOptions } from "@/lib/queries";
import { signedUrls } from "@/lib/storage";
import type { VisitField } from "@/types";
import { PhotoManager } from "./photo-manager";
import { LinkedCustomers, PropertyHeaderActions, PropertyStatusSelect } from "./property-actions";

export async function generateMetadata({ params }: PageProps<"/properties/[id]">) {
  const { id } = await params;
  const { supabase } = await getSession();
  const { data } = await supabase.from("properties").select("title").eq("id", id).maybeSingle();
  return { title: data?.title ?? "매물 상세" };
}

export default async function PropertyDetailPage({ params }: PageProps<"/properties/[id]">) {
  const { id } = await params;
  const { supabase, office } = await getSession();

  const { data: property } = await supabase
    .from("properties")
    .select("*, manager:profiles!properties_manager_id_fkey(name)")
    .eq("id", id)
    .maybeSingle();
  if (!property) notFound();

  const [photos, visits, docs, links, events, customerOptions] = await Promise.all([
    supabase.from("property_photos").select("id, storage_path").eq("property_id", id).order("sort_order").order("created_at"),
    supabase.from("property_visits").select("id, visited_at, fields, memo").eq("property_id", id).order("visited_at", { ascending: false }).limit(5),
    supabase.from("documents").select("id, doc_type, file_name, status, created_at").eq("property_id", id).order("created_at", { ascending: false }),
    supabase.from("customer_properties").select("customer:customers(id, name, status, phone)").eq("property_id", id),
    supabase.from("property_events").select("id, message, created_at, actor:profiles(name)").eq("property_id", id).order("created_at", { ascending: false }).limit(30),
    getCustomerOptions(),
  ]);

  const photoRows = photos.data ?? [];
  const urls = await signedUrls(supabase, "property-photos", photoRows.map((p) => p.storage_path));
  const latestVisit = visits.data?.[0];
  const linkedCustomers = (links.data ?? []).map((l) => l.customer).filter((c) => c !== null);

  const specs = [
    { icon: Maximize, label: "전용면적", value: property.area_m2 ? `${property.area_m2}㎡ (${toPyeong(property.area_m2)}평)` : "-" },
    { icon: Layers, label: "층", value: property.floor ? `${property.floor}층${property.total_floors ? ` / ${property.total_floors}층` : ""}` : "-" },
    { icon: Compass, label: "방향", value: property.direction ?? "-" },
    { icon: Users, label: "연결 고객", value: `${linkedCustomers.length}명` },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={property.title}
        description={property.address}
        backHref="/properties"
        backLabel="매물 목록"
        actions={<PropertyHeaderActions propertyId={id} />}
      />

      <div className="flex flex-wrap gap-2">
        <Link href={`/properties/${id}/visit`} className={buttonVariants({ variant: "outline" })}>
          <Mic data-icon="inline-start" />
          임장 기록
        </Link>
        <Link href={`/documents?property=${id}`} className={buttonVariants({ variant: "outline" })}>
          <Upload data-icon="inline-start" />
          서류 업로드
        </Link>
        <Link href={`/properties/${id}/briefing`} className={buttonVariants()}>
          <Presentation data-icon="inline-start" />
          고객 브리핑
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <PhotoManager
            officeId={office.id}
            propertyId={id}
            propertyType={property.property_type}
            photos={photoRows.map((p) => ({ id: p.id, url: urls[p.storage_path] ?? null }))}
          />

          <Tabs defaultValue="info">
            <TabsList className="flex-wrap">
              <TabsTrigger value="info">기본 정보</TabsTrigger>
              <TabsTrigger value="visit">임장 기록 ({visits.data?.length ?? 0})</TabsTrigger>
              <TabsTrigger value="docs">서류 ({docs.data?.length ?? 0})</TabsTrigger>
              <TabsTrigger value="customers">연결 고객 ({linkedCustomers.length})</TabsTrigger>
              <TabsTrigger value="history">변경 이력</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="mt-4">
              <Card>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    {specs.map((spec) => (
                      <div key={spec.label} className="space-y-1">
                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                          <spec.icon className="size-3.5" />
                          {spec.label}
                        </p>
                        <p className="text-sm font-medium">{spec.value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">매물 설명</p>
                    <p className="text-sm whitespace-pre-wrap text-muted-foreground">
                      {property.description || "등록된 설명이 없어요."}
                    </p>
                  </div>
                  {property.highlights.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {property.highlights.map((h) => (
                        <Badge key={h} variant="secondary">
                          {h}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="visit" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>최근 임장 기록</CardTitle>
                  {latestVisit && <CardDescription>{formatDateTime(latestVisit.visited_at)}</CardDescription>}
                  <CardAction>
                    <Link href={`/properties/${id}/visit`} className={buttonVariants({ variant: "outline", size: "sm" })}>
                      {latestVisit ? "임장장 열기" : "임장 기록하기"}
                    </Link>
                  </CardAction>
                </CardHeader>
                <CardContent>
                  {latestVisit ? (
                    <dl className="divide-y">
                      {(latestVisit.fields as unknown as VisitField[]).map((f) => (
                        <div key={f.label} className="flex items-center gap-3 py-2.5 text-sm">
                          <dt className="w-24 shrink-0 text-muted-foreground">{f.label}</dt>
                          <dd className="flex-1">
                            {f.value}
                            {f.note && <span className="ml-2 text-xs text-warning">({f.note})</span>}
                          </dd>
                        </div>
                      ))}
                      {latestVisit.memo && <p className="pt-3 text-sm whitespace-pre-wrap text-muted-foreground">{latestVisit.memo}</p>}
                    </dl>
                  ) : (
                    <p className="py-8 text-center text-sm text-muted-foreground">아직 임장 기록이 없어요.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="docs" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>공부서류</CardTitle>
                  <CardAction>
                    <Link href={`/documents?property=${id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
                      <Upload data-icon="inline-start" />
                      업로드
                    </Link>
                  </CardAction>
                </CardHeader>
                <CardContent className="space-y-2">
                  {(docs.data ?? []).length === 0 && (
                    <p className="py-8 text-center text-sm text-muted-foreground">등록된 서류가 없어요.</p>
                  )}
                  {docs.data?.map((doc) => (
                    <Link
                      key={doc.id}
                      href={`/documents/${doc.id}`}
                      className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50"
                    >
                      <FileText className="size-5 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{doc.doc_type}</p>
                        <p className="truncate text-xs text-muted-foreground">{doc.file_name}</p>
                      </div>
                      <DocStatusBadge status={doc.status} />
                    </Link>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="customers" className="mt-4">
              <Card>
                <CardContent>
                  <LinkedCustomers propertyId={id} linked={linkedCustomers} options={customerOptions} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="mt-4">
              <Card>
                <CardContent>
                  {(events.data ?? []).length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">변경 이력이 없어요.</p>
                  ) : (
                    <ol className="relative ml-1 space-y-4 border-l pl-5">
                      {events.data?.map((e) => (
                        <li key={e.id} className="relative">
                          <span className="absolute top-1.5 -left-[25px] size-2 rounded-full bg-primary" />
                          <p className="text-sm">{e.message}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDateTime(e.created_at)} · {e.actor?.name ?? "알 수 없음"}
                          </p>
                        </li>
                      ))}
                    </ol>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-muted-foreground">
                  {property.property_type} · {property.deal_type}
                </span>
                <PropertyStatusSelect propertyId={id} status={property.status} />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-3xl font-bold text-primary">{formatPrice(property)}</p>
              <dl className="space-y-2 text-sm">
                {[
                  ["관리비", property.maintenance_fee !== null ? `${property.maintenance_fee}만원` : "-"],
                  ["방 / 욕실", `${property.rooms ?? "-"} / ${property.baths ?? "-"}`],
                  ["입주 가능일", formatDate(property.available_from)],
                  ["담당자", property.manager?.name ?? "-"],
                  ["지역", property.region ?? "-"],
                  ["등록일", formatDate(property.created_at)],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="text-right">{value}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>

          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="flex items-center gap-1.5 text-sm">
                <Lock className="size-4" />
                내부 메모
              </CardTitle>
              <CardDescription>고객 브리핑에 노출되지 않아요</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{property.internal_memo || "메모가 없어요."}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
