"use client";

import { useRef, useState, useTransition } from "react";
import { ImagePlus, Loader2, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PropertyThumbnail } from "@/components/property-thumbnail";
import { Button } from "@/components/ui/button";
import { addPropertyPhotos, deletePropertyPhoto, setCoverPhoto } from "@/lib/actions/properties";
import { toErrorMessage } from "@/lib/errors";
import { formatFileSize } from "@/lib/format";
import { MEDIA_LIMITS } from "@/lib/storage";
import { uploadToStorage } from "@/lib/upload-client";
import { cn } from "@/lib/utils";

const LIMIT = MEDIA_LIMITS.photo;

interface Photo {
  id: string;
  url: string | null;
}

interface PhotoManagerProps {
  officeId: string;
  propertyId: string;
  propertyType: string;
  photos: Photo[];
}

export function PhotoManager({ officeId, propertyId, propertyType, photos }: PhotoManagerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState(0);
  const current = photos[Math.min(selected, photos.length - 1)];
  const remaining = LIMIT.maxCount - photos.length;

  const onFiles = async (fileList: FileList | null) => {
    if (!fileList?.length) return;
    const accepted = LIMIT.accept.split(",");
    const files = Array.from(fileList).filter((file) => {
      if (!accepted.includes(file.type)) {
        toast.error(`${file.name}: 지원하지 않는 사진 형식이에요.`);
        return false;
      }
      if (file.size > LIMIT.maxBytes) {
        toast.error(`${file.name}: ${formatFileSize(LIMIT.maxBytes)} 이하만 올릴 수 있어요.`);
        return false;
      }
      return true;
    });
    if (files.length > remaining) {
      toast.error(`사진은 최대 ${LIMIT.maxCount}장까지 올릴 수 있어요. ${remaining}장만 추가할게요.`);
      files.splice(remaining);
    }
    if (!files.length) {
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    setUploading(true);
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
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
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
        <PropertyThumbnail type={propertyType} src={current?.url} className="aspect-[16/9] w-full object-contain" />
        {current && (
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            {selected !== 0 && (
              <Button size="sm" variant="secondary" disabled={pending} onClick={() => run(() => setCoverPhoto(current.id, propertyId))}>
                <Star data-icon="inline-start" />
                대표 사진
              </Button>
            )}
            <Button
              size="icon-sm"
              variant="destructive"
              disabled={pending}
              aria-label="사진 삭제"
              onClick={() => {
                setSelected(0);
                run(() => deletePropertyPhoto(current.id));
              }}
            >
              <Trash2 />
            </Button>
          </div>
        )}
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {photos.map((photo, i) => (
          <button
            key={photo.id}
            type="button"
            onClick={() => setSelected(i)}
            className={cn(
              "relative size-16 shrink-0 overflow-hidden rounded-lg border-2",
              i === selected ? "border-primary" : "border-transparent"
            )}
          >
            <PropertyThumbnail type={propertyType} src={photo.url} className="size-full" />
            {i === 0 && (
              <span className="absolute bottom-0 left-0 right-0 bg-black/50 text-center text-[10px] text-white">대표</span>
            )}
          </button>
        ))}
        {remaining > 0 && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex size-16 shrink-0 flex-col items-center justify-center gap-0.5 rounded-lg border-2 border-dashed text-[11px] text-muted-foreground hover:border-primary/40 hover:text-primary"
          >
            {uploading ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
            {uploading ? "업로드 중" : "사진 추가"}
          </button>
        )}
        <input ref={inputRef} type="file" accept={LIMIT.accept} multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
      </div>
      <p className="text-xs text-muted-foreground">
        사진 {photos.length}/{LIMIT.maxCount} · 첫 번째 사진이 대표 사진
      </p>
    </div>
  );
}
