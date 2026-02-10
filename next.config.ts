import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // config options here
  experimental: {
    reactCompiler: true,
  },
  env: {
    DATABASE_URL: process.env.DATABASE_URL || "",
    SOCKET_URL: process.env.SOCKET_URL || "https://localhost:3001",
  },
};

export default nextConfig;
 