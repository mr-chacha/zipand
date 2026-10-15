"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Link2, Link2Off, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmAction } from "@/components/form/confirm-action";
import { useOfficeGuard, type GateInfo } from "@/components/office-gate";
import { CustomerStatusBadge } from "@/components/status-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBusy } from "@/lib/busy";
import { linkCustomerProperty, unlinkCustomerProperty } from "@/lib/actions/customers";
import { deleteProperty, updatePropertyStatus } from "@/lib/actions/properties";
import { PROPERTY_STATUSES, type PropertyStatus } from "@/lib/constants";

export function PropertyStatusSelect({ propertyId, status }: { propertyId: string; status: string }) {
  const [pending, startTransition] = useTransition();
  useBusy(pending);
  return (
    <Select
      value={status}
      disabled={pending}
      onValueChange={(value) =>
        startTransition(async () => {
          const result = await updatePropertyStatus(propertyId, value as PropertyStatus);
          if (result.error) toast.error(result.error);
          else toast.success(result.message);
        })
      }
    >
      <SelectTrigger size="sm" aria-label="매물 상태">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {PROPERTY_STATUSES.map((s) => (
          <SelectItem key={s} value={s}>
            {s}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function PropertyHeaderActions({ propertyId }: { propertyId: string }) {
  return (
    <>
      <Link href={`/properties/${propertyId}/edit`} className={buttonVariants({ variant: "outline" })}>
        <Pencil data-icon="inline-start" />
        수정
      </Link>
      <ConfirmAction
        action={() => deleteProperty(propertyId)}
        title="매물을 삭제할까요?"
        description="사진, 임장 기록, 서류, 브리핑 링크가 함께 삭제되며 되돌릴 수 없어요."
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

interface LinkedCustomer {
  id: string;
  name: string;
  status: string;
  phone: string | null;
}

export function LinkedCustomers({
  propertyId,
  linked,
  options,
  gate,
}: {
  propertyId: string;
  linked: LinkedCustomer[];
  options: { id: string; name: string }[];
  gate: GateInfo;
}) {
  const [pending, startTransition] = useTransition();
  useBusy(pending);
  const officeGuard = useOfficeGuard("link", gate);
  const available = options.filter((o) => !linked.some((l) => l.id === o.id));

  const run = (fn: () => Promise<{ error?: string; message?: string }>) =>
    startTransition(async () => {
      const result = await fn();
      if (result.error) toast.error(result.error);
    });

  return (
    <div className="space-y-3">
      {officeGuard.dialog}
      {available.length > 0 && (
        <Select
          value={null}
          disabled={pending}
          onValueChange={(customerId) =>
            customerId && officeGuard.guard(() => run(() => linkCustomerProperty(customerId as string, propertyId)))
          }
        >
          <SelectTrigger className="w-full sm:w-72">
            <Link2 className="size-4 text-muted-foreground" />
            <SelectValue placeholder="고객 연결하기" />
          </SelectTrigger>
          <SelectContent>
            {available.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {linked.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">연결된 고객이 없어요.</p>
      ) : (
        <div className="divide-y rounded-lg border">
          {linked.map((c) => (
            <div key={c.id} className="flex items-center gap-3 px-3 py-2.5">
              <Link href={`/customers/${c.id}`} className="flex-1 text-sm font-medium hover:underline">
                {c.name}
              </Link>
              <span className="text-xs text-muted-foreground">{c.phone}</span>
              <CustomerStatusBadge status={c.status} />
              <Button
                size="icon-sm"
                variant="ghost"
                aria-label="연결 해제"
                disabled={pending}
                onClick={() => run(() => unlinkCustomerProperty(c.id, propertyId))}
              >
                <Link2Off />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
