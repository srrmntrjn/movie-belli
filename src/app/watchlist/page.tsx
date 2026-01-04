"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Film, Loader2, Trash2 } from "lucide-react";
import { MovieCard } from "@/components/movie/MovieCard";
import { MovieDetailModal } from "@/components/movie/MovieDetailModal";
import { Movie } from "@/lib/tmdb";

interface WatchlistEntry {
  id: string;
  tmdbId: number;
  addedAt: string;
  movie: Movie | null;
}

export default function WatchlistPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [watchlist, setWatchlist] = useState<WatchlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const visibleEntries = watchlist.filter((entry) => entry.movie);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      void fetchWatchlist();
    }
  }, [status]);

  const fetchWatchlist = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/watchlist");
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch watchlist");
      }

      setWatchlist(data.items || []);
    } catch (err) {
      console.error("Error fetching watchlist:", err);
      setError("Failed to load your watchlist. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleMovieClick = (movie: Movie) => {
    setSelectedMovie(movie);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedMovie(null);
  };

  const handleRemove = async (tmdbId: number) => {
    setRemovingId(tmdbId);
    setError(null);

    try {
      const response = await fetch("/api/watchlist", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tmdbId }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Failed to remove from watchlist");
      }

      setWatchlist((prev) => prev.filter((entry) => entry.tmdbId !== tmdbId));
    } catch (err) {
      console.error("Error removing from watchlist:", err);
      setError("Failed to remove that movie. Please try again.");
    } finally {
      setRemovingId(null);
    }
  };

  if (status === "loading" || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            My Watchlist
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {watchlist.length > 0
              ? `You have ${watchlist.length} movie${watchlist.length !== 1 ? "s" : ""} saved`
              : "You haven't saved any movies yet"}
          </p>
        </div>

        {error && (
          <div className="mb-8 rounded-lg bg-red-50 p-4 text-red-700 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          </div>
        )}

        {!loading && visibleEntries.length > 0 && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {visibleEntries.map((entry) =>
              entry.movie ? (
                <MovieCard
                  key={entry.id}
                  movie={entry.movie}
                  onSelect={handleMovieClick}
                  action={{
                    label: removingId === entry.tmdbId ? "Removing..." : "Remove",
                    onClick: () => handleRemove(entry.tmdbId),
                    disabled: removingId === entry.tmdbId,
                    icon:
                      removingId === entry.tmdbId ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      ),
                    variant: "danger",
                  }}
                />
              ) : null
            )}
          </div>
        )}

        {!loading && !error && visibleEntries.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Film className="mb-4 h-16 w-16 text-gray-300 dark:text-gray-600" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Your watchlist is empty
            </h3>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Start searching for movies to add them to your list
            </p>
            <button
              onClick={() => router.push("/search")}
              className="mt-4 rounded-full bg-purple-600 px-6 py-3 text-base font-medium text-white shadow-lg transition-all hover:bg-purple-700 hover:shadow-xl"
            >
              Search Movies
            </button>
          </div>
        )}

        <MovieDetailModal
          movie={selectedMovie}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      </div>
    </div>
  );
}
