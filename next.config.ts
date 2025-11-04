import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'export',
  // For GitHub Pages deployment - adjust basePath if deploying to a subpath
  basePath: process.env.NODE_ENV === 'production' ? '/ctf-scoreboard' : '',
  images: {
    unoptimized: true, // Required for static export
  },
  env: {
    // Enable dev tools in development mode
    NEXT_PUBLIC_SHOW_DEVTOOLS: process.env.NODE_ENV === 'development' ? 'true' : 'false',
  }
};

export default nextConfig;
