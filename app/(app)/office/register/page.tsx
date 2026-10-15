import type { Metadata } from "next";
import { BadgeCheck, ShieldCheck } from "lucide-react";
import { ComingSoonBadge } from "@/components/coming-soon";
import { OfficeUnregisterButton } from "@/components/office-unregister-button";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSession } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { OfficeLookup } from "./office-lookup";

export const metadata: Metadata = { title: "사무소 등록" };

export default async function OfficeRegisterPage({ searchParams }: PageProps<"/office/register">) {
  const { next } = await searchParams;
  const { supabase, profile, office } = await getSession();
  const isOwner = profile.role === "owner";
  const { data: request } =
    isOwner && !office.registered_at
      ? await supabase
          .from("office_verification_requests")
          .select("status, created_at, review_memo")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()
      : { data: null };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="사무소 등록"
        description="공공데이터포털의 전국 공인중개사사무소 정보에서 우리 사무소를 찾고, 사업자등록정보로 대표자를 확인한 뒤 등록해요."
      />

      {office.registered_at ? (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex items-start gap-3">
            <BadgeCheck className="mt-0.5 size-5 shrink-0 text-primary" />
            <div className="flex-1 space-y-3 text-sm">
              <div className="space-y-0.5">
                <p className="font-medium">
                  {office.name} · {office.registration_no}
                </p>
                <p className="text-muted-foreground">
                  {formatDate(office.registered_at)}에 사업자 인증까지 마치고 등록했어요. 다른 사무소로 바꾸려면 등록을 취소한 뒤 다시
                  조회·인증해 주세요.
                </p>
              </div>
              {isOwner && <OfficeUnregisterButton />}
            </div>
          </CardContent>
        </Card>
      ) : (
      <Card>
        <CardHeader>
          <CardTitle>사무소 조회 및 인증</CardTitle>
          <CardDescription className="flex flex-wrap items-center gap-2">
            <ShieldCheck className="size-4" />
            1) 개설등록된 사무소 조회 → 2) 사업자등록번호·개업일자로 대표자 확인(국세청) · 중개사 자격 인증은 준비중
            <ComingSoonBadge />
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isOwner ? (
            <OfficeLookup
              next={typeof next === "string" ? next : null}
              currentRegNo={office.registration_no}
              documentRequest={{ officeId: office.id, request }}
            />
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">사무소 등록은 대표만 할 수 있어요. 사무소 대표에게 요청해 주세요.</p>
          )}
        </CardContent>
      </Card>
      )}
    </div>
  );
}
