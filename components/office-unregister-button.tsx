"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Search } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/dialogs";
import { Button } from "@/components/ui/button";
import { useBusy } from "@/lib/busy";
import { unregisterOffice } from "@/lib/actions/office";

/** 등록된 사무소를 취소하고 다시 조회·인증하게 한다 */
export function OfficeUnregisterButton({ label = "다른 사무소 찾기", onDone }: { label?: string; onDone?: () => void }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  useBusy(pending);

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={(next) => !pending && setOpen(next)}
      trigger={
        <Button type="button" variant="outline" size="sm">
          <Search data-icon="inline-start" />
          {label}
        </Button>
      }
      icon={<AlertTriangle className="text-destructive" />}
      title="사무소 등록을 취소할까요?"
      description={
        <>
          저장된 <b className="text-foreground">중개사무소 등록 정보</b>와 <b className="text-foreground">사업자 인증 정보</b>가 삭제됩니다. <br/>다시 등록하기 전까지 매물·고객 추가, 문서·계약, 구성원 초대 등 일부 기능이 제한돼요.
        </>
      }
      confirmLabel="등록 취소하고 다시 찾기"
      pendingLabel="취소하는 중…"
      destructive
      pending={pending}
      onConfirm={() =>
        startTransition(async () => {
          const result = await unregisterOffice();
          if (result.error) {
            toast.error(result.error);
            return;
          }
          setOpen(false);
          toast.success(result.message);
          onDone?.();
          router.refresh();
        })
      }
    />
  );
}
