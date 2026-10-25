import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "100.127.100.115",
    "geoffs-mac-mini-1",
    "100.111.2.67",
    "Geoffs-Mac-Mini.local",
    "*.ts.net",
  ],
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
