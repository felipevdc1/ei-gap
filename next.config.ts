import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // maxDuration for /api/scan is set via route segment config (export const maxDuration = 120)
  // See: src/app/api/scan/route.ts
};

export default nextConfig;
