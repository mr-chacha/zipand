import Link from "next/link";
import { notFound } from "next/navigation";
import { Building2, Compass, FileText, Layers, Lock, Maximize, Phone, Users } from "lucide-react";
import { OfficeRequiredNotice } from "@/components/office-gate";
import { PageHeader } from "@/components/page-header";
import { PropertySubnav } from "@/components/property-subnav";
import { RegistryInquiryButton } from "@/components/deal-forms/registry-inquiry-dialog";
import { DocStatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DocumentUploader } from "@/app/(app)/documents/document-uploader";
import { getSession } from "@/lib/auth";
import {
  formatAvailableFrom,
  formatDate,
  formatMaintenance,
  formatPrice,
  formatPropertyAddress,
  toPyeong,
} from "@/lib/format";
import { getOfficeGate } from "@/lib/office-gate";
import { getCustomerOptions } from "@/lib/queries";
import { signedUrls } from "@/lib/storage";
import { PhotoManager } from "./photo-manager";
import { LinkedCustomers, PropertyHeaderActions, PropertyStatusSelect } from "./property-actions";

export async function generateMetadata({ params }: PageProps<"/properties/[id]">) {
  const { id } = await params;
  const { supabase } = await getSession();
  const { data } = await supabase.from("properties").select("title").eq("id", id).maybeSingle();
  return { title: data?.title ?? "매물 상세" };
}

