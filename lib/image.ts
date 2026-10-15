const MAX_EDGE = 1920;
const QUALITY = 0.82;
const RESIZABLE = ["image/jpeg", "image/png", "image/webp"];

/**
 * 사진의 긴 변을 MAX_EDGE 이하로 줄여 JPEG로 다시 저장한다.
 * 디코딩할 수 없거나(HEIC 등) 줄여도 작아지지 않으면 원본을 그대로 쓴다.
 */
export async function shrinkPhoto(file: File): Promise<File> {
  if (!RESIZABLE.includes(file.type)) return file;
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return file;
  }
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return file;
  }
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", QUALITY));
  if (!blob || blob.size >= file.size) return file;
  const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
  return new File([blob], name, { type: "image/jpeg", lastModified: file.lastModified });
}
