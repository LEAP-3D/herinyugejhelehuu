import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true, // Move it here
  experimental: {
    // Keep other experimental flags here if you have any
  },
  env: {
    DATABASE_URL: process.env.DATABASE_URL || "",
  },
};

export default nextConfig;
