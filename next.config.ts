import type { NextConfig } from "next";
import path from 'path';

const nextConfig: NextConfig = {
  /* other config options here */
  eslint: {
    // WARNING: This allows production builds to successfully complete even if
    // your project has ESLint errors. Use carefully—prefer fixing issues.
    ignoreDuringBuilds: true,
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@': path.resolve(__dirname, 'src'),
    };
    return config;
  },
};

export default nextConfig;
