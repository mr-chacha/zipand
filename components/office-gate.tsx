"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2 } from "lucide-react";
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
} from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";
import type { GateKind } from "@/lib/office-gate";

const COPY: Record<GateKind, string> = {
  property: "사무소 정보를 등록하기 전에는 매물을 1개까지만 등록할 수 있어요.",
  customer: "사무소 정보를 등록하기 전에는 고객을 1명까지만 등록할 수 있어요.",
  document: "문서 관리는 사무소 정보를 등록한 후에 사용할 수 있어요.",
  deal: "계약 관리는 사무소 정보를 등록한 후에 사용할 수 있어요.",
};

export const officeRegisterHref = (next?: string) =>
  next ? `/office/register?next=${encodeURIComponent(next)}` : "/office/register";

function description(kind: GateKind, isOwner: boolean) {
  return isOwner
    ? `${COPY[kind]} 공공데이터에서 사무소를 조회해 등록해 주세요.`
    : `${COPY[kind]} 사무소 대표가 사무소 정보를 등록하면 이용할 수 있어요.`;
}

export function OfficeRequiredDialog({
  open,
  onOpenChange,
  kind,
  isOwner,
  next,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kind: GateKind;
  isOwner: boolean;
  next?: string;
}) {
  const router = useRouter();
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia>
            <Building2 />
          </AlertDialogMedia>
          <AlertDialogTitle>사무소 정보 등록이 필요해요</AlertDialogTitle>
          <AlertDialogDescription>{description(kind, isOwner)}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{isOwner ? "취소" : "확인"}</AlertDialogCancel>
          {isOwner && <AlertDialogAction onClick={() => router.push(officeRegisterHref(next))}>등록하기</AlertDialogAction>}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/** 사무소 등록 전 제한에 걸리면 이동 대신 안내 모달을 띄우는 링크 */
export function GatedLink({
  href,
  kind,
  blocked,
  isOwner,
  className,
  children,
}: {
  href: string;
  kind: GateKind;
  blocked: boolean;
  isOwner: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  if (!blocked) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }
  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>
        {children}
      </button>
      <OfficeRequiredDialog open={open} onOpenChange={setOpen} kind={kind} isOwner={isOwner} next={href} />
    </>
  );
}

/** 등록 화면에 직접 들어왔을 때 보여주는 안내 */
export function OfficeRequiredNotice({ kind, isOwner, next }: { kind: GateKind; isOwner: boolean; next?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Building2 className="size-5" />
      </span>
      <p className="font-medium">사무소 정보 등록이 필요해요</p>
      <p className="max-w-md text-sm text-muted-foreground">{description(kind, isOwner)}</p>
      {isOwner && (
        <Link href={officeRegisterHref(next)} className={buttonVariants()}>
          사무소 등록하기
        </Link>
      )}
    </div>
  );
}
