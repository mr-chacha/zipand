import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 안드로이드 에뮬레이터는 호스트 PC를 10.0.2.2로 접속한다(앱 개발용)
  allowedDevOrigins: ["10.0.2.2"],
};

export default nextConfig;
