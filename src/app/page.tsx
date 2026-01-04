"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { Film, LogOut, Search } from "lucide-react";
import Link from "next/link";

export default function Home() {
  const { data: session, status } = useSession();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <main className="flex flex-col items-center gap-8 px-4 text-center">
        {/* Logo and branding */}
        <div className="flex flex-col items-center gap-4">
          <div className="rounded-2xl bg-purple-600 p-4">
            <Film className="h-16 w-16 text-white" />
          </div>
          <h1 className="text-5xl font-bold tracking-tight text-gray-900 dark:text-white">
            Movie Belli
          </h1>
          <p className="max-w-md text-lg text-gray-600 dark:text-gray-300">
            Track, share, and discover movies with your friends
          </p>
        </div>

        {/* Authentication status */}
        {status === "loading" ? (
          <div className="text-gray-600 dark:text-gray-400">Loading...</div>
        ) : session ? (
          <div className="flex flex-col items-center gap-4">
            <div className="rounded-lg bg-white px-6 py-4 shadow-md dark:bg-gray-800">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Signed in as
              </p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {session.user?.email}
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="/dashboard"
                className="rounded-full bg-purple-600 px-8 py-3 text-base font-medium text-white shadow-lg transition-all hover:bg-purple-700 hover:shadow-xl"
              >
                Go to Dashboard
              </Link>
              <Link
                href="/search"
                className="flex items-center gap-2 rounded-full bg-blue-600 px-8 py-3 text-base font-medium text-white shadow-lg transition-all hover:bg-blue-700 hover:shadow-xl"
              >
                <Search className="h-4 w-4" />
                Search Movies
              </Link>
              <button
                onClick={() => signOut()}
                className="flex items-center gap-2 rounded-full bg-gray-200 px-6 py-3 text-base font-medium text-gray-700 transition-all hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
            className="flex items-center gap-3 rounded-full bg-white px-8 py-4 text-base font-medium text-gray-900 shadow-lg transition-all hover:scale-105 hover:shadow-xl"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Sign in with Google
          </button>
        )}

        {/* Features */}
        <div className="mt-12 grid max-w-2xl gap-6 sm:grid-cols-3">
          <div className="flex flex-col items-center gap-2">
            <div className="rounded-full bg-purple-100 p-3 dark:bg-purple-900">
              <svg
                className="h-6 w-6 text-purple-600 dark:text-purple-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Track
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Your watchlist and watched movies
            </p>
          </div>

          <div className="flex flex-col items-center gap-2">
            <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900">
              <svg
                className="h-6 w-6 text-blue-600 dark:text-blue-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Share
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              See what your friends are watching
            </p>
          </div>

          <div className="flex flex-col items-center gap-2">
            <div className="rounded-full bg-pink-100 p-3 dark:bg-pink-900">
              <svg
                className="h-6 w-6 text-pink-600 dark:text-pink-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Discover
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Find your next favorite movie
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
