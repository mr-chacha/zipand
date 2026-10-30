"use client";

import { useRef, useState, useTransition } from "react";
import { ImagePlus, Play, Star, Trash2, Video } from "lucide-react";
import { toast } from "sonner";
import { ConfirmAction } from "@/components/form/confirm-action";
import { PropertyThumbnail } from "@/components/property-thumbnail";
import { Button } from "@/components/ui/button";
import { useBusy } from "@/lib/busy";
import {
  addPropertyPhotos,
  addPropertyVideos,
  deletePropertyPhoto,
  deletePropertyVideo,
  setCoverPhoto,
} from "@/lib/actions/properties";
import { toErrorMessage } from "@/lib/errors";
import { formatFileSize } from "@/lib/format";
import { MEDIA_LIMITS } from "@/lib/storage";
import { removeFromStorage, uploadToStorage } from "@/lib/upload-client";
import { cn } from "@/lib/utils";

const PHOTO_LIMIT = MEDIA_LIMITS.photo;
const VIDEO_LIMIT = MEDIA_LIMITS.video;

interface Photo {
  id: string;
  url: string | null;
}

interface VideoItem {
  id: string;
  url: string | null;
  name: string | null;
  size: number | null;
}

type Selection = { kind: "photo"; index: number } | { kind: "video" };

interface PhotoManagerProps {
  officeId: string;
  propertyId: string;
  propertyType: string;
  photos: Photo[];
  videos: VideoItem[];
}

