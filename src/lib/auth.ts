import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";
import type { NextAuthConfig } from "next-auth";

// Validate required environment variables
const requiredEnvVars = {
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
};

const missingVars = Object.entries(requiredEnvVars)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0 && process.env.NODE_ENV === "production") {
  console.error(`Missing required environment variables: ${missingVars.join(", ")}`);
}

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  callbacks: {
    session: async ({ session, user }) => {
      if (session?.user) {
        session.user.id = user.id;
        // @ts-expect-error - Add custom user fields
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
  secret: process.env.NEXTAUTH_SECRET, // Explicitly set secret
} satisfies NextAuthConfig;

// Initialize NextAuth
export const { handlers, auth, signIn, signOut } = NextAuth(authOptions);
