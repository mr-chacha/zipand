"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Link2, Link2Off, ListChecks, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmAction } from "@/components/form/confirm-action";
import { FormMessage } from "@/components/form/form-message";
import { NativeSelect } from "@/components/form/native-select";
import { useOfficeGuard, type GateInfo } from "@/components/office-gate";
import { SubmitButton } from "@/components/form/submit-button";
import { PropertyThumbnail } from "@/components/property-thumbnail";
import { PropertyStatusBadge } from "@/components/status-badge";
import { DatePicker } from "@/components/form/date-picker";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  addConsultation,
  deleteConsultation,
  deleteCustomer,
  linkCustomerProperty,
  unlinkCustomerProperty,
} from "@/lib/actions/customers";
import { CONSULT_CHANNELS } from "@/lib/constants";
import { formatDateTime, formatPrice, isoToKstLocal } from "@/lib/format";
import type { PropertyListItem } from "@/lib/queries";
import { useFormAction } from "@/lib/use-form-action";

export function CustomerHeaderActions({ customerId }: { customerId: string }) {
  return (
    <>
      <Link href={`/properties/share?customer=${customerId}`} className={buttonVariants({ variant: "outline" })}>
        <ListChecks data-icon="inline-start" />
        매물 리스트 보내기
      </Link>
      <Link href={`/customers/${customerId}/edit`} className={buttonVariants({ variant: "outline" })}>
        <Pencil data-icon="inline-start" />
        수정
      </Link>
      <ConfirmAction
        action={() => deleteCustomer(customerId)}
        title="고객을 삭제할까요?"
        description="상담 기록, 후속 일정, 매물 연결이 함께 삭제되며 되돌릴 수 없어요."
        trigger={
          <Button variant="outline" className="text-destructive">
            <Trash2 data-icon="inline-start" />
            삭제
          </Button>
        }
      />
    </>
  );
}

interface ConsultationItem {
  id: string;
  channel: string;
  content: string;
  consulted_at: string;
  author: { name: string } | null;
}

export function ConsultationPanel({
  customerId,
  consultations,
  gate,
}: {
  customerId: string;
  consultations: ConsultationItem[];
  gate: GateInfo;
}) {
  const [pending, startTransition] = useTransition();
  const officeGuard = useOfficeGuard("consultation", gate);
  const { state, pending: saving, onSubmit } = useFormAction(addConsultation.bind(null, customerId), {
    onSuccess: (result, form) => {
      form.reset();
      toast.success(result.message);
    },
  });

  return (
    <div className="space-y-4">
      {officeGuard.dialog}
      <form
        onSubmit={(e) => {
          if (officeGuard.blocked) {
            e.preventDefault();
            officeGuard.guard();
          } else onSubmit(e);
        }}
        className="space-y-2 rounded-lg border p-3"
      >
        <div className="flex flex-wrap gap-2">
          <NativeSelect name="channel" options={CONSULT_CHANNELS} defaultValue="전화" className="w-28" />
          <DatePicker name="consulted_at" withTime defaultValue={isoToKstLocal(null)} className="w-56" aria-label="상담 일시" />
        </div>
        <Textarea name="content" rows={3} placeholder="상담 내용, 고객 반응, 다음에 할 일" required />
        <FormMessage state={state} />
        <div className="flex justify-end">
          <SubmitButton size="sm" pending={saving}>
            <Plus data-icon="inline-start" />
            상담 기록
          </SubmitButton>
        </div>
      </form>

      {consultations.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">상담 기록이 없어요.</p>
      ) : (
        <ol className="relative space-y-4 border-l pl-4">
          {consultations.map((c) => (
            <li key={c.id} className="group relative">
              <span className="absolute top-1.5 -left-[21px] size-2.5 rounded-full border-2 border-background bg-primary" />
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="outline">{c.channel}</Badge>
                {formatDateTime(c.consulted_at)}
                {c.author && <span>· {c.author.name}</span>}
                <Button
                  size="icon-xs"
                  variant="ghost"
                  aria-label="상담 기록 삭제"
                  className="ml-auto opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      const result = await deleteConsultation(c.id, customerId);
                      if (result.error) toast.error(result.error);
                    })
                  }
                >
                  <Trash2 />
                </Button>
              </div>
              <p className="mt-1 text-sm whitespace-pre-wrap">{c.content}</p>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function PropertyRow({ property, children }: { property: PropertyListItem; children?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border p-2">
      <PropertyThumbnail type={property.property_type} src={property.thumbUrl} alt={property.title} className="size-14 shrink-0 rounded-md" />
      <div className="min-w-0 flex-1">
        <Link href={`/properties/${property.id}`} className="block truncate text-sm font-medium hover:underline">
          {property.title}
        </Link>
        <p className="text-xs text-muted-foreground">
          {property.property_type} · {property.deal_type} {formatPrice(property)}
        </p>
        {children}
      </div>
      <PropertyStatusBadge status={property.status} />
    </div>
  );
}

export function CustomerProperties({
  customerId,
  linked,
  recommendations,
  options,
  gate,
}: {
  customerId: string;
  linked: PropertyListItem[];
  recommendations: (PropertyListItem & { reasons: string[] })[];
  options: { value: string; label: string }[];
  gate: GateInfo;
}) {
  const [pending, startTransition] = useTransition();
  const officeGuard = useOfficeGuard("link", gate);
  const run = (fn: () => Promise<{ error?: string; message?: string }>) =>
    startTransition(async () => {
      const result = await fn();
      if (result.error) toast.error(result.error);
      else if (result.message) toast.success(result.message);
    });
  const link = (propertyId: string) => officeGuard.guard(() => run(() => linkCustomerProperty(customerId, propertyId)));

  return (
    <div className="space-y-5">
      {officeGuard.dialog}
      {options.length > 0 && (
        <Select value={null} disabled={pending} onValueChange={(propertyId) => propertyId && link(propertyId as string)}>
          <SelectTrigger className="w-full sm:w-80">
            <Link2 className="size-4 text-muted-foreground" />
            <SelectValue placeholder="매물 연결하기" />
          </SelectTrigger>
          <SelectContent>
            {options.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <div className="space-y-2">
        {linked.length === 0 && <p className="py-2 text-sm text-muted-foreground">연결된 매물이 없어요.</p>}
        {linked.map((p) => (
          <PropertyRow key={p.id} property={p}>
            <Button
              size="xs"
              variant="ghost"
              className="-ml-2 h-6 text-muted-foreground"
              disabled={pending}
              onClick={() => run(() => unlinkCustomerProperty(customerId, p.id))}
            >
              <Link2Off data-icon="inline-start" />
              연결 해제
            </Button>
          </PropertyRow>
        ))}
      </div>

      {recommendations.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold">조건에 맞는 매물</p>
          <p className="text-xs text-muted-foreground">거래 유형·예산·희망 지역 기준으로 고른 매물이에요.</p>
          {recommendations.map((p) => (
            <PropertyRow key={p.id} property={p}>
              <div className="mt-1 flex flex-wrap items-center gap-1">
                {p.reasons.map((r) => (
                  <span key={r} className="rounded bg-primary/10 px-1.5 py-0.5 text-[11px] text-primary">
                    {r}
                  </span>
                ))}
                <Button
                  size="xs"
                  variant="outline"
                  className="ml-1 h-6"
                  disabled={pending}
                  onClick={() => link(p.id)}
                >
                  <Link2 data-icon="inline-start" />
                  연결
                </Button>
              </div>
            </PropertyRow>
          ))}
        </div>
      )}
    </div>
  );
}
