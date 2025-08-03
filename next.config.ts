import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '20mb' // Aumentar limite para uploads de áudio
    }
  },
  // Configure allowed image domains for Next.js Image component
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'sosmwuvshpxyhylzsiis.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  // Increase API route body size limit
  async rewrites() {
    return []
  },
  // Disable strict mode in development to prevent double renders that cause WaveSurfer issues
  reactStrictMode: false
};

export default nextConfig;