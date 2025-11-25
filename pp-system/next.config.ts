import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable caching in development to prevent stale data issues
  ...(process.env.NODE_ENV === 'development' && {
    experimental: {
      staleTimes: {
        dynamic: 0,
        static: 0,
      },
    },
  }),
};

export default nextConfig;
