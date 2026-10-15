"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, FileCheck2 } from "lucide-react";
import { toast } from "sonner";
import { FormMessage } from "@/components/form/form-message";
import { SubmitButton } from "@/components/form/submit-button";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { submitOfficeVerification } from "@/lib/actions/office";
import { FormError } from "@/lib/errors";
import { formatDate } from "@/lib/format";
import { removeFromStorage, uploadToStorage } from "@/lib/upload-client";
import { useFormAction } from "@/lib/use-form-action";

const ACCEPT = "application/pdf,image/jpeg,image/png,image/webp,image/heic";
const MAX_BYTES = 10 * 1024 * 1024;

export interface VerificationRequest {
  status: string;
  created_at: string;
  review_memo: string | null;
}

/** 조회·인증이 안 될 때의 안내. 심사 중이면 상태를, 아니면 서류 제출 모달 링크를 보여준다 */
export function OfficeDocumentRequestNotice({ officeId, request }: { officeId: string; request: VerificationRequest | null }) {
  if (request?.status === "pending") {
    return (
      <div className="flex items-start gap-2 rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm">
        <Clock className="mt-0.5 size-4 shrink-0 text-primary" />
        <div>
          <p className="font-medium">서류 심사 중이에요</p>
          <p className="text-xs text-muted-foreground">
            {formatDate(request.created_at)}에 제출한 서류를 관리자가 확인하고 있어요. 확인이 끝나면 사무소 등록이 완료돼요.
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {request?.status === "rejected" && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
          제출한 서류가 반려됐어요{request.review_memo ? `: ${request.review_memo}` : "."} 서류를 확인해 다시 제출해 주세요.
        </p>
      )}
      <p className="text-center text-xs text-muted-foreground">
        중개사무소나 사업자 정보가 조회되지 않나요?{" "}
        <OfficeDocumentRequest
          officeId={officeId}
          trigger={
            <button type="button" className="font-medium text-primary underline-offset-4 hover:underline">
              서류로 등록 신청하기
            </button>
          }
        />
      </p>
    </div>
  );
}

/** 공공데이터·국세청 조회로 확인되지 않을 때: 등록증·사업자등록증을 올려 관리자 심사를 신청한다 */
export function OfficeDocumentRequest({ officeId, trigger }: { officeId: string; trigger: React.ReactElement }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { state, pending, onSubmit, setState } = useFormAction(submitOfficeVerification, {
    prepare: async (fd) => {
      const files = [
        ["license_doc", "license_doc_path", "중개사무소 등록증"],
        ["business_doc", "business_doc_path", "사업자등록증"],
      ] as const;
      const uploaded: string[] = [];
      try {
        for (const [field, pathField, label] of files) {
          const file = fd.get(field);
          if (!(file instanceof File) || file.size === 0) throw new FormError(`${label} 파일을 선택해 주세요.`);
          if (file.size > MAX_BYTES) throw new FormError(`${label} 파일은 10MB 이하로 올려 주세요.`);
          const path = await uploadToStorage("office-verification", officeId, "verification", file);
          uploaded.push(path);
          fd.set(pathField, path);
          fd.delete(field);
        }
      } catch (e) {
        await removeFromStorage("office-verification", uploaded);
        throw e;
      }
    },
    onSuccess: (r) => {
      setOpen(false);
      if (r.message) toast.success(r.message);
      router.refresh();
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setState(null);
      }}
    >
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileCheck2 className="size-5 text-primary" />
            서류로 사무소 등록 신청
          </DialogTitle>
          <DialogDescription>
            공공데이터나 국세청 조회로 확인되지 않으면 <b className="text-foreground">중개사무소 등록증</b>과{" "}
            <b className="text-foreground">사업자등록증</b>을 올려 주세요. 관리자가 확인한 후 사무소 등록을 완료해 드려요. (영업일 기준 1~2일)
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="req_office_name">사무소명</Label>
            <Input id="req_office_name" name="office_name" placeholder="예) 행복공인중개사사무소" required />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="req_registration_no">
                개설등록번호 <span className="font-normal text-muted-foreground">(선택)</span>
              </Label>
              <Input id="req_registration_no" name="registration_no" placeholder="예) 11440-2020-00123" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="req_business_no">
                사업자등록번호 <span className="font-normal text-muted-foreground">(선택)</span>
              </Label>
              <Input id="req_business_no" name="business_no" inputMode="numeric" placeholder="예) 123-45-67890" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="req_license_doc">중개사무소 등록증</Label>
            <Input id="req_license_doc" name="license_doc" type="file" accept={ACCEPT} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="req_business_doc">사업자등록증</Label>
            <Input id="req_business_doc" name="business_doc" type="file" accept={ACCEPT} required />
          </div>
          <p className="text-xs text-muted-foreground">
            PDF·JPG·PNG, 각 10MB 이하. 제출한 서류는 비공개로 보관되고 사무소 확인에만 사용해요.
          </p>
          <FormMessage state={state} />
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>취소</DialogClose>
            <SubmitButton pending={pending} pendingText="제출 중…">
              제출하기
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
