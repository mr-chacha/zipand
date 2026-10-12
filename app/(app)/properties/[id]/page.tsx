import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Compass,
  FileSearch,
  FileText,
  Layers,
  Lock,
  Maximize,
  Mic,
  Presentation,
  Upload,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { PropertyThumbnail } from "@/components/property-thumbnail";
import { AnalysisStatusBadge, PropertyStatusBadge, SourceBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getDocumentsByProperty } from "@/lib/mock/documents";
import { getProperty, getVisitByProperty, properties } from "@/lib/mock/properties";
import { formatPrice, toPyeong } from "@/lib/format";

export function generateStaticParams() {
  return properties.map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: PageProps<"/properties/[id]">) {
  const { id } = await params;
  return { title: getProperty(id)?.title ?? "매물 상세" };
}

const history = [
  { date: "2026-10-10 10:14", text: "건축물대장 분석 완료" },
  { date: "2026-10-10 10:12", text: "등기사항증명서 업로드" },
  { date: "2026-10-09 15:32", text: "임장 기록 저장 (AI 정리 6항목, 수정 1항목)" },
  { date: "2026-10-08 11:00", text: "매물 등록" },
];

export default async function PropertyDetailPage({ params }: PageProps<"/properties/[id]">) {
  const { id } = await params;
  const property = getProperty(id);
  if (!property) notFound();

  const visit = getVisitByProperty(id);
  const docs = getDocumentsByProperty(id);

  const specs = [
    { icon: Maximize, label: "전용면적", value: `${property.areaM2}㎡ (${toPyeong(property.areaM2)}평)` },
    { icon: Layers, label: "층", value: `${property.floor}층 / ${property.totalFloors}층` },
    { icon: Compass, label: "방향", value: property.direction },
    { icon: Users, label: "연결 고객", value: `${property.linkedCustomers}명` },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={property.title}
        description={property.address}
        backHref="/properties"
        backLabel="매물 목록"
        actions={
          <>
            <Link href={`/properties/${id}/visit`} className={buttonVariants({ variant: "outline" })}>
              <Mic data-icon="inline-start" />
              임장 기록
            </Link>
            <Link href="/documents" className={buttonVariants({ variant: "outline" })}>
              <FileSearch data-icon="inline-start" />
              문서 분석
            </Link>
            <Link href={`/properties/${id}/briefing`} className={buttonVariants()}>
              <Presentation data-icon="inline-start" />
              고객 브리핑
            </Link>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="grid grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-xl">
            <PropertyThumbnail type={property.propertyType} className="col-span-2 row-span-2 aspect-square sm:aspect-auto" />
            {Array.from({ length: 4 }).map((_, i) => (
              <PropertyThumbnail key={i} type={property.propertyType} className="aspect-square opacity-70" />
            ))}
          </div>

          <Tabs defaultValue="info">
            <TabsList>
              <TabsTrigger value="info">기본 정보</TabsTrigger>
              <TabsTrigger value="visit">임장 기록</TabsTrigger>
              <TabsTrigger value="docs">문서 ({docs.length})</TabsTrigger>
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
                    <p className="text-sm text-muted-foreground">{property.description}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {property.highlights.map((h) => (
                      <Badge key={h} variant="secondary">
                        {h}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="visit" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>최근 임장 기록</CardTitle>
                  {visit && <CardDescription>{visit.visitedAt} · 사진 {visit.photoCount}장</CardDescription>}
                  <CardAction>
                    <Link href={`/properties/${id}/visit`} className={buttonVariants({ variant: "outline", size: "sm" })}>
                      {visit ? "임장장 열기" : "임장 시작"}
                    </Link>
                  </CardAction>
                </CardHeader>
                <CardContent>
                  {visit ? (
                    <dl className="divide-y">
                      {visit.fields.map((f) => (
                        <div key={f.label} className="flex items-center gap-3 py-2.5 text-sm">
                          <dt className="w-24 shrink-0 text-muted-foreground">{f.label}</dt>
                          <dd className="flex-1">
                            {f.value}
                            {f.note && <span className="ml-2 text-xs text-warning">({f.note})</span>}
                          </dd>
                          <SourceBadge source={f.source} />
                        </div>
                      ))}
                    </dl>
                  ) : (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      아직 임장 기록이 없어요.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="docs" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>공부서류</CardTitle>
                  <CardAction>
                    <Link href="/documents" className={buttonVariants({ variant: "outline", size: "sm" })}>
                      <Upload data-icon="inline-start" />
                      업로드
                    </Link>
                  </CardAction>
                </CardHeader>
                <CardContent className="space-y-2">
                  {docs.length === 0 && (
                    <p className="py-8 text-center text-sm text-muted-foreground">등록된 서류가 없어요.</p>
                  )}
                  {docs.map((doc) => (
                    <Link
                      key={doc.id}
                      href={`/documents/${doc.id}`}
                      className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50"
                    >
                      <FileText className="size-5 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{doc.type}</p>
                        <p className="truncate text-xs text-muted-foreground">{doc.fileName}</p>
                      </div>
                      <AnalysisStatusBadge status={doc.status} />
                    </Link>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="mt-4">
              <Card>
                <CardContent>
                  <ol className="relative space-y-4 border-l pl-5">
                    {history.map((h) => (
                      <li key={h.date} className="relative">
                        <span className="absolute top-1.5 -left-[25px] size-2 rounded-full bg-primary" />
                        <p className="text-sm">{h.text}</p>
                        <p className="text-xs text-muted-foreground">{h.date}</p>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <PropertyStatusBadge status={property.status} />
                <span className="text-sm text-muted-foreground">
                  {property.propertyType} · {property.dealType}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-3xl font-bold text-primary">{formatPrice(property)}</p>
              <dl className="space-y-2 text-sm">
                {property.maintenanceFee !== undefined && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">관리비</dt>
                    <dd>{property.maintenanceFee}만원</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">방 / 욕실</dt>
                  <dd>
                    {property.rooms} / {property.baths}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">입주 가능일</dt>
                  <dd>{property.availableFrom}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">담당자</dt>
                  <dd>{property.manager}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">등록일</dt>
                  <dd>{property.registeredAt}</dd>
                </div>
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
              <p className="text-sm">{property.internalMemo}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