export default async function PropertyDetailPage({ params, searchParams }: PageProps<"/properties/[id]">) {
  const { id } = await params;
  const { tab } = await searchParams;
  const docsMode = tab === "docs";
  const customersMode = tab === "customers";
  const subnavActive = docsMode ? "docs" : customersMode ? "customers" : "detail";
  const { supabase, office } = await getSession();

  const { data: property } = await supabase
    .from("properties")
    .select("*, manager:profiles!properties_manager_id_fkey(name)")
    .eq("id", id)
    .maybeSingle();
  if (!property) notFound();

  const [photos, videos, docs, links, customerOptions, gate] = await Promise.all([
    supabase.from("property_photos").select("id, storage_path").eq("property_id", id).order("sort_order").order("created_at"),
    supabase
      .from("property_videos")
      .select("id, storage_path, file_name, size_bytes")
      .eq("property_id", id)
      .order("sort_order")
      .order("created_at"),
    supabase.from("documents").select("id, doc_type, file_name, status, created_at").eq("property_id", id).order("created_at", { ascending: false }),
    supabase.from("customer_properties").select("customer:customers(id, name, status, phone)").eq("property_id", id),
    getCustomerOptions(),
    getOfficeGate(),
  ]);

  const photoRows = photos.data ?? [];
  const videoRows = videos.data ?? [];
  const [urls, videoUrls] = await Promise.all([
    signedUrls(supabase, "property-photos", photoRows.map((p) => p.storage_path)),
    signedUrls(supabase, "property-videos", videoRows.map((v) => v.storage_path)),
  ]);
  const linkedCustomers = (links.data ?? []).map((l) => l.customer).filter((c) => c !== null);
  const hasRegistryDocument = (docs.data ?? []).some((doc) => doc.doc_type === "등기사항증명서");

  const dongHo =
    formatPropertyAddress({ address: "", building: property.building, unit: property.unit }) || "-";
  const specs = [
    { icon: Building2, label: "동·호", value: dongHo },
    {
      icon: Layers,
      label: "구조·주용도",
      value:
        [property.structure, property.main_use].filter(Boolean).join(" · ") || "-",
    },
    { icon: Maximize, label: "전용면적", value: property.area_m2 ? `${property.area_m2}㎡ (${toPyeong(property.area_m2)}평)` : "-" },
    { icon: Layers, label: "층", value: property.floor ? `${property.floor}층${property.total_floors ? ` / ${property.total_floors}층` : ""}` : "-" },
    { icon: Compass, label: "방향", value: property.direction ?? "-" },
    { icon: Users, label: "연결 고객", value: `${linkedCustomers.length}명` },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={property.title}
        description={formatPropertyAddress(property)}
        backHref="/properties"
        backLabel="매물 목록"
        actions={<PropertyHeaderActions propertyId={id} />}
      />

      <PropertySubnav propertyId={id} active={subnavActive} />

      {docsMode ? (
        <div className="mx-auto w-full max-w-3xl space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>서류 업로드</CardTitle>
              <CardDescription>PDF, JPG, PNG · 최대 20MB · 이 매물에 바로 연결돼요</CardDescription>
            </CardHeader>
            <CardContent>
              {gate.blocked.document ? (
                <OfficeRequiredNotice kind="document" isOwner={gate.isOwner} next={`/properties/${id}?tab=docs`} />
              ) : (
                <div className="space-y-3">
                  <div className="flex flex-col gap-3 rounded-lg border bg-muted/40 p-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-medium">
                        {hasRegistryDocument ? "최신 등기가 필요하신가요?" : "등기사항증명서가 아직 없어요"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {hasRegistryDocument
                          ? "등기를 재열람하면 기존 문서는 유지되고 새 원문 PDF가 이 매물 서류함에 추가됩니다."
                          : "주소로 등기를 열람하면 원문 PDF가 이 매물 서류함에 자동 저장됩니다."}
                      </p>
                    </div>
                    <RegistryInquiryButton
                      label={hasRegistryDocument ? "등기 재열람" : "등기 열람"}
                      properties={[
                        {
                          value: id,
                          label: [property.title, property.address].filter(Boolean).join(" · "),
                          address: property.address ?? "",
                          building: property.building ?? "",
                          unit: property.unit ?? "",
                        },
                      ]}
                    />
                  </div>
                  <DocumentUploader
                    officeId={office.id}
                    properties={[{ value: id, label: property.title }]}
                    defaultPropertyId={id}
                    lockProperty
                    goToDetail={false}
                  />
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>등록된 공부서류 ({docs.data?.length ?? 0})</CardTitle>
              <CardAction>
                <Link href={`/documents?property=${id}`} className={buttonVariants({ variant: "ghost", size: "sm" })}>
                  문서 관리에서 보기
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
                  href={`/documents/${doc.id}?return=${encodeURIComponent(`/properties/${id}?tab=docs`)}`}
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
        </div>
      ) : customersMode ? (
        <div className="mx-auto w-full max-w-3xl">
          <Card>
            <CardHeader>
              <CardTitle>연결 고객 ({linkedCustomers.length})</CardTitle>
              <CardDescription>이 매물을 소개·관리하는 고객을 연결해요</CardDescription>
            </CardHeader>
            <CardContent>
              <LinkedCustomers
                propertyId={id}
                linked={linkedCustomers}
                options={customerOptions}
                gate={{ blocked: gate.blocked.link, isOwner: gate.isOwner }}
              />
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <PhotoManager
              officeId={office.id}
              propertyId={id}
              propertyType={property.property_type}
              photos={photoRows.map((p) => ({ id: p.id, url: urls[p.storage_path] ?? null }))}
              videos={videoRows.map((v) => ({
                id: v.id,
                url: videoUrls[v.storage_path] ?? null,
                name: v.file_name,
                size: v.size_bytes,
              }))}
            />

            <Card>
              <CardHeader>
                <CardTitle>기본 정보</CardTitle>
              </CardHeader>
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
                    ["관리비", formatMaintenance(property) ?? "-"],
                    ["방 / 욕실", `${property.rooms ?? "-"} / ${property.baths ?? "-"}`],
                    ["입주 가능일", formatAvailableFrom(property)],
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
                  관계자 연락처
                </CardTitle>
                <CardDescription>고객 브리핑에 노출되지 않아요</CardDescription>
              </CardHeader>
              <CardContent>
                <dl className="space-y-2.5 text-sm">
                  {(
                    [
                      ["임대인", property.landlord_phone],
                      ["관리인", property.caretaker_phone],
                      ["세입자", property.tenant_phone],
                    ] as const
                  ).map(([label, phone]) => (
                    <div key={label} className="flex items-center justify-between gap-4">
                      <dt className="shrink-0 text-muted-foreground">{label}</dt>
                      <dd className="min-w-0 text-right">
                        {phone ? (
                          <a href={`tel:${phone}`} className="inline-flex items-center gap-1 text-primary">
                            <Phone className="size-3.5" />
                            {phone}
                          </a>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </dd>
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
      )}
    </div>
  );
}
