/** @type {import('next').NextConfig} */
const nextConfig = {
  // 1. Force strict ESM mode
  experimental: {
    serverActions: {
      bodySizeLimit: "100mb", // ✅ Allow 100MB uploads
    },
  },
  // 2. Some versions use this setting instead
  serverRuntimeConfig: {
    maxBodySize: "100mb",
  },
};

export default nextConfig;
