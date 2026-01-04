import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Prisma reads DATABASE_URL from environment automatically
// Prefer a true direct connection if one exists, otherwise keep whatever URL was provided
const setupDatabaseUrl = () => {
  const directUrl = process.env.DIRECT_URL;
  const databaseUrl = process.env.DATABASE_URL;

  // Prefer non-pooled direct connections for Prisma (better for prepared statements)
  if (directUrl && !directUrl.includes("pooler")) {
    process.env.DATABASE_URL = directUrl;
    return;
  }

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required for Prisma");
  }

  // Leave pooled URLs (with ?pgbouncer=true) untouched so Prisma can disable prepared statements itself
  process.env.DATABASE_URL = databaseUrl;
};

// Set up DATABASE_URL before PrismaClient initialization
setupDatabaseUrl();

// Initialize Prisma Client with error handling
let prisma: PrismaClient;

if (process.env.NODE_ENV === "production") {
  prisma = globalForPrisma.prisma ?? new PrismaClient({
    log: ["error"],
  });
} else {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient({
      log: ["query", "error", "warn"],
    });
  }
  prisma = globalForPrisma.prisma;
}

export { prisma };
