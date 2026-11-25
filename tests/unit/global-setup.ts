import { execSync } from "node:child_process";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.test" });

/** Applies committed migrations to the test database once before the suite runs. */
export default function globalSetup() {
  execSync("pnpm exec prisma migrate deploy", {
    stdio: "inherit",
    env: process.env,
  });
}
