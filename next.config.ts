import { networkInterfaces } from "node:os";
import type { NextConfig } from "next";

/** 같은 Wi‑Fi의 실제 폰(앱 개발 APK)이 접속할 수 있도록 이 PC의 사설 IP들 */
const lanAddresses = Object.values(networkInterfaces())
  .flat()
  .filter((a) => a && a.family === "IPv4" && !a.internal)
  .map((a) => a!.address);

const nextConfig: NextConfig = {
  // 안드로이드 에뮬레이터는 호스트 PC를 10.0.2.2로 접속한다(앱 개발용)
  allowedDevOrigins: ["10.0.2.2", ...lanAddresses],
  serverExternalPackages: ["unpdf"],
};

export default nextConfig;
