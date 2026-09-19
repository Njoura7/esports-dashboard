// Prisma 7's CLI no longer auto-loads .env files (that's now on us to do explicitly).
// @next/env replicates Next.js's own .env / .env.local / .env.development(.local) layering,
// so `prisma db push` etc. see the same DATABASE_URL the app itself would at runtime.
import { loadEnvConfig } from "@next/env";
import { defineConfig } from "prisma/config";

loadEnvConfig(process.cwd());

// `datasource` is only required for db push/migrate, not for `generate` — and `generate` is
// what runs in Vercel's postinstall, before the Storage integration's vars are necessarily
// resolvable in that shell. Don't make `generate` fail over a URL it never actually uses.
const databaseUrl = process.env.DATABASE_URL;

export default defineConfig({
  schema: "prisma/schema.prisma",
  ...(databaseUrl ? { datasource: { url: databaseUrl } } : {}),
});
