"use client";

import { cloneElement, useState, useTransition } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/dialogs";
import { BUSY_LABELS, useBusy } from "@/lib/busy";
import { useIsApp } from "@/lib/use-is-app";
import type { ActionState } from "@/types";

interface ConfirmActionProps {
  action: () => Promise<ActionState | void>;
  title: string;
  description?: string;
  confirmLabel?: string;
  successMessage?: string;
  trigger: React.ReactElement<{ onClick?: () => void; disabled?: boolean }>;
  /** 앱에서만 컨펌을 띄우고, 웹에서는 바로 실행한다 */
  appOnly?: boolean;
}

/** 서버 액션을 실행하기 전에 컨펌 모달을 띄운다 (기본: 삭제) */
export function ConfirmAction({
  action,
  title,
  description,
  confirmLabel = "삭제",
  successMessage,
  trigger,
  appOnly,
}: ConfirmActionProps) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const isApp = useIsApp();
  useBusy(pending, confirmLabel === "삭제" ? BUSY_LABELS.delete : BUSY_LABELS.default);

  const run = () => {
    startTransition(async () => {
      const result = await action();
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      setOpen(false);
      if (successMessage) toast.success(successMessage);
    });
  };

  if (appOnly && !isApp) return cloneElement(trigger, { onClick: run, disabled: pending });

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={setOpen}
      trigger={trigger}
      title={title}
      description={description}
      confirmLabel={confirmLabel}
      destructive
      pending={pending}
      onConfirm={run}
    />
  );
}
