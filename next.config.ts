import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // Set the correct root directory
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
