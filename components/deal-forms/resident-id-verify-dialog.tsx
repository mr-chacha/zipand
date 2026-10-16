"use client";

import { useEffect, useState, useTransition } from "react";
import { ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { DatePicker } from "@/components/form/date-picker";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { verifyResidentId } from "@/lib/actions/resident-id";
import { useBusy } from "@/lib/busy";
import { cn } from "@/lib/utils";

const fieldBorder =
  "rounded-md border-2 border-foreground/35 bg-background shadow-none focus-visible:border-foreground/60 focus-visible:ring-1";

export function ResidentIdVerifyDialog({
  open,
  onOpenChange,
  initialName = "",
  initialIdFront = "",
  initialIdBack = "",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialName?: string;
  initialIdFront?: string;
  initialIdBack?: string;
}) {
  const [pending, startTransition] = useTransition();
  useBusy(pending);
  const [name, setName] = useState(initialName);
  const [idFront, setIdFront] = useState(initialIdFront);
  const [idBack, setIdBack] = useState(initialIdBack);
  const [issuedAt, setIssuedAt] = useState("");
  const [govUrl, setGovUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(initialName);
    setIdFront(initialIdFront);
    setIdBack(initialIdBack);
    setIssuedAt("");
    setGovUrl(null);
  }, [open, initialName, initialIdFront, initialIdBack]);

  const submit = () => {
    const fd = new FormData();
    fd.set("name", name);
    fd.set("id_front", idFront);
    fd.set("id_back", idBack);
    if (issuedAt) fd.set("issued_at", issuedAt);
    startTransition(async () => {
      const result = await verifyResidentId(null, fd);
      if (result.error) {
        toast.error(result.error);
        setGovUrl(result.govUrl ?? null);
        return;
      }
      toast.success(result.message ?? "확인했어요.");
      setGovUrl(result.govUrl ?? null);
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>주민등록증 진위확인</DialogTitle>
          <DialogDescription>
            성명·주민등록번호·발급일자를 입력하면 형식을 검사하고, 행정기관 진위확인은
            정부24로 이어갈 수 있어요.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-1">
          <div className="space-y-1.5">
            <Label htmlFor="rid-name">성명</Label>
            <Input
              id="rid-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="홍길동"
              className={cn("h-9 text-[14px]", fieldBorder)}
              autoComplete="name"
            />
          </div>
          <div className="space-y-1.5">
            <Label>주민등록번호</Label>
            <div className="flex items-center gap-1.5">
              <Input
                inputMode="numeric"
                maxLength={6}
                value={idFront}
                onChange={(e) => setIdFront(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                className={cn("h-9 w-24 text-[14px] tabular-nums", fieldBorder)}
                aria-label="주민등록번호 앞자리"
              />
              <span className="text-muted-foreground">-</span>
              <Input
                inputMode="numeric"
                maxLength={7}
                value={idBack}
                onChange={(e) => setIdBack(e.target.value.replace(/\D/g, "").slice(0, 7))}
                placeholder="0000000"
                className={cn("h-9 w-28 text-[14px] tabular-nums", fieldBorder)}
                aria-label="주민등록번호 뒷자리"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>발급일자</Label>
            <DatePicker
              value={issuedAt}
              onChange={setIssuedAt}
              className="w-full"
              inputClassName={cn("h-9", fieldBorder)}
              placeholder="발급일 선택"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            ※ 주민등록증 진위확인 공식 OpenAPI는 일반 사업자에 개방되어 있지 않아요.
            입력값 형식 검사 후 정부24에서 최종 확인할 수 있어요.
          </p>
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          {govUrl ? (
            <Button type="button" variant="outline" size="sm" render={<a href={govUrl} target="_blank" rel="noreferrer" />}>
              <ExternalLink data-icon="inline-start" />
              정부24에서 확인
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              닫기
            </Button>
            <Button type="button" disabled={pending} onClick={submit}>
              진위확인
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
