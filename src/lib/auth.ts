import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";
import type { NextAuthConfig } from "next-auth";

const authSecret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;

// Validate required environment variables early so we fail fast with a clear message.
const requiredEnvVars = {
  AUTH_SECRET: authSecret,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  DATABASE_URL: process.env.DATABASE_URL,
};

const missingVars = Object.entries(requiredEnvVars)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0) {
  const message = `Missing required environment variables for authentication: ${missingVars.join(", ")}`;
  console.error(message);
  throw new Error(message);
}

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  logger: {
    error(code, metadata) {
      console.error(`[auth][error][${code}]`, metadata);
    },
    warn(code) {
      console.warn(`[auth][warn][${code}]`);
    },
    debug(code, metadata) {
      if (process.env.NODE_ENV !== "production") {
        console.debug(`[auth][debug][${code}]`, metadata);
      }
    },
  },
  debug: process.env.NODE_ENV !== "production",
  callbacks: {
    session: async ({ session, user }) => {
      if (session?.user) {
        session.user.id = user.id;
        session.user.username = user.username;
      }
      return session;
    },
  },
  pages: {
    signIn: "/",
  },
  session: {
    strategy: "database" as const,
  },
  trustHost: true, // Required for Vercel deployments
  secret: authSecret, // Explicitly set secret (supports AUTH_SECRET/NEXTAUTH_SECRET)
} satisfies NextAuthConfig;

// Initialize NextAuth
export const { handlers, auth, signIn, signOut } = NextAuth(authOptions);
