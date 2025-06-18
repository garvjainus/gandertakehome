import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* other config options here */
  eslint: {
    // WARNING: This allows production builds to successfully complete even if
    // your project has ESLint errors. Use carefully—prefer fixing issues.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
