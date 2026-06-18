import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Increase body size limit for Excel uploads
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
