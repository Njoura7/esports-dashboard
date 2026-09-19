import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

let prodClient: PrismaClient | undefined;

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Add your Neon connection string to .env.local (see .env.example).",
    );
  }
  const adapter = new PrismaNeon({ connectionString });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

// Built lazily, on first real use — never at module import time. Next.js imports this
// module during the build's page-data-collection step, and on Vercel that runs before
// "Sensitive" environment variables are injected (they're withheld from the build step
// on purpose, only available at runtime) — constructing eagerly crashed the build even
// though DATABASE_URL is genuinely configured and present once the app is actually running.
export function getPrisma(): PrismaClient {
  if (process.env.NODE_ENV === "production") {
    return (prodClient ??= createPrismaClient());
  }
  // Dev-mode hot reload re-executes this module on every file save without restarting the
  // process, so cache on globalThis there or every edit leaks another DB connection.
  return (globalForPrisma.prisma ??= createPrismaClient());
}
