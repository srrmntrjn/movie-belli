"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import {
  Star,
  Lightbulb,
  Search,
} from "lucide-react";
import Link from "next/link";
import { ActivityFeedItem, type ActivityFeedEntry } from "@/components/feed/ActivityFeedItem";
import { MovieDetailModal } from "@/components/movie/MovieDetailModal";
import type { Movie } from "@/lib/tmdb";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [feedItems, setFeedItems] = useState<ActivityFeedEntry[]>([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  // Search movies as user types
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        searchMovies(searchQuery);
      } else {
        setSearchResults([]);
        setShowSearchDropdown(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const searchMovies = async (query: string) => {
    setSearchLoading(true);
    try {
      const response = await fetch(
        `/api/movies/search?query=${encodeURIComponent(query)}`
      );
      if (!response.ok) throw new Error("Failed to search");
      const data = await response.json();
      setSearchResults(data.results.slice(0, 6)); // Show top 6 results
      setShowSearchDropdown(true);
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // Close dropdown when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowSearchDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, []);

  useEffect(() => {
    if (status !== "authenticated") {
      return;
    }

    let isMounted = true;
    const loadFeed = async () => {
      setFeedLoading(true);
      setFeedError(null);
      try {
        const response = await fetch("/api/feed");
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data.error || "Unable to load activity feed");
        }
        if (isMounted) {
          setFeedItems(data.feed || []);
        }
      } catch (error) {
        console.error("Error loading activity feed:", error);
        if (isMounted) {
          setFeedError(
            error instanceof Error
              ? error.message
              : "Unable to load activity feed"
          );
        }
      } finally {
        if (isMounted) {
          setFeedLoading(false);
        }
      }
    };

    loadFeed();
    return () => {
      isMounted = false;
    };
  }, [status]);

  const handleMovieSelect = (movie: Movie) => {
    setSelectedMovie(movie);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedMovie(null);
  };

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

      {/* Main Content */}
      <main className="px-2 py-6 sm:px-4">
        <div className="mx-auto mb-10 max-w-3xl px-2 sm:px-4">
          <div ref={searchRef} className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for movies and tv shows"
              className="w-full rounded-full border border-gray-300 bg-white py-4 pl-12 pr-4 text-lg shadow-lg transition-all focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchQuery.trim()) {
                  router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
                }
              }}
            />
            {searchLoading && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-purple-600 border-t-transparent" />
              </div>
            )}

            {/* Search Results Dropdown */}
            {showSearchDropdown && searchResults.length > 0 && (
              <div className="absolute top-full mt-2 w-full rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-800">
                <div className="max-h-96 overflow-y-auto">
                  {searchResults.map((movie) => (
                    <button
                      key={movie.id}
                      onClick={() => {
                        setSelectedMovie(movie);
                        setIsModalOpen(true);
                        setShowSearchDropdown(false);
                        setSearchQuery("");
                      }}
                      className="flex w-full items-center gap-3 border-b border-gray-100 p-3 text-left transition hover:bg-purple-50/50 dark:border-gray-700 dark:hover:bg-purple-900/20"
                    >
                      <img
                        src={movie.poster_path ? `https://image.tmdb.org/t/p/w92${movie.poster_path}` : '/placeholder-movie.png'}
                        alt={movie.title}
                        className="h-16 w-12 rounded object-cover"
                      />
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {movie.title}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A'}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        {movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'}
                      </div>
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => {
                    router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
                    setShowSearchDropdown(false);
                  }}
                  className="w-full border-t border-gray-200 p-4 text-center text-sm font-semibold text-purple-600 transition hover:bg-purple-50/50 dark:border-gray-700 dark:text-purple-400 dark:hover:bg-purple-900/20"
                >
                  Show all results
                </button>
              </div>
            )}
          </div>
        </div>

        <section className="space-y-4">
          <div className="px-2 sm:px-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Live from your circle
            </h2>
          </div>
          {feedLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, index) => (
                <div
                  key={index}
                  className="h-24 w-full animate-pulse rounded-2xl bg-white/60 dark:bg-gray-800/60"
                />
              ))}
            </div>
          ) : feedError ? (
            <div className="w-full rounded-2xl bg-red-50 p-4 text-red-600 dark:bg-red-900/20 dark:text-red-300">
              {feedError}
            </div>
          ) : feedItems.length === 0 ? (
            <div className="w-full rounded-2xl bg-purple-50 p-6 text-center shadow-inner dark:bg-purple-900/20">
              <p className="text-gray-600 dark:text-gray-300">
                Follow users to see their activity here.
              </p>
              <Link
                href="/people"
                className="mt-4 inline-flex items-center justify-center rounded-full bg-purple-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-purple-700"
              >
                Find users to follow
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {feedItems.map((entry) => (
                <ActivityFeedItem
                  key={entry.id}
                  entry={entry}
                  onSelectMovie={handleMovieSelect}
                />
              ))}
            </div>
          )}
        </section>
      </main>
      <MovieDetailModal
        movie={selectedMovie}
        isOpen={isModalOpen}
        onClose={closeModal}
      />
    </div>
  );
}

