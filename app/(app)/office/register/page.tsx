import type { Metadata } from "next";
import { BadgeCheck, ShieldCheck } from "lucide-react";
import { ComingSoonBadge } from "@/components/coming-soon";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSession } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { OfficeLookup } from "./office-lookup";

export const metadata: Metadata = { title: "사무소 등록" };

export default async function OfficeRegisterPage({ searchParams }: PageProps<"/office/register">) {
  const { next } = await searchParams;
  const { profile, office } = await getSession();
  const isOwner = profile.role === "owner";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="사무소 등록"
        description="공공데이터포털의 전국 공인중개사사무소 정보에서 우리 사무소를 찾아 등록해요."
      />

      {office.registered_at && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex items-start gap-3">
            <BadgeCheck className="mt-0.5 size-5 shrink-0 text-primary" />
            <div className="space-y-0.5 text-sm">
              <p className="font-medium">
                {office.name} · {office.registration_no}
              </p>
              <p className="text-muted-foreground">
                {formatDate(office.registered_at)}에 등록했어요. 사무소 정보가 바뀌었다면 다시 조회해 변경할 수 있어요.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>등록된 공인중개사사무소 조회</CardTitle>
          <CardDescription className="flex flex-wrap items-center gap-2">
            <ShieldCheck className="size-4" />
            자격·대표자 인증은 추후 제공될 예정이에요
            <ComingSoonBadge />
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isOwner ? (
            <OfficeLookup next={typeof next === "string" ? next : null} currentRegNo={office.registration_no} />
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">사무소 등록은 대표만 할 수 있어요. 사무소 대표에게 요청해 주세요.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
