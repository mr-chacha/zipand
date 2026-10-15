// 파비콘(app/icon.svg)과 같은 로고로 앱 아이콘·스플래시 원본 PNG를 assets/에 만든다.
// 이후 `npx @capacitor/assets generate --android`가 해상도별 리소스를 생성한다.
import { mkdir } from "node:fs/promises";
import sharp from "sharp";

const BLUE = "#245fd4";
const HOUSE = `
  <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/>
  <path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>`;

/** 24단위 lucide 집 아이콘을 size 캔버스 가운데에 houseSize 크기로 그린다 */
function svg(size, houseSize, background) {
  const scale = houseSize / 24;
  const offset = (size - houseSize) / 2;
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  ${background ? `<rect width="${size}" height="${size}" fill="${background}"/>` : ""}
  <g transform="translate(${offset} ${offset}) scale(${scale})" fill="none" stroke="#ffffff" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round">${HOUSE}</g>
</svg>`);
}

await mkdir("assets", { recursive: true });
const jobs = [
  // 적응형 아이콘: 전경은 안전 영역(가운데 약 61%) 안에 들어가게
  ["assets/icon-foreground.png", svg(1024, 560, null)],
  ["assets/icon-background.png", svg(1024, 0, BLUE)],
  // 구형 런처용 단일 아이콘 (파비콘과 같은 비율)
  ["assets/icon-only.png", svg(1024, 768, BLUE)],
  ["assets/splash.png", svg(2732, 640, BLUE)],
  ["assets/splash-dark.png", svg(2732, 640, BLUE)],
];
for (const [file, data] of jobs) await sharp(data).png().toFile(file);
console.log("assets generated");
