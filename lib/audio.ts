/** 녹음 버킷(visit-audio, consultation-audio) 허용 형식과 맞춘다 */
export const AUDIO_MAX_BYTES = 50 * 1024 * 1024;

const MIME_BY_EXT: Record<string, string> = {
  m4a: "audio/mp4",
  mp4: "audio/mp4",
  aac: "audio/aac",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  ogg: "audio/ogg",
  webm: "audio/webm",
  amr: "audio/amr",
  "3gp": "audio/3gpp",
};

const ALLOWED = new Set([...Object.values(MIME_BY_EXT), "audio/x-m4a", "audio/m4a", "audio/x-wav"]);

/**
 * 파일 형식을 버킷이 허용하는 MIME으로 맞춘다.
 * 안드로이드 파일 선택기는 통화 녹음(m4a·amr)의 type을 비워 주는 경우가 있어 확장자로 보완한다.
 */
export function normalizeAudioFile(file: File): File | null {
  if (ALLOWED.has(file.type)) return file;
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const type = MIME_BY_EXT[ext];
  return type ? new File([file], file.name, { type }) : null;
}

/** 오디오 길이(초). 브라우저가 형식을 못 읽으면 null */
export function readAudioDuration(file: Blob): Promise<number | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const audio = new Audio();
    const done = (value: number | null) => {
      URL.revokeObjectURL(url);
      resolve(value);
    };
    audio.preload = "metadata";
    audio.onloadedmetadata = () => done(Number.isFinite(audio.duration) ? Math.round(audio.duration) : null);
    audio.onerror = () => done(null);
    setTimeout(() => done(null), 5000);
    audio.src = url;
  });
}

export function formatDuration(sec: number | null | undefined) {
  if (sec === null || sec === undefined) return "";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = String(sec % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${s}` : `${m}:${s}`;
}
