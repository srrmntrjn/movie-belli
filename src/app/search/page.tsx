"use client";

import { useState, useEffect } from "react";
import { Search, Loader2 } from "lucide-react";
import { MovieCard } from "@/components/movie/MovieCard";
import { Movie } from "@/lib/tmdb";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalResults, setTotalResults] = useState(0);

  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
      if (query.trim()) {
        searchMovies(query);
      } else {
        setMovies([]);
        setTotalResults(0);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [query]);

  const searchMovies = async (searchQuery: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/movies/search?query=${encodeURIComponent(searchQuery)}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch movies");
      }

      const data = await response.json();
      setMovies(data.results);
      setTotalResults(data.total_results);
    } catch (err) {
      setError("Failed to search movies. Please try again.");
      console.error("Search error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            Search Movies
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Find your next favorite movie
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
              placeholder="Search for a movie..."
              className="w-full rounded-full border border-gray-300 bg-white py-4 pl-12 pr-4 text-lg shadow-lg transition-all focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
            />
            {loading && (
              <Loader2 className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin text-purple-600" />
            )}
          </div>
        </div>

        {/* Results Count */}
        {query && !loading && (
          <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
            {totalResults > 0
              ? `Found ${totalResults} result${totalResults !== 1 ? "s" : ""}`
              : "No results found"}
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

        {/* Search Results */}
        {!loading && movies.length > 0 && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {movies.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && query && movies.length === 0 && (
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

        {/* Initial State */}
        {!loading && !query && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Search className="mb-4 h-16 w-16 text-gray-300 dark:text-gray-600" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Start searching
            </h3>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Enter a movie title to find what you're looking for
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
