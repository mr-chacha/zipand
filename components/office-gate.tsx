"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Building2 } from "lucide-react";
import { ConfirmDialog, NoticeDialog } from "@/components/dialogs";
import { buttonVariants } from "@/components/ui/button";
import type { GateKind } from "@/lib/office-gate";

/** 서버(getOfficeGate)에서 계산해 클라이언트로 넘기는 기능별 제한 정보 */
export interface GateInfo {
  blocked: boolean;
  isOwner: boolean;
}

const COPY: Record<GateKind, string> = {
  property: "사무소 정보를 등록하기 전에는 매물을 1개까지만 등록할 수 있어요.",
  customer: "사무소 정보를 등록하기 전에는 고객을 1명까지만 등록할 수 있어요.",
  document: "문서 관리는 사무소 정보를 등록한 후에 사용할 수 있어요.",
  deal: "계약 관리는 사무소 정보를 등록한 후에 사용할 수 있어요.",
  invite: "구성원 초대는 사무소 정보를 등록한 후에 사용할 수 있어요.",
  briefing: "고객 브리핑 공유는 사무소 정보를 등록한 후에 사용할 수 있어요.",
  consultation: "상담 기록은 사무소 정보를 등록한 후에 사용할 수 있어요.",
  link: "고객과 매물 연결은 사무소 정보를 등록한 후에 사용할 수 있어요.",
};

const TITLE = "사무소 정보 등록이 필요해요";

export const officeRegisterHref = (next?: string) =>
  next ? `/office/register?next=${encodeURIComponent(next)}` : "/office/register";

function description(kind: GateKind, isOwner: boolean) {
  return isOwner
    ? `${COPY[kind]}`
    : `${COPY[kind]} 사무소 대표가 사무소 정보를 등록하면 이용할 수 있어요.`;
}

/** 대표에게는 컨펌 모달(취소 / 등록하기), 구성원에게는 확인 모달로 안내한다 */
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
  const pathname = usePathname();
  const common = { open, onOpenChange, title: TITLE, description: description(kind, isOwner), icon: <Building2 /> };
  if (!isOwner) return <NoticeDialog {...common} />;
  return (
    <ConfirmDialog {...common} confirmLabel="등록하기" onConfirm={() => router.push(officeRegisterHref(next ?? pathname))} />
  );
}

/**
 * 버튼·선택 등 링크가 아닌 동작을 제한할 때 사용.
 * guard(fn): 막혀 있으면 안내 모달을 띄우고, 아니면 fn을 실행한다. dialog를 함께 렌더링해야 한다.
 */
export function useOfficeGuard(kind: GateKind, gate: GateInfo | undefined, next?: string) {
  const [open, setOpen] = useState(false);
  const blocked = Boolean(gate?.blocked);
  return {
    blocked,
    guard: (fn?: () => void) => {
      if (blocked) setOpen(true);
      else fn?.();
    },
    dialog: blocked ? (
      <OfficeRequiredDialog open={open} onOpenChange={setOpen} kind={kind} isOwner={Boolean(gate?.isOwner)} next={next} />
    ) : null,
  };
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

/** 화면 안에 기능 대신 보여주는 안내 */
export function OfficeRequiredNotice({
  kind,
  isOwner,
  next,
  compact,
}: {
  kind: GateKind;
  isOwner: boolean;
  next?: string;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "flex flex-col items-center gap-2 px-4 py-6 text-center" : "flex flex-col items-center gap-3 px-6 py-10 text-center"}>
      <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Building2 className="size-5" />
      </span>
      <p className="font-medium">{TITLE}</p>
      <p className="max-w-md text-sm text-muted-foreground">{description(kind, isOwner)}</p>
      {isOwner && (
        <Link href={officeRegisterHref(next)} className={buttonVariants({ size: compact ? "sm" : "default" })}>
          사무소 등록하기
        </Link>
      )}
    </div>
  );
}
