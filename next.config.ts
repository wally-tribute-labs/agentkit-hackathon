import type { NextConfig } from "next";

const runtimeMode = process.env.GROUNDSIGNAL_MODE ?? "demo";
if (runtimeMode !== "demo" && runtimeMode !== "sqlite") {
  throw new Error("Invalid GROUNDSIGNAL_MODE. Expected 'demo' or 'sqlite'.");
}

const nextConfig: NextConfig = {
  allowedDevOrigins: ["localhost", "127.0.0.1"],
  output: "standalone",
  serverExternalPackages: ["better-sqlite3"],
  poweredByHeader: false,
  async headers() {
    return [{
      source: "/(.*)",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
        { key: "X-Frame-Options", value: "DENY" },
      ],
    }];
  },
};

export default nextConfig;
