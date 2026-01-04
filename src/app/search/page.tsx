"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, Loader2, ArrowLeft } from "lucide-react";
import { MovieCard } from "@/components/movie/MovieCard";
import { Movie } from "@/lib/tmdb";
import Link from "next/link";
import Image from "next/image";

interface User {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
  bio: string | null;
  isFollowing: boolean;
}

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"movies" | "users">("movies");

  // Movie state
  const [movies, setMovies] = useState<Movie[]>([]);
  const [moviesLoading, setMoviesLoading] = useState(false);
  const [moviesError, setMoviesError] = useState<string | null>(null);
  const [totalMovieResults, setTotalMovieResults] = useState(0);

  // User state
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [followingStates, setFollowingStates] = useState<Record<string, boolean>>({});

  // Movie status tracking
  const [watchlistIds, setWatchlistIds] = useState<Set<number>>(new Set());
  const [watchedIds, setWatchedIds] = useState<Set<number>>(new Set());

  // Initialize query from URL parameter
  useEffect(() => {
    const urlQuery = searchParams.get('q');
    if (urlQuery) {
      setQuery(urlQuery);
    }
  }, [searchParams]);

  // Fetch user's watchlist and watched status
  useEffect(() => {
    const fetchMovieStatus = async () => {
      try {
        const response = await fetch("/api/users/me/movie-status");
        if (response.ok) {
          const data = await response.json();
          setWatchlistIds(new Set(data.watchlist));
          setWatchedIds(new Set(data.watched));
        }
      } catch (error) {
        console.error("Error fetching movie status:", error);
      }
    };

    fetchMovieStatus();
  }, []);

  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
      if (query.trim()) {
        if (activeTab === "movies") {
          searchMovies(query);
        } else {
          searchUsers(query);
        }
      } else {
        setMovies([]);
        setUsers([]);
        setTotalMovieResults(0);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [query, activeTab]);

  const searchMovies = async (searchQuery: string) => {
    setMoviesLoading(true);
    setMoviesError(null);

    try {
      const response = await fetch(
        `/api/movies/search?query=${encodeURIComponent(searchQuery)}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch movies");
      }

      const data = await response.json();
      setMovies(data.results);
      setTotalMovieResults(data.total_results);
    } catch (err) {
      setMoviesError("Failed to search movies. Please try again.");
      console.error("Search error:", err);
    } finally {
      setMoviesLoading(false);
    }
  };

  const searchUsers = async (searchQuery: string) => {
    setUsersLoading(true);
    setUsersError(null);

    try {
      const response = await fetch(
        `/api/users/search?q=${encodeURIComponent(searchQuery)}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }

      const data = await response.json();
      setUsers(data.users);

      // Initialize following states
      const states: Record<string, boolean> = {};
      data.users.forEach((user: User) => {
        states[user.id] = user.isFollowing;
      });
      setFollowingStates(states);
    } catch (err) {
      setUsersError("Failed to search users. Please try again.");
      console.error("Search error:", err);
    } finally {
      setUsersLoading(false);
    }
  };

  const handleFollowToggle = async (userId: string) => {
    const isCurrentlyFollowing = followingStates[userId];

    try {
      const response = await fetch("/api/follows", {
        method: isCurrentlyFollowing ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        setFollowingStates((prev) => ({
          ...prev,
          [userId]: !isCurrentlyFollowing,
        }));
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
    }
  };


  const handleAddToWatchlist = async (movie: Movie) => {
    try {
      const response = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tmdbId: movie.id }),
      });

      if (response.ok) {
        // Update local state
        setWatchlistIds((prev) => new Set(prev).add(movie.id));
        console.log("Added to watchlist");
      } else if (response.status === 409) {
        console.log("Movie already in watchlist");
      } else {
        const data = await response.json();
        console.error("Failed to add to watchlist:", data.error);
      }
    } catch (error) {
      console.error("Error adding to watchlist:", error);
    }
  };

  const handleRemoveFromWatchlist = async (movie: Movie) => {
    try {
      const response = await fetch(`/api/watchlist?tmdbId=${movie.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        // Update local state
        setWatchlistIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(movie.id);
          return newSet;
        });
        console.log("Removed from watchlist");
      } else {
        const data = await response.json();
        console.error("Failed to remove from watchlist:", data.error);
      }
    } catch (error) {
      console.error("Error removing from watchlist:", error);
    }
  };

  const loading = activeTab === "movies" ? moviesLoading : usersLoading;
  const error = activeTab === "movies" ? moviesError : usersError;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm font-medium text-gray-700 shadow-md backdrop-blur-sm transition-all hover:bg-white hover:shadow-lg dark:bg-gray-800/80 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            Search
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Find movies and users
          </p>
        </div>

        {/* Search Input */}
        <div className="relative mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for movies or users..."
              className="w-full rounded-full border border-gray-300 bg-white py-3 pl-12 pr-4 text-lg shadow-lg transition-all focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
            />
            {loading && (
              <Loader2 className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin text-purple-600" />
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab("movies")}
            className={`px-4 py-2 text-sm font-medium transition ${
              activeTab === "movies"
                ? "border-b-2 border-purple-600 text-purple-600 dark:text-purple-400"
                : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            Movies
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`px-4 py-2 text-sm font-medium transition ${
              activeTab === "users"
                ? "border-b-2 border-purple-600 text-purple-600 dark:text-purple-400"
                : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            Users
          </button>
        </div>

        {/* Results Count */}
        {query && !loading && activeTab === "movies" && (
          <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
            {totalMovieResults > 0
              ? `Found ${totalMovieResults} result${totalMovieResults !== 1 ? "s" : ""}`
              : "No results found"}
          </div>
        )}

        {query && !loading && activeTab === "users" && (
          <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
            {users.length > 0
              ? `Found ${users.length} user${users.length !== 1 ? "s" : ""}`
              : "No users found"}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-8 rounded-lg bg-red-50 p-4 text-red-700 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          </div>
        )}

        {/* Movie Results */}
        {!loading && activeTab === "movies" && movies.length > 0 && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {movies.map((movie) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                onAddToWatchlist={handleAddToWatchlist}
                onRemoveFromWatchlist={handleRemoveFromWatchlist}
                showActions={true}
                isInWatchlist={watchlistIds.has(movie.id)}
                isWatched={watchedIds.has(movie.id)}
              />
            ))}
          </div>
        )}

        {/* User Results */}
        {!loading && activeTab === "users" && users.length > 0 && (
          <div className="mx-auto max-w-2xl">
            <div className="divide-y divide-gray-200 rounded-2xl border border-gray-200 bg-white dark:divide-gray-700 dark:border-gray-700 dark:bg-gray-800/60">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between px-4 py-4"
                >
                  {/* User Info */}
                  <Link
                    href={`/users/${user.id}`}
                    className="flex items-center gap-3 flex-1"
                  >
                    {/* Profile Image */}
                    {user.image ? (
                      <Image
                        src={user.image}
                        alt={user.name || "User"}
                        width={48}
                        height={48}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-blue-600 text-lg font-bold text-white">
                        {(user.name || "U")[0].toUpperCase()}
                      </div>
                    )}

                    {/* Name */}
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {user.name || "Unknown User"}
                      </p>
                      {user.username && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          @{user.username}
                        </p>
                      )}
                    </div>
                  </Link>

                  {/* Follow/Following Button */}
                  {followingStates[user.id] ? (
                    <button
                      onClick={() => handleFollowToggle(user.id)}
                      className="text-sm font-medium text-gray-600 transition hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      Following
                    </button>
                  ) : (
                    <button
                      onClick={() => handleFollowToggle(user.id)}
                      className="rounded-full bg-purple-600 px-6 py-2 text-sm font-medium text-white transition hover:bg-purple-700"
                    >
                      Follow
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State - Movies */}
        {!loading && !error && query && activeTab === "movies" && movies.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Search className="mb-4 h-16 w-16 text-gray-300 dark:text-gray-600" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              No movies found
            </h3>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Try searching with a different title
            </p>
          </div>
        )}

        {/* Empty State - Users */}
        {!loading && !error && query && activeTab === "users" && users.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Search className="mb-4 h-16 w-16 text-gray-300 dark:text-gray-600" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              No users found
            </h3>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Try searching with a different name or username
            </p>
          </div>
        )}

        {/* Initial State */}
        {!loading && !query && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Search className="mb-4 h-16 w-16 text-gray-300 dark:text-gray-600" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Start searching
            </h3>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Enter a {activeTab === "movies" ? "movie title" : "name or username"} to find what you&apos;re looking for
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
