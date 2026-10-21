"use client";

import { useState, useTransition } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { AudioAttach, type AttachedAudio } from "@/components/audio-attach";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { analyzeCallAudio } from "@/lib/actions/ai-assist";
import type { ConsultationDraft, PropertyMatch } from "@/lib/ai/types";
import type { Customer } from "@/types";
import { ConsultResultDialog } from "./consult-result-dialog";

/** 녹음 → AI 초안 → 고객 폼 defaultValues로 넘김 */
export function CallDraftPanel({
  officeId,
  draftFolderId,
  onDraft,
}: {
  officeId: string;
  draftFolderId: string;
  onDraft: (partial: Partial<Customer>, consult: ConsultationDraft) => void;
}) {
  const [audio, setAudio] = useState<AttachedAudio | null>(null);
  const [busy, setBusy] = useState(false);
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<ConsultationDraft | null>(null);
  const [matches, setMatches] = useState<PropertyMatch[]>([]);

  const run = () => {
    if (!audio) {
      toast.error("통화 녹음 파일을 먼저 올려 주세요.");
      return;
    }
    start(async () => {
      const r = await analyzeCallAudio(audio.path, audio.name);
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      setDraft(r.draft);
      setMatches(r.matches);
      setOpen(true);
      onDraft(
        {
          name: r.draft.name ?? undefined,
          phone: r.draft.phone ?? undefined,
          deal_type: r.draft.deal_type,
          regions: r.draft.regions,
          budget_min: r.draft.budget_min,
          budget_max: r.draft.budget_max,
          move_in_date: r.draft.move_in_date,
          must_have: r.draft.must_have,
          exclude: r.draft.exclude,
          memo: r.draft.memo,
        },
        r.draft
      );
      toast.success("초안을 아래 고객 정보에 채워 두었어요. 확인하고 저장하세요.");
    });
  };

  return (
    <>
      <Card className="border-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="size-4 text-primary" />
            통화 녹음으로 AI 작성
          </CardTitle>
          <CardDescription>
            녹음만 올리면 요약·희망조건을 채워요. 전화번호는 파일명에 있을 때만 자동 입력돼요.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <AudioAttach
            bucket="consultation-audio"
            officeId={officeId}
            folderId={draftFolderId}
            filePrefix="상담녹음"
            value={audio}
            onChange={setAudio}
            onBusyChange={setBusy}
            fileLabel="통화 녹음 선택"
            idleText="통화 녹음 파일을 선택하세요"
          />
          <Button type="button" disabled={!audio || busy || pending} onClick={run}>
            {pending ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <Sparkles data-icon="inline-start" />}
            AI로 고객 정보 채우기
          </Button>
        </CardContent>
      </Card>
      <ConsultResultDialog
        open={open}
        onOpenChange={setOpen}
        customerId={null}
        consultationId={null}
        draft={draft}
        matches={matches}
      />
    </>
  );
}
