import path from "node:path";
import { defineConfig } from "vitest/config";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.test" });

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts"],
    globalSetup: ["./tests/unit/global-setup.ts"],
    setupFiles: ["./tests/unit/setup.ts"],
    fileParallelism: false,
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
});
