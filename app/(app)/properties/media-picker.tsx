"use client";

import { useEffect, useRef } from "react";
import { ImagePlus, Play, Video, X } from "lucide-react";
import { toast } from "sonner";
import { formatFileSize } from "@/lib/format";
import { MEDIA_LIMITS } from "@/lib/storage";
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
  const video = videos[0] ?? null;

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
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-sm font-medium">
          사진·동영상{" "}
          <span className="font-normal text-muted-foreground">
            사진 {photos.length}/{MEDIA_LIMITS.photo.maxCount}
            {video ? " · 동영상 1/1" : " · 동영상 최대 1개"}
          </span>
        </p>
        <p className="text-xs text-muted-foreground">첫 번째 사진이 대표 사진</p>
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

        {video && (
          <div className="group relative aspect-square overflow-hidden rounded-lg border bg-black">
            <video src={video.previewUrl} muted preload="metadata" className="size-full object-cover" />
            <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/35">
              <span className="flex size-8 items-center justify-center rounded-full bg-white/90 text-foreground shadow">
                <Play className="size-4 fill-current" />
              </span>
            </span>
            <button
              type="button"
              disabled={disabled}
              onClick={() => remove(videos, video.key, onVideosChange)}
              aria-label="동영상 빼기"
              className="absolute top-1 right-1 flex size-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
            >
              <X className="size-3.5" />
            </button>
          </div>
        )}

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
        {!video && (
          <button
            type="button"
            disabled={disabled}
            onClick={() => videoInput.current?.click()}
            className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
          >
            <Video className="size-5" />
            동영상 추가
          </button>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        사진 JPG·PNG·WEBP·HEIC 장당 10MB · 동영상 MP4·MOV·WEBM 50MB · 최대 1개
      </p>
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
      <input
        ref={videoInput}
        type="file"
        accept={MEDIA_LIMITS.video.accept}
        className="hidden"
        onChange={(e) => {
          onVideosChange(pick("video", e.target.files, videos.length));
          e.target.value = "";
        }}
      />
    </div>
  );
}
