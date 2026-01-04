import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";
import type { NextRequest } from "next/server";

// Initialize NextAuth handlers with error handling
let GET: (req: NextRequest, context: { params: Promise<{ nextauth: string[] }> }) => Promise<Response>;
let POST: (req: NextRequest, context: { params: Promise<{ nextauth: string[] }> }) => Promise<Response>;

try {
  const { handlers } = NextAuth(authOptions);
  GET = handlers.GET;
  POST = handlers.POST;
} catch (error) {
  console.error("Failed to initialize NextAuth:", error);
  // Create fallback handlers that provide useful error messages
  const errorHandler = async () => {
    return new Response(
      JSON.stringify({ 
        error: "Authentication service unavailable",
        message: error instanceof Error ? error.message : "Unknown error",
        hint: "Check environment variables: NEXTAUTH_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, DATABASE_URL"
      }),
      { 
        status: 503,
        headers: { "Content-Type": "application/json" }
      }
    );
  };
  GET = errorHandler;
  POST = errorHandler;
}

export { GET, POST };
