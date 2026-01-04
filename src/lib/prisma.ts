import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Prisma 7.2.0 reads DATABASE_URL from environment automatically
// Ensure we use DIRECT_URL if available (without pooler), otherwise clean DATABASE_URL
const setupDatabaseUrl = () => {
  const directUrl = process.env.DIRECT_URL;
  const databaseUrl = process.env.DATABASE_URL?.replace(/[?&]pgbouncer=true/g, "") || "";
  
  // If DIRECT_URL doesn't have pooler, use it for DATABASE_URL
  if (directUrl && !directUrl.includes("pooler")) {
    process.env.DATABASE_URL = directUrl;
    return;
  }
  
  // Otherwise use cleaned DATABASE_URL
  if (databaseUrl && databaseUrl !== process.env.DATABASE_URL) {
    process.env.DATABASE_URL = databaseUrl;
  }
};

// Set up DATABASE_URL before PrismaClient initialization
setupDatabaseUrl();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
