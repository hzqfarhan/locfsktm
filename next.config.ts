import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'community.uthm.edu.my',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'fsktm.uthm.edu.my',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