export function PhotoManager({ officeId, propertyId, propertyType, photos, videos }: PhotoManagerProps) {
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [pending, startTransition] = useTransition();
  useBusy(pending);
  useBusy(uploadingPhoto, "사진을 올리는 중입니다…");
  useBusy(uploadingVideo, "동영상을 올리는 중입니다…");

  const video = videos[0] ?? null;
  const [selected, setSelected] = useState<Selection>({ kind: "photo", index: 0 });
  const photoIndex =
    selected.kind === "photo" ? Math.min(selected.index, Math.max(0, photos.length - 1)) : 0;
  const showingVideo = selected.kind === "video" && Boolean(video);
  const currentPhoto = showingVideo ? null : photos[photoIndex];
  const photoRemaining = PHOTO_LIMIT.maxCount - photos.length;
  const canAddVideo = !video;

  const onPhotos = async (fileList: FileList | null) => {
    if (!fileList?.length) return;
    const accepted = PHOTO_LIMIT.accept.split(",");
    const files = Array.from(fileList).filter((file) => {
      if (!accepted.includes(file.type)) {
        toast.error(`${file.name}: 지원하지 않는 사진 형식이에요.`);
        return false;
      }
      if (file.size > PHOTO_LIMIT.maxBytes) {
        toast.error(`${file.name}: ${formatFileSize(PHOTO_LIMIT.maxBytes)} 이하만 올릴 수 있어요.`);
        return false;
      }
      return true;
    });
    if (files.length > photoRemaining) {
      toast.error(`사진은 최대 ${PHOTO_LIMIT.maxCount}장까지 올릴 수 있어요. ${photoRemaining}장만 추가할게요.`);
      files.splice(photoRemaining);
    }
    if (!files.length) {
      if (photoInputRef.current) photoInputRef.current.value = "";
      return;
    }

    setUploadingPhoto(true);
    try {
      const paths: string[] = [];
      for (const file of files) {
        paths.push(await uploadToStorage("property-photos", officeId, propertyId, file));
      }
      const result = await addPropertyPhotos(propertyId, paths);
      if (result.error) toast.error(result.error);
      else toast.success(`사진 ${paths.length}장을 추가했어요.`);
    } catch (e) {
      toast.error(toErrorMessage(e));
    } finally {
      setUploadingPhoto(false);
      if (photoInputRef.current) photoInputRef.current.value = "";
    }
  };

  const onVideo = async (fileList: FileList | null) => {
    const file = fileList?.[0];
    if (videoInputRef.current) videoInputRef.current.value = "";
    if (!file) return;
    if (!canAddVideo) {
      toast.error("동영상은 매물당 1개만 올릴 수 있어요.");
      return;
    }
    const accepted = VIDEO_LIMIT.accept.split(",");
    if (!accepted.includes(file.type)) {
      toast.error("MP4·MOV·WEBM만 올릴 수 있어요.");
      return;
    }
    if (file.size > VIDEO_LIMIT.maxBytes) {
      toast.error(`${formatFileSize(VIDEO_LIMIT.maxBytes)} 이하만 올릴 수 있어요.`);
      return;
    }

    setUploadingVideo(true);
    let path = "";
    try {
      path = await uploadToStorage("property-videos", officeId, propertyId, file);
      const result = await addPropertyVideos(propertyId, [{ path, name: file.name, size: file.size }]);
      if (result.error) {
        await removeFromStorage("property-videos", [path]);
        toast.error(result.error);
      } else {
        toast.success(result.message ?? "동영상을 추가했어요.");
        setSelected({ kind: "video" });
      }
    } catch (e) {
      if (path) await removeFromStorage("property-videos", [path]);
      toast.error(toErrorMessage(e));
    } finally {
      setUploadingVideo(false);
    }
  };

  const run = (fn: () => Promise<{ error?: string; message?: string }>) =>
    startTransition(async () => {
      const result = await fn();
      if (result.error) toast.error(result.error);
      else if (result.message) toast.success(result.message);
    });

  return (
    <div className="space-y-2">
      <div className="group relative overflow-hidden rounded-xl border bg-muted">
        {showingVideo && video?.url ? (
          <video src={video.url} controls preload="metadata" className="aspect-[16/9] w-full bg-black object-contain" />
        ) : showingVideo ? (
          <div className="flex aspect-[16/9] items-center justify-center text-sm text-muted-foreground">
            영상을 불러오지 못했어요
          </div>
        ) : (
          <PropertyThumbnail type={propertyType} src={currentPhoto?.url} className="aspect-[16/9] w-full object-contain" />
        )}
        {showingVideo && video && (
          <div className="absolute top-2 right-2 opacity-0 transition-opacity group-hover:opacity-100">
            <ConfirmAction
              appOnly
              action={async () => {
                const result = await deletePropertyVideo(video.id);
                if (!result.error) setSelected({ kind: "photo", index: 0 });
                return result;
              }}
              title="동영상을 삭제할까요?"
              description="삭제한 동영상은 복구할 수 없어요."
              trigger={
                <Button size="icon-sm" variant="destructive" disabled={pending} aria-label="동영상 삭제">
                  <Trash2 />
                </Button>
              }
            />
          </div>
        )}
        {currentPhoto && !showingVideo && (
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            {photoIndex !== 0 && (
              <Button
                size="sm"
                variant="secondary"
                disabled={pending}
                onClick={() => run(() => setCoverPhoto(currentPhoto.id, propertyId))}
              >
                <Star data-icon="inline-start" />
                대표 사진
              </Button>
            )}
            <ConfirmAction
              appOnly
              action={async () => {
                const result = await deletePropertyPhoto(currentPhoto.id);
                if (!result.error) setSelected({ kind: "photo", index: 0 });
                return result;
              }}
              title="사진을 삭제할까요?"
              description="삭제하면 되돌릴 수 없어요."
              trigger={
                <Button size="icon-sm" variant="destructive" disabled={pending} aria-label="사진 삭제">
                  <Trash2 />
                </Button>
              }
            />
          </div>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {photos.map((photo, i) => (
          <button
            key={photo.id}
            type="button"
            onClick={() => setSelected({ kind: "photo", index: i })}
            className={cn(
              "relative size-16 shrink-0 overflow-hidden rounded-lg border-2",
              selected.kind === "photo" && i === photoIndex ? "border-primary" : "border-transparent"
            )}
          >
            <PropertyThumbnail type={propertyType} src={photo.url} className="size-full" />
            {i === 0 && (
              <span className="absolute bottom-0 left-0 right-0 bg-black/50 text-center text-[10px] text-white">대표</span>
            )}
          </button>
        ))}

        {video && (
          <button
            type="button"
            onClick={() => setSelected({ kind: "video" })}
            className={cn(
              "relative size-16 shrink-0 overflow-hidden rounded-lg border-2 bg-black",
              selected.kind === "video" ? "border-primary" : "border-transparent"
            )}
            aria-label="동영상"
          >
            {video.url ? (
              <video src={video.url} muted preload="metadata" className="size-full object-cover" />
            ) : (
              <span className="flex size-full items-center justify-center bg-muted" />
            )}
            <span className="absolute inset-0 flex items-center justify-center bg-black/35">
              <span className="flex size-7 items-center justify-center rounded-full bg-white/90 text-foreground shadow">
                <Play className="size-3.5 fill-current" />
              </span>
            </span>
          </button>
        )}

        {photoRemaining > 0 && (
          <button
            type="button"
            onClick={() => photoInputRef.current?.click()}
            disabled={uploadingPhoto || uploadingVideo}
            className="flex size-16 shrink-0 flex-col items-center justify-center gap-0.5 rounded-lg border-2 border-dashed text-[11px] text-muted-foreground hover:border-primary/40 hover:text-primary"
          >
            <ImagePlus className="size-4" />
            사진 추가
          </button>
        )}
        {canAddVideo && (
          <button
            type="button"
            onClick={() => videoInputRef.current?.click()}
            disabled={uploadingPhoto || uploadingVideo}
            className="flex size-16 shrink-0 flex-col items-center justify-center gap-0.5 rounded-lg border-2 border-dashed text-[11px] text-muted-foreground hover:border-primary/40 hover:text-primary"
          >
            <Video className="size-4" />
            동영상 추가
          </button>
        )}

        <input
          ref={photoInputRef}
          type="file"
          accept={PHOTO_LIMIT.accept}
          multiple
          className="hidden"
          onChange={(e) => onPhotos(e.target.files)}
        />
        <input
          ref={videoInputRef}
          type="file"
          accept={VIDEO_LIMIT.accept}
          className="hidden"
          onChange={(e) => onVideo(e.target.files)}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        사진 {photos.length}/{PHOTO_LIMIT.maxCount}
        {video ? " · 동영상 1/1" : " · 동영상 최대 1개"} · 첫 번째 사진이 대표 사진
      </p>
    </div>
  );
}
