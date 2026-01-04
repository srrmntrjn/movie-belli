"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Film, LogOut, User, Mail, CheckCircle, Search, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/50 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-900/50">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-purple-600 p-2">
              <Film className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              Movie Belli
            </span>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex items-center gap-2 rounded-full bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Welcome to Movie Belli!
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Your infrastructure is set up and authentication is working perfectly.
          </p>
        </div>

        {/* User Info Card */}
        <div className="rounded-2xl bg-white p-8 shadow-lg dark:bg-gray-800">
          <div className="flex items-start gap-6">
            {session.user?.image && (
              <Image
                src={session.user.image}
                alt={session.user.name || "User"}
                width={80}
                height={80}
                className="rounded-full"
              />
            )}
            <div className="flex-1">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                {session.user?.name}
              </h2>
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                  <Mail className="h-5 w-5" />
                  <span>{session.user?.email}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                  <User className="h-5 w-5" />
                  <span>User ID: {session.user?.id || "N/A"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h3 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
            Quick Actions
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              href="/search"
              className="flex items-center gap-4 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
            >
              <div className="rounded-full bg-white/20 p-3">
                <Search className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-semibold">Search Movies</h4>
                <p className="text-sm text-white/80">Find your next watch</p>
              </div>
            </Link>
            <Link
              href="/my-reviews"
              className="flex items-center gap-4 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 p-6 text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
            >
              <div className="rounded-full bg-white/20 p-3">
                <Star className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-semibold">My Reviews</h4>
                <p className="text-sm text-white/80">View your rated movies</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Infrastructure Status */}
        <div className="mt-8">
          <h3 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
            Infrastructure Status
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatusCard
              title="Database"
              status="Connected"
              description="Supabase PostgreSQL"
            />
            <StatusCard
              title="Authentication"
              status="Working"
              description="Google OAuth via NextAuth.js"
            />
            <StatusCard
              title="Session"
              status="Active"
              description="Database session strategy"
            />
            <StatusCard
              title="Prisma ORM"
              status="Ready"
              description="Schema deployed"
            />
            <StatusCard
              title="Next.js"
              status="Running"
              description="App Router with TypeScript"
            />
            <StatusCard
              title="Hosting"
              status="Vercel"
              description="Production ready"
            />
          </div>
        </div>

        {/* Next Steps */}
        <div className="mt-8 rounded-2xl bg-purple-50 p-8 dark:bg-purple-900/20">
          <h3 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
            Next Steps
          </h3>
          <ul className="space-y-2 text-gray-700 dark:text-gray-300">
            <li className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Set up TMDB API integration for movie data
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Build watchlist and watched features
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Implement ratings and reviews
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Add social features (friends and activity feed)
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}

function StatusCard({
  title,
  status,
  description,
}: {
  title: string;
  status: string;
  description: string;
}) {
  return (
    <div className="rounded-xl bg-white p-6 shadow dark:bg-gray-800">
      <div className="mb-2 flex items-center justify-between">
        <h4 className="font-semibold text-gray-900 dark:text-white">{title}</h4>
        <CheckCircle className="h-5 w-5 text-green-600" />
      </div>
      <p className="text-sm font-medium text-green-600">{status}</p>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
        {description}
      </p>
    </div>
  );
}
