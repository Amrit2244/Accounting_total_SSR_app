import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb", // This correctly handles the size limit for Server Actions
    },
  },
  // ✅ serverRuntimeConfig is REMOVED because it causes the build error
};

export default nextConfig;
