"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Camera,
  ImagePlus,
  MapPin,
  Mic,
  Play,
  RotateCcw,
  Sparkles,
  Square,
  WifiOff,
} from "lucide-react";
import { SourceBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatDuration } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { PropertyVisit } from "@/types";

const defaultChecklist = ["누수 흔적", "결로·곰팡이", "수압 확인", "보일러 작동", "창호 상태", "소음"];

export function VisitWorkspace({ propertyId, visit }: { propertyId: string; visit?: PropertyVisit }) {
  const [recording, setRecording] = useState(false);
  const [useLocation, setUseLocation] = useState(false);
  const photoCount = visit?.photoCount ?? 0;

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <div className="space-y-6 lg:col-span-3">
        <Card>
          <CardHeader>
            <CardTitle>사진</CardTitle>
            <CardDescription>{photoCount}장 업로드됨 · 최대 30장</CardDescription>
            <CardAction className="flex gap-2">
              <Button variant="outline" size="sm">
                <Camera data-icon="inline-start" />
                촬영
              </Button>
              <Button variant="outline" size="sm">
                <ImagePlus data-icon="inline-start" />
                앨범
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {Array.from({ length: Math.min(photoCount, 9) }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-square rounded-lg bg-gradient-to-br from-primary/20 to-muted"
                />
              ))}
              <button
                type="button"
                className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed text-xs text-muted-foreground hover:border-primary/40 hover:text-primary"
              >
                <ImagePlus className="size-5" />
                추가
              </button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>음성 메모</CardTitle>
            <CardDescription>말로 남기면 AI가 항목별로 정리해요</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 rounded-xl bg-muted/50 p-4">
              <Button
                size="icon-lg"
                variant={recording ? "destructive" : "default"}
                className="size-14 rounded-full"
                onClick={() => setRecording((r) => !r)}
                aria-label={recording ? "녹음 중지" : "녹음 시작"}
              >
                {recording ? <Square className="size-5" /> : <Mic className="size-6" />}
              </Button>
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {recording ? "녹음 중… 0:12" : "버튼을 눌러 녹음을 시작하세요"}
                </p>
                <div className="mt-2 flex h-6 items-end gap-0.5">
                  {Array.from({ length: 40 }).map((_, i) => (
                    <span
                      key={i}
                      className={cn("w-1 rounded-full", recording ? "bg-destructive/60" : "bg-muted-foreground/20")}
                      style={{ height: `${20 + ((i * 37) % 80)}%` }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {visit && (
              <div className="space-y-2 rounded-lg border p-3">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon-sm" aria-label="재생">
                    <Play />
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    원본 음성 {formatDuration(visit.voiceDurationSec)} · {visit.visitedAt}
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">“{visit.transcript}”</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>텍스트 메모 · 위치</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea rows={3} placeholder="추가로 남길 내용을 입력하세요" />
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={useLocation} onCheckedChange={(v) => setUseLocation(Boolean(v))} />
              <MapPin className="size-4 text-muted-foreground" />
              현재 위치를 임장 기록에 함께 저장 (선택)
            </label>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6 lg:col-span-2">
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-1.5">
              <Sparkles className="size-4 text-primary" />
              AI 정리 결과
            </CardTitle>
            <CardDescription>값을 눌러 수정할 수 있어요. 원문은 그대로 보존돼요.</CardDescription>
            <CardAction>
              <Button variant="ghost" size="sm">
                <RotateCcw data-icon="inline-start" />
                다시 정리
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="space-y-3">
            {visit ? (
              visit.fields.map((f) => (
                <div key={f.label} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">{f.label}</span>
                    <SourceBadge source={f.source} />
                  </div>
                  <Input defaultValue={f.value} />
                  {f.note && <p className="text-xs text-warning">⚠ {f.note}</p>}
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                음성 메모를 녹음하면 방향·채광·수리 필요·입주 가능일 등이 여기에 정리돼요.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>시설 체크리스트</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            {(visit?.checklist ?? defaultChecklist.map((label) => ({ label, checked: false }))).map((item) => (
              <label key={item.label} className="flex items-center gap-2 text-sm">
                <Checkbox defaultChecked={item.checked} />
                {item.label}
              </label>
            ))}
          </CardContent>
        </Card>

        {visit && (
          <Card>
            <CardHeader>
              <CardTitle>추가 확인 사항</CardTitle>
              <CardDescription>AI 추천 · 체크리스트에 추가할 수 있어요</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {visit.followUps.map((item) => (
                <div key={item} className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-sm">
                  <Badge variant="outline" className="text-[10px]">
                    확인
                  </Badge>
                  {item}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          <WifiOff className="size-3.5" />
          네트워크가 끊겨도 기기에 임시 저장 후 자동으로 다시 전송해요.
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1">
            임시 저장
          </Button>
          <Link href={`/properties/${propertyId}`} className={cn(buttonVariants(), "flex-1")}>
            매물에 저장
          </Link>
        </div>
      </div>
    </div>
  );
}
