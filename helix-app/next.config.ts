import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  images: {
    domains: ['lh3.googleusercontent.com', 'googleusercontent.com'],
  },
  devIndicators: false,
};

export default nextConfig;
