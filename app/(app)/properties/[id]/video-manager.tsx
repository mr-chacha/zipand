"use client";

import { useRef, useState } from "react";
import { Loader2, Trash2, Video } from "lucide-react";
import { toast } from "sonner";
import { ConfirmAction } from "@/components/form/confirm-action";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { addPropertyVideos, deletePropertyVideo } from "@/lib/actions/properties";
import { toErrorMessage } from "@/lib/errors";
import { formatFileSize } from "@/lib/format";
import { MEDIA_LIMITS } from "@/lib/storage";
import { removeFromStorage, uploadToStorage } from "@/lib/upload-client";

interface VideoItem {
  id: string;
  url: string | null;
  name: string | null;
  size: number | null;
}

export function VideoManager({ officeId, propertyId, videos }: { officeId: string; propertyId: string; videos: VideoItem[] }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<string | null>(null);
  const limit = MEDIA_LIMITS.video;

  const onFiles = async (fileList: FileList | null) => {
    const files = Array.from(fileList ?? []);
    if (inputRef.current) inputRef.current.value = "";
    if (!files.length) return;
    if (videos.length + files.length > limit.maxCount) {
      toast.error(`동영상은 최대 ${limit.maxCount}개까지 올릴 수 있어요.`);
      return;
    }
    const invalid = files.find((f) => !limit.accept.split(",").includes(f.type) || f.size > limit.maxBytes);
    if (invalid) {
      toast.error(`${invalid.name}: MP4·MOV·WEBM, ${formatFileSize(limit.maxBytes)} 이하만 올릴 수 있어요.`);
      return;
    }

    const uploaded: { path: string; name: string; size: number }[] = [];
    try {
      for (const [i, file] of files.entries()) {
        setStatus(`업로드 중 ${i + 1}/${files.length}`);
        uploaded.push({ path: await uploadToStorage("property-videos", officeId, propertyId, file), name: file.name, size: file.size });
      }
      const result = await addPropertyVideos(propertyId, uploaded);
      if (result.error) toast.error(result.error);
      else toast.success(result.message);
    } catch (e) {
      await removeFromStorage("property-videos", uploaded.map((u) => u.path));
      toast.error(toErrorMessage(e));
    } finally {
      setStatus(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>동영상 ({videos.length})</CardTitle>
        <CardDescription>MP4·MOV·WEBM, 개당 50MB · 최대 {limit.maxCount}개</CardDescription>
        <CardAction>
          <Button
            size="sm"
            variant="outline"
            disabled={Boolean(status) || videos.length >= limit.maxCount}
            onClick={() => inputRef.current?.click()}
          >
            {status ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <Video data-icon="inline-start" />}
            {status ?? "동영상 추가"}
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        {videos.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">등록된 동영상이 없어요. 현장 영상을 올려 보세요.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {videos.map((video) => (
              <div key={video.id} className="space-y-1.5">
                {video.url ? (
                  <video src={video.url} controls preload="metadata" className="aspect-video w-full rounded-lg bg-black" />
                ) : (
                  <div className="flex aspect-video items-center justify-center rounded-lg bg-muted text-sm text-muted-foreground">
                    영상을 불러오지 못했어요
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <p className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
                    {video.name ?? "동영상"}
                    {video.size ? ` · ${formatFileSize(video.size)}` : ""}
                  </p>
                  <ConfirmAction
                    title="동영상을 삭제할까요?"
                    description="삭제한 동영상은 복구할 수 없어요."
                    successMessage="동영상을 삭제했어요."
                    action={() => deletePropertyVideo(video.id)}
                    trigger={
                      <Button size="icon-sm" variant="ghost" aria-label="동영상 삭제">
                        <Trash2 />
                      </Button>
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={limit.accept}
          multiple
          className="hidden"
          onChange={(e) => onFiles(e.target.files)}
        />
      </CardContent>
    </Card>
  );
}
