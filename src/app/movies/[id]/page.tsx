"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Calendar, Star, ArrowLeft, Loader2, Plus, Bookmark, Check } from "lucide-react";
import { type MovieDetails } from "@/lib/tmdb";
import { RankingModal } from "@/components/movie/RankingModal";

export default function MovieDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const movieId = useMemo(() => {
    const paramId = params?.id;
    let resolved = "";
    if (paramId) {
      resolved = Array.isArray(paramId) ? paramId[0] ?? "" : paramId;
    }
    return resolved;
  }, [params]);
  const numericMovieId =
    movieId && !Number.isNaN(Number(movieId)) ? parseInt(movieId, 10) : null;

  const [movie, setMovie] = useState<MovieDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [isWatched, setIsWatched] = useState(false);
  const [showRankingModal, setShowRankingModal] = useState(false);

  useEffect(() => {
    if (!movieId) {
      setError("Movie not found");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    const fetchMovie = async () => {
      try {
        const response = await fetch(`/api/movies/${movieId}`);
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch movie");
        }

        setMovie(data);
      } catch (err) {
        setError("Failed to load movie details");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    const fetchMovieStatus = async () => {
      try {
        const response = await fetch("/api/users/me/movie-status");
        if (response.ok && numericMovieId !== null) {
          const data = await response.json();
          setIsInWatchlist(data.watchlist.includes(numericMovieId));
          setIsWatched(data.watched.includes(numericMovieId));
        }
      } catch (error) {
        console.error("Error fetching movie status:", error);
      }
    };

    fetchMovie();
    fetchMovieStatus();
  }, [movieId, numericMovieId]);

  const handleAddToWatchlist = async () => {
    if (!numericMovieId) return;
    try {
      const response = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tmdbId: numericMovieId }),
      });

      if (response.ok) {
        setIsInWatchlist(true);
      }
    } catch (error) {
      console.error("Error adding to watchlist:", error);
    }
  };

  const handleRemoveFromWatchlist = async () => {
    if (!numericMovieId) return;
    try {
      const response = await fetch(`/api/watchlist?tmdbId=${numericMovieId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setIsInWatchlist(false);
      }
    } catch (error) {
      console.error("Error removing from watchlist:", error);
    }
  };

  const handleRankingComplete = async () => {
    setShowRankingModal(false);
    // Refresh status
    try {
      const response = await fetch("/api/users/me/movie-status");
      if (response.ok && numericMovieId !== null) {
        const data = await response.json();
        setIsInWatchlist(data.watchlist.includes(numericMovieId));
        setIsWatched(data.watched.includes(numericMovieId));
      }
    } catch (error) {
      console.error("Error refreshing movie status:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">{error || "Movie not found"}</p>
          <button
            onClick={() => router.back()}
            className="mt-4 text-purple-600 hover:text-purple-700 dark:text-purple-400"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  const posterUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : null;

  const backdropUrl = movie.backdrop_path
    ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`
    : null;
  const bannerUrl =
    backdropUrl ||
    (movie.poster_path
      ? `https://image.tmdb.org/t/p/w780${movie.poster_path}`
      : null);

  const releaseYear = movie.release_date
    ? new Date(movie.release_date).getFullYear()
    : "N/A";

  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : "N/A";
  const contentOffsetClass = bannerUrl ? "-mt-24" : "mt-10";

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 pb-24 dark:from-gray-900 dark:to-gray-800">
      <main>
        {/* Back Button */}
        <div className="mx-auto max-w-4xl px-4 py-4">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-gray-700 transition hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
            Back
          </button>
        </div>

        {/* Backdrop / Banner */}
        {bannerUrl ? (
          <div className="relative h-64 overflow-hidden sm:h-96">
            <Image
              src={bannerUrl}
              alt={`${movie.title} banner`}
              fill
              className="object-cover"
              sizes="100vw"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-purple-50 via-purple-50/30 to-transparent dark:from-gray-900 dark:via-gray-900/60" />
          </div>
        ) : (
          <div className="h-32 bg-gradient-to-r from-purple-200 via-pink-100 to-blue-200 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800" />
        )}

        {/* Content */}
        <div className="mx-auto max-w-4xl px-4">
          <div className={`${contentOffsetClass} relative`}>
            <div className="flex flex-col gap-6 lg:flex-row">
            {/* Poster */}
            {posterUrl && (
              <div className="relative h-72 w-48 flex-shrink-0 overflow-hidden rounded-lg shadow-2xl self-center lg:self-start">
                <Image
                  src={posterUrl}
                  alt={movie.title}
                  fill
                  className="object-cover"
                  sizes="192px"
                />
              </div>
            )}

            {/* Info */}
            <div className="flex-1 pt-10 text-center lg:pt-20 lg:text-left">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                {movie.title}
              </h1>

              <div className="mt-3 flex flex-wrap items-center justify-center gap-4 text-gray-600 dark:text-gray-400 lg:justify-start">
                <div className="flex items-center gap-1">
                  <Calendar className="h-5 w-5" />
                  <span>{releaseYear}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{rating}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
                {/* Rank/Watched Button */}
                {isWatched ? (
                  <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-gray-900 shadow-md dark:bg-gray-800 dark:text-white">
                    <Check className="h-5 w-5" />
                    <span className="font-medium">Watched</span>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowRankingModal(true)}
                    className="flex items-center gap-2 rounded-full bg-purple-600 px-4 py-2 text-white shadow-md transition hover:bg-purple-700"
                  >
                    <Plus className="h-5 w-5" />
                    <span className="font-medium">Rank</span>
                  </button>
                )}

                {/* Watchlist Button */}
                {!isWatched && (
                  <button
                    onClick={isInWatchlist ? handleRemoveFromWatchlist : handleAddToWatchlist}
                    className={`flex items-center gap-2 rounded-full px-4 py-2 shadow-md transition ${
                      isInWatchlist
                        ? "bg-purple-600 text-white hover:bg-purple-700"
                        : "bg-white text-gray-900 hover:bg-gray-100 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
                    }`}
                  >
                    <Bookmark className={`h-5 w-5 ${isInWatchlist ? "fill-current" : ""}`} />
                    <span className="font-medium">
                      {isInWatchlist ? "In Watchlist" : "Add to Watchlist"}
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Overview */}
          {movie.overview && (
            <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800/60">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Overview</h2>
              <p className="mt-3 text-gray-700 dark:text-gray-300">{movie.overview}</p>
            </div>
          )}

          {/* Additional Details */}
          <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800/60">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Details</h2>
            <div className="mt-4 grid gap-3">
              {movie.genres && movie.genres.length > 0 && (
                <div>
                  <span className="font-medium text-gray-600 dark:text-gray-400">Genres: </span>
                  <span className="text-gray-900 dark:text-white">
                    {movie.genres.map((genre) => genre.name).join(", ")}
                  </span>
                </div>
              )}
              {movie.runtime && (
                <div>
                  <span className="font-medium text-gray-600 dark:text-gray-400">Runtime: </span>
                  <span className="text-gray-900 dark:text-white">{movie.runtime} minutes</span>
                </div>
              )}
              {movie.release_date && (
                <div>
                  <span className="font-medium text-gray-600 dark:text-gray-400">Release Date: </span>
                  <span className="text-gray-900 dark:text-white">
                    {new Date(movie.release_date).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      </main>

      {/* Ranking Modal */}
      {movie && (
        <RankingModal
          movie={movie}
          isOpen={showRankingModal}
          onClose={handleRankingComplete}
        />
      )}
    </div>
  );
}
