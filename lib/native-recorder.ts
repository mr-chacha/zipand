import { Capacitor, registerPlugin } from "@capacitor/core";

/** android/app/src/main/java/kr/zipand/app/RecorderPlugin.java */
interface ZipandRecorderPlugin {
  start(): Promise<{ startedAt: number }>;
  stop(): Promise<{ path: string; name: string; mimeType: string; size: number; durationMs: number }>;
  status(): Promise<{ recording: boolean; startedAt?: number }>;
  discard(options: { path: string }): Promise<void>;
}

export const ZipandRecorder = registerPlugin<ZipandRecorderPlugin>("ZipandRecorder");

/** 안드로이드 앱에서 백그라운드 녹음을 쓸 수 있는지 */
export function hasNativeRecorder() {
  return Capacitor.isNativePlatform() && Capacitor.isPluginAvailable("ZipandRecorder");
}

/** 네이티브 녹음 파일을 WebView에서 File로 읽는다 */
export async function readNativeFile(path: string, name: string, type: string) {
  const res = await fetch(Capacitor.convertFileSrc(path));
  if (!res.ok) throw new Error("녹음 파일을 읽지 못했어요.");
  return new File([await res.blob()], name, { type });
}
