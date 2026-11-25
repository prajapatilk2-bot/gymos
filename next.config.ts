import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Cache Components / PPR assume most routes are static-shell-able.
  // Almost every GymOS route sits behind an authenticated, per-request
  // session check (src/server/auth/session.ts), so the app is dynamic by
  // nature — keep plain dynamic rendering instead of fighting that.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
