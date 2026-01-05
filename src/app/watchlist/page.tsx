"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, List, Loader2 } from "lucide-react";
import Link from "next/link";
import type { Movie } from "@/lib/tmdb";
import { MovieCard } from "@/components/movie/MovieCard";

export default function WatchlistPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [watchlist, setWatchlist] = useState<
    { id: string; addedAt: string; movie: Movie }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  useEffect(() => {
    const fetchWatchlist = async () => {
      if (status !== "authenticated") return;

      try {
        setLoading(true);
        setError(null);
        const response = await fetch("/api/watchlist");
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.error || "Failed to load watchlist");
        }

        setWatchlist(data.watchlist ?? []);
      } catch (err) {
        console.error("Error loading watchlist:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load watchlist"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchWatchlist();
  }, [status]);

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
      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm font-medium text-gray-700 shadow-md backdrop-blur-sm transition-all hover:bg-white hover:shadow-lg dark:bg-gray-800/80 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 p-3">
              <List className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                Watchlist
              </h1>
              <p className="mt-1 text-gray-600 dark:text-gray-400">
                Movies you want to watch
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          </div>
        ) : watchlist.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-gray-200 bg-white/80 p-12 text-center backdrop-blur-sm dark:border-gray-700 dark:bg-gray-800/60">
            <div className="rounded-full bg-gradient-to-br from-blue-100 to-cyan-100 p-6 dark:from-blue-900/30 dark:to-cyan-900/30">
              <List className="h-16 w-16 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="mt-6 text-2xl font-bold text-gray-900 dark:text-white">
              Your watchlist is empty
            </h3>
            <p className="mt-2 max-w-md text-gray-600 dark:text-gray-400">
              Start adding movies you want to watch. Search for movies and add them to your
              watchlist to keep track of what you&apos;d like to see.
            </p>
            <Link
              href="/search"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 px-6 py-3 font-semibold text-white shadow-lg transition hover:scale-105 hover:shadow-xl"
            >
              Browse Movies
            </Link>
          </div>
        ) : (
          <div>
            <div className="mb-6 rounded-2xl border border-gray-200 bg-white/60 px-4 py-3 text-sm text-gray-600 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-300">
              {watchlist.length} movie{watchlist.length !== 1 ? "s" : ""} in your list
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {watchlist.map((item) => (
                <MovieCard key={item.id} movie={item.movie} />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
