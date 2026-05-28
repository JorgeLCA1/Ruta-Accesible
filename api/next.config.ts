import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: ['172.31.99.222'], 
  turbopack: {
    root: ".",
  },
};

export default nextConfig;
