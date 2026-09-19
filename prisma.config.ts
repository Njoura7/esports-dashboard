// Prisma 7's CLI no longer auto-loads .env files (that's now on us to do explicitly).
// @next/env replicates Next.js's own .env / .env.local / .env.development(.local) layering,
// so `prisma db push` etc. see the same DATABASE_URL the app itself would at runtime.
import { loadEnvConfig } from "@next/env";
import { defineConfig, env } from "prisma/config";

loadEnvConfig(process.cwd());

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL"),
  },
});
