"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useBusy } from "@/lib/busy";

interface BaseDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** 지정하면 이 요소를 눌러 연다(비제어 사용) */
  trigger?: React.ReactElement;
  title: string;
  description?: React.ReactNode;
  icon?: React.ReactNode;
}

function DialogHead({ title, description, icon }: Pick<BaseDialogProps, "title" | "description" | "icon">) {
  return (
    <AlertDialogHeader>
      {icon && <AlertDialogMedia>{icon}</AlertDialogMedia>}
      <AlertDialogTitle>{title}</AlertDialogTitle>
      {description && (
        <AlertDialogDescription className="whitespace-pre-line">{description}</AlertDialogDescription>
      )}
    </AlertDialogHeader>
  );
}

/** 확인 모달: 안내만 하고 확인 버튼 하나로 닫는다 */
export function NoticeDialog({
  open,
  onOpenChange,
  trigger,
  title,
  description,
  icon,
  confirmLabel = "확인",
}: BaseDialogProps & { confirmLabel?: string }) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      {trigger && <AlertDialogTrigger render={trigger} />}
      <AlertDialogContent>
        <DialogHead title={title} description={description} icon={icon} />
        <AlertDialogFooter>
          <AlertDialogCancel variant="default">{confirmLabel}</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/** 컨펌 모달: 취소 / 실행 두 버튼. onConfirm 후 닫을지는 호출하는 쪽이 open으로 제어한다 */
export function ConfirmDialog({
  open,
  onOpenChange,
  trigger,
  title,
  description,
  icon,
  cancelLabel = "취소",
  confirmLabel = "확인",
  pendingLabel = "처리 중…",
  destructive,
  pending,
  onConfirm,
}: BaseDialogProps & {
  cancelLabel?: string;
  confirmLabel?: string;
  pendingLabel?: string;
  destructive?: boolean;
  pending?: boolean;
  onConfirm: () => void;
}) {
  useBusy(Boolean(pending), pendingLabel);
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      {trigger && <AlertDialogTrigger render={trigger} />}
      <AlertDialogContent>
        <DialogHead title={title} description={description} icon={icon} />
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction variant={destructive ? "destructive" : "default"} onClick={onConfirm} disabled={pending}>
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
