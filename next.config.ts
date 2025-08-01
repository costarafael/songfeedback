import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000", "localhost:3001"],
      bodySizeLimit: '10mb' // Aumentar limite para uploads de áudio
    }
  },
  // Disable strict mode in development to prevent double renders that cause WaveSurfer issues
  reactStrictMode: false
};

export default nextConfig;