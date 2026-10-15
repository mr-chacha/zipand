"use client";

import { useEffect, useRef } from "react";
import { Film, ImagePlus, Video, X } from "lucide-react";
import { toast } from "sonner";
import { formatFileSize } from "@/lib/format";
import { MEDIA_LIMITS } from "@/lib/storage";
import { cn } from "@/lib/utils";
import { randomUuid } from "@/lib/uuid";

export interface PickedMedia {
  key: string;
  file: File;
  previewUrl: string;
}

type Kind = keyof typeof MEDIA_LIMITS;

const KIND_LABEL: Record<Kind, string> = { photo: "사진", video: "동영상" };

/** 선택한 파일을 검사해 미리보기와 함께 반환. 형식·크기·개수 제한을 벗어난 파일은 안내 후 제외한다. */
function pick(kind: Kind, files: FileList | null, current: number): PickedMedia[] {
  const limit = MEDIA_LIMITS[kind];
  const accepted = limit.accept.split(",");
  const result: PickedMedia[] = [];
  for (const file of Array.from(files ?? [])) {
    if (!accepted.includes(file.type)) {
      toast.error(`${file.name}: 지원하지 않는 ${KIND_LABEL[kind]} 형식이에요.`);
      continue;
    }
    if (file.size > limit.maxBytes) {
      toast.error(`${file.name}: ${formatFileSize(limit.maxBytes)} 이하만 올릴 수 있어요.`);
      continue;
    }
    if (current + result.length >= limit.maxCount) {
      toast.error(`${KIND_LABEL[kind]}은(는) 최대 ${limit.maxCount}개까지 올릴 수 있어요.`);
      break;
    }
    result.push({ key: randomUuid(), file, previewUrl: URL.createObjectURL(file) });
  }
  return result;
}

interface MediaPickerProps {
  photos: PickedMedia[];
  videos: PickedMedia[];
  onPhotosChange: (photos: PickedMedia[]) => void;
  onVideosChange: (videos: PickedMedia[]) => void;
  disabled?: boolean;
}

export function MediaPicker({ photos, videos, onPhotosChange, onVideosChange, disabled }: MediaPickerProps) {
  const photoInput = useRef<HTMLInputElement>(null);
  const videoInput = useRef<HTMLInputElement>(null);
  const latest = useRef({ photos, videos });

  useEffect(() => {
    latest.current = { photos, videos };
  }, [photos, videos]);

  useEffect(
    () => () => [...latest.current.photos, ...latest.current.videos].forEach((m) => URL.revokeObjectURL(m.previewUrl)),
    []
  );

  const remove = (list: PickedMedia[], key: string, onChange: (next: PickedMedia[]) => void) => {
    const target = list.find((m) => m.key === key);
    if (target) URL.revokeObjectURL(target.previewUrl);
    onChange(list.filter((m) => m.key !== key));
  };

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <div className="flex items-baseline justify-between">
          <p className="text-sm font-medium">
            사진 <span className="font-normal text-muted-foreground">{photos.length}/{MEDIA_LIMITS.photo.maxCount}</span>
          </p>
          <p className="text-xs text-muted-foreground">JPG·PNG·WEBP·HEIC, 장당 10MB · 첫 번째 사진이 대표 사진</p>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {photos.map((photo, i) => (
            <div key={photo.key} className="group relative aspect-square overflow-hidden rounded-lg border bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element -- 업로드 전 blob 미리보기 */}
              <img src={photo.previewUrl} alt={photo.file.name} className="size-full object-cover" />
              {i === 0 && (
                <span className="absolute bottom-0 inset-x-0 bg-black/55 py-0.5 text-center text-[11px] text-white">대표</span>
              )}
              <button
                type="button"
                disabled={disabled}
                onClick={() => remove(photos, photo.key, onPhotosChange)}
                aria-label="사진 빼기"
                className="absolute top-1 right-1 flex size-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))}
          {photos.length < MEDIA_LIMITS.photo.maxCount && (
            <button
              type="button"
              disabled={disabled}
              onClick={() => photoInput.current?.click()}
              className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
            >
              <ImagePlus className="size-5" />
              사진 추가
            </button>
          )}
        </div>
        <input
          ref={photoInput}
          type="file"
          accept={MEDIA_LIMITS.photo.accept}
          multiple
          className="hidden"
          onChange={(e) => {
            onPhotosChange([...photos, ...pick("photo", e.target.files, photos.length)]);
            e.target.value = "";
          }}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-baseline justify-between">
          <p className="text-sm font-medium">
            동영상 <span className="font-normal text-muted-foreground">{videos.length}/{MEDIA_LIMITS.video.maxCount}</span>
          </p>
          <p className="text-xs text-muted-foreground">MP4·MOV·WEBM, 개당 50MB</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {videos.map((video) => (
            <div key={video.key} className="flex items-center gap-3 rounded-lg border p-2">
              <video src={video.previewUrl} muted preload="metadata" className="aspect-video w-28 shrink-0 rounded bg-black object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{video.file.name}</p>
                <p className="text-xs text-muted-foreground">{formatFileSize(video.file.size)}</p>
              </div>
              <button
                type="button"
                disabled={disabled}
                onClick={() => remove(videos, video.key, onVideosChange)}
                aria-label="동영상 빼기"
                className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>
          ))}
          {videos.length < MEDIA_LIMITS.video.maxCount && (
            <button
              type="button"
              disabled={disabled}
              onClick={() => videoInput.current?.click()}
              className={cn(
                "flex items-center justify-center gap-2 rounded-lg border-2 border-dashed p-4 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary",
                videos.length === 0 && "sm:col-span-2"
              )}
            >
              {videos.length ? <Film className="size-4" /> : <Video className="size-4" />}
              동영상 추가
            </button>
          )}
        </div>
        <input
          ref={videoInput}
          type="file"
          accept={MEDIA_LIMITS.video.accept}
          multiple
          className="hidden"
          onChange={(e) => {
            onVideosChange([...videos, ...pick("video", e.target.files, videos.length)]);
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}
