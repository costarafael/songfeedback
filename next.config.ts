import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '20mb' // Aumentar limite para uploads de áudio
    }
  },
  // Increase API route body size limit
  async rewrites() {
    return []
  },
  // Disable strict mode in development to prevent double renders that cause WaveSurfer issues
  reactStrictMode: false
};

export default nextConfig;