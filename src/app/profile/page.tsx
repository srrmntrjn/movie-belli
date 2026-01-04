"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Star, Users, List, LogOut, Lightbulb } from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
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
      <header className="sticky top-0 z-50 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <span className="text-xl font-bold text-gray-900 dark:text-white">
            tivi
          </span>
          <Link
            href="/feedback"
            className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm font-medium text-gray-700 backdrop-blur-sm transition-colors hover:bg-white dark:bg-gray-800/80 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <Lightbulb className="h-4 w-4" />
            Feedback
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8">
        {/* User Info */}
        <div className="mb-8 rounded-3xl border border-gray-200 bg-white/80 p-6 shadow-lg backdrop-blur-sm dark:border-gray-700 dark:bg-gray-800/60">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-blue-600 text-2xl font-bold text-white">
              {session.user?.email?.[0].toUpperCase() || "U"}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {session.user?.email}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                ID: {session.user?.id || "N/A"}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Options */}
        <div className="space-y-4">
          <h2 className="px-2 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Your Content
          </h2>

          <Link
            href="/my-reviews"
            className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white/80 p-5 shadow-md backdrop-blur-sm transition hover:scale-[1.02] hover:shadow-lg dark:border-gray-700 dark:bg-gray-800/60"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-purple-600">
              <Star className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                My Reviews
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                View your ranked movies and ratings
              </p>
            </div>
          </Link>

          <Link
            href="/following"
            className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white/80 p-5 shadow-md backdrop-blur-sm transition hover:scale-[1.02] hover:shadow-lg dark:border-gray-700 dark:bg-gray-800/60"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-sky-500">
              <Users className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Following
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                People you follow and their activity
              </p>
            </div>
          </Link>

          <Link
            href="/watchlist"
            className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white/80 p-5 shadow-md backdrop-blur-sm transition hover:scale-[1.02] hover:shadow-lg dark:border-gray-700 dark:bg-gray-800/60"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-500">
              <List className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Watchlist
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Movies you want to watch
              </p>
            </div>
          </Link>
        </div>

        {/* Sign Out */}
        <div className="mt-8 space-y-4">
          <h2 className="px-2 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Account
          </h2>

          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex w-full items-center gap-4 rounded-2xl border border-red-200 bg-red-50/80 p-5 shadow-md backdrop-blur-sm transition hover:scale-[1.02] hover:bg-red-100/80 hover:shadow-lg dark:border-red-900/50 dark:bg-red-900/20 dark:hover:bg-red-900/30"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40">
              <LogOut className="h-7 w-7 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="text-lg font-semibold text-red-900 dark:text-red-300">
                Sign Out
              </h3>
              <p className="text-sm text-red-700 dark:text-red-400">
                Log out of your account
              </p>
            </div>
          </button>
        </div>
      </main>
    </div>
  );
}
