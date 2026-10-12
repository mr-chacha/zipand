"use client";

import { useState, useTransition } from "react";
import { Copy, ExternalLink, EyeOff, Link2, Loader2, Printer, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { BriefingView, DEFAULT_SECTIONS, type BriefingData } from "@/components/briefing-view";
import { ComingSoonButton } from "@/components/coming-soon";
import { CompleteProfileDialog } from "@/components/complete-profile-dialog";
import { ConfirmAction } from "@/components/form/confirm-action";
import { NativeSelect } from "@/components/form/native-select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createBriefing, deleteBriefing } from "@/lib/actions/briefings";
import { formatDate, formatDateTime } from "@/lib/format";
import type { BriefingSections, ProfileNeed } from "@/types";

const sectionOptions: { key: keyof BriefingSections; label: string }[] = [
  { key: "photos", label: "사진" },
  { key: "price", label: "거래 금액" },
  { key: "specs", label: "면적·층·방향" },
  { key: "description", label: "중개사 설명" },
  { key: "highlights", label: "확인된 장점" },
  { key: "followUps", label: "추가 확인 사항" },
  { key: "contact", label: "중개사 연락처" },
];

interface BriefingLink {
  id: string;
  token: string;
  expires_at: string;
  view_count: number;
  created_at: string;
  expired: boolean;
}

interface BriefingBuilderProps {
  propertyId: string;
  data: BriefingData;
  defaultComment: string;
  links: BriefingLink[];
  siteUrl: string;
}

export function BriefingBuilder({ propertyId, data, defaultComment, links, siteUrl }: BriefingBuilderProps) {
  const [sections, setSections] = useState<BriefingSections>(DEFAULT_SECTIONS);
  const [comment, setComment] = useState(defaultComment);
  const [days, setDays] = useState("14");
  const [pending, startTransition] = useTransition();
  const [needs, setNeeds] = useState<ProfileNeed[]>([]);

  const linkUrl = (token: string) => `${typeof window !== "undefined" ? window.location.origin : siteUrl}/b/${token}`;

  const copy = async (token: string) => {
    await navigator.clipboard.writeText(linkUrl(token));
    toast.success("링크를 복사했어요. 고객에게 메시지로 보내주세요.");
  };

  const create = () =>
    startTransition(async () => {
      const result = await createBriefing(propertyId, sections, comment, Number(days));
      if (result.needs) {
        setNeeds(result.needs);
        return;
      }
      if (result.error || !result.token) {
        toast.error(result.error ?? "링크를 만들지 못했어요.");
        return;
      }
      await copy(result.token).catch(() => toast.success(result.message));
    });

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <CompleteProfileDialog
        needs={needs}
        onOpenChange={(open) => !open && setNeeds([])}
        onCompleted={create}
        title="고객에게 보여줄 연락처가 필요해요"
        description="브리핑에 중개사 연락처를 포함하려면 휴대폰 번호를 입력해 주세요. 연락처 항목을 끄고 만들 수도 있어요."
      />
      <div className="space-y-6 lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>포함할 항목</CardTitle>
            <CardDescription>미리보기에 바로 반영돼요</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            {sectionOptions.map((option) => (
              <label key={option.key} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={sections[option.key]}
                  onCheckedChange={(v) => setSections((s) => ({ ...s, [option.key]: Boolean(v) }))}
                />
                {option.label}
              </label>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>중개사 설명</CardTitle>
            <CardDescription>매물 설명을 기본으로 불러왔어요</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea rows={5} value={comment} onChange={(e) => setComment(e.target.value)} />
            <ComingSoonButton size="sm">AI로 설명 작성</ComingSoonButton>
          </CardContent>
        </Card>

        <div className="flex items-start gap-2 rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
          <EyeOff className="mt-0.5 size-4 shrink-0" />
          내부 메모, 임대인·고객 개인정보, 상세 주소(번지)는 브리핑에 포함되지 않아요.
        </div>

        <Card>
          <CardHeader>
            <CardTitle>공유 링크 만들기</CardTitle>
            <CardDescription>링크는 만료일까지 누구나 열람할 수 있어요</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-end gap-2">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="days">유효 기간</Label>
                <NativeSelect
                  id="days"
                  value={days}
                  onChange={(e) => setDays(e.target.value)}
                  options={[
                    { value: "3", label: "3일" },
                    { value: "7", label: "7일" },
                    { value: "14", label: "14일" },
                    { value: "30", label: "30일" },
                  ]}
                />
              </div>
              <Button onClick={create} disabled={pending}>
                {pending ? <Loader2 data-icon="inline-start" className="animate-spin" /> : <Link2 data-icon="inline-start" />}
                링크 생성·복사
              </Button>
            </div>

            {links.length > 0 && (
              <div className="divide-y rounded-lg border">
                {links.map((link) => {
                  const expired = link.expired;
                  return (
                    <div key={link.id} className="flex items-center gap-2 px-3 py-2 text-xs">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-mono">/b/{link.token.slice(0, 10)}…</p>
                        <p className="text-muted-foreground">
                          {formatDateTime(link.created_at)} 생성 · 조회 {link.view_count}회 · {formatDate(link.expires_at)}까지
                        </p>
                      </div>
                      {expired ? (
                        <Badge variant="outline">만료</Badge>
                      ) : (
                        <>
                          <Button size="icon-sm" variant="ghost" aria-label="링크 복사" onClick={() => copy(link.token)}>
                            <Copy />
                          </Button>
                          <a
                            href={`/b/${link.token}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex size-7 items-center justify-center rounded-md hover:bg-muted"
                            aria-label="열기"
                          >
                            <ExternalLink className="size-4" />
                          </a>
                          <a
                            href={`/b/${link.token}?print=1`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex size-7 items-center justify-center rounded-md hover:bg-muted"
                            aria-label="인쇄·PDF 저장"
                          >
                            <Printer className="size-4" />
                          </a>
                        </>
                      )}
                      <ConfirmAction
                        action={() => deleteBriefing(link.id, propertyId)}
                        title="공유 링크를 삭제할까요?"
                        description="삭제하면 이 링크로 더 이상 브리핑을 볼 수 없어요."
                        successMessage="링크를 삭제했어요."
                        trigger={
                          <Button size="icon-sm" variant="ghost" aria-label="링크 삭제">
                            <Trash2 />
                          </Button>
                        }
                      />
                    </div>
                  );
                })}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              PDF가 필요하면 링크의 인쇄 버튼을 눌러 &lsquo;PDF로 저장&rsquo;을 선택하세요.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-3">
        <Label className="mb-2 block text-xs text-muted-foreground">미리보기</Label>
        <div className="mx-auto max-w-xl">
          <BriefingView data={data} sections={sections} comment={comment} />
        </div>
      </div>
    </div>
  );
}
