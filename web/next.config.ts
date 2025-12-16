import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    // Default to the Render Backend if API_URL is not set
    const apiUrl = process.env.API_URL || 'https://schoolapp-6vwg.onrender.com';
    console.log('Proxying API requests to:', apiUrl); // Helpful for deployment logs

    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
