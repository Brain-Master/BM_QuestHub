import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  distDir: "out",
  trailingSlash: true,
  allowedDevOrigins: ["127.0.0.1"],
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "pp.userapi.com", pathname: "/**" },
      { protocol: "https", hostname: "sun9-21.userapi.com", pathname: "/**" },
      { protocol: "https", hostname: "sun9-22.userapi.com", pathname: "/**" },
      { protocol: "https", hostname: "sun9-23.userapi.com", pathname: "/**" },
      { protocol: "https", hostname: "sun9-88.userapi.com", pathname: "/**" },
      { protocol: "https", hostname: "i.mycdn.me", pathname: "/**" },
    ],
  },
};

export default nextConfig;
