import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  trailingSlash: true,
  async rewrites() {
    return [
      {
        source: '/api/:path*/',
        destination: `${process.env.API_URL || 'http://127.0.0.1:8000'}/:path*/`,
      },
      {
        source: '/api/:path*',
        destination: `${process.env.API_URL || 'http://127.0.0.1:8000'}/:path*`, // Proxy to Backend
      },
    ];
  },
};

export default nextConfig;
