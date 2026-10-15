"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/dialogs";
import type { ActionState } from "@/types";

interface ConfirmActionProps {
  action: () => Promise<ActionState | void>;
  title: string;
  description?: string;
  confirmLabel?: string;
  successMessage?: string;
  trigger: React.ReactElement;
}

/** 서버 액션을 실행하기 전에 컨펌 모달을 띄운다 (기본: 삭제) */
export function ConfirmAction({
  action,
  title,
  description,
  confirmLabel = "삭제",
  successMessage,
  trigger,
}: ConfirmActionProps) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const onConfirm = () => {
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
      onConfirm={onConfirm}
    />
  );
}
