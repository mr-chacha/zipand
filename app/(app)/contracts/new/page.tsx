import type { Metadata } from "next";
import Link from "next/link";
import { OfficeRequiredNotice } from "@/components/office-gate";
import { PageHeader } from "@/components/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getOfficeGate } from "@/lib/office-gate";
import { getCustomerOptions, getPropertyOptions } from "@/lib/queries";
import { DealForm } from "../deal-form";

export const metadata: Metadata = { title: "계약 시작" };

export default async function NewDealPage({ searchParams }: PageProps<"/contracts/new">) {
  const { property, customer } = await searchParams;
  const [properties, customers, gate] = await Promise.all([getPropertyOptions(), getCustomerOptions(), getOfficeGate()]);
  const available = properties.filter((p) => p.status !== "계약 완료");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="계약 시작"
        description="거래를 만들면 기본 확인 체크리스트가 함께 생성되고, 매물 상태가 '계약 진행'으로 바뀌어요."
        backHref="/contracts"
        backLabel="계약 준비"
      />
      {gate.blocked.deal ? (
        <Card>
          <OfficeRequiredNotice kind="deal" isOwner={gate.isOwner} next="/contracts/new" />
        </Card>
      ) : available.length === 0 ? (
        <Card className="items-center gap-3 py-12 text-center text-sm text-muted-foreground">
          거래할 수 있는 매물이 없어요.
          <Link href="/properties/new" className={buttonVariants({ size: "sm" })}>
            매물 등록
          </Link>
        </Card>
      ) : (
        <Card>
          <CardContent>
            <DealForm
              properties={available.map((p) => ({ value: p.id, label: `${p.title} (${p.deal_type})` }))}
              customers={customers.map((c) => ({ value: c.id, label: c.name }))}
              defaultPropertyId={typeof property === "string" ? property : undefined}
              defaultCustomerId={typeof customer === "string" ? customer : undefined}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
