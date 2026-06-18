import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  pageExtensions: ["next.tsx", "next.ts", "next.jsx", "next.js"],
  typescript: {
    tsconfigPath: "./tsconfig.next.json",
  },
};

export default nextConfig;
