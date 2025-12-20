/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "100mb", // ✅ This covers your Server Action uploads
    },
  },
  // ✅ Removed serverRuntimeConfig as it is unrecognized in modern Next.js
};

export default nextConfig;
