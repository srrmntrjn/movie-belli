import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getPrismaClient(): PrismaClient {
  // Use DIRECT_URL for Prisma client (avoids pgbouncer adapter requirement)
  const databaseUrl = process.env.DIRECT_URL || process.env.DATABASE_URL?.replace(/[?&]pgbouncer=true/g, "");
  
  // Temporarily override DATABASE_URL if needed
  const originalDatabaseUrl = process.env.DATABASE_URL;
  if (databaseUrl && databaseUrl !== originalDatabaseUrl && !databaseUrl.includes("pgbouncer")) {
    process.env.DATABASE_URL = databaseUrl;
  }

  const client = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

  // Restore original if changed
  if (originalDatabaseUrl && process.env.DATABASE_URL !== originalDatabaseUrl) {
    process.env.DATABASE_URL = originalDatabaseUrl;
  }

  return client;
}

export const prisma = globalForPrisma.prisma ?? getPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
