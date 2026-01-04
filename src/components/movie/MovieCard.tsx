"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Star, Calendar, Plus, Bookmark, Check } from "lucide-react";
import type { KeyboardEvent, MouseEvent } from "react";
import { Movie } from "@/lib/tmdb";

interface MovieCardProps {
  movie: Movie;
  onAddToWatched?: (movie: Movie) => void;
  onAddToWatchlist?: (movie: Movie) => void;
  onRemoveFromWatchlist?: (movie: Movie) => void;
  showActions?: boolean;
  isInWatchlist?: boolean;
  isWatched?: boolean;
}

export function MovieCard({
  movie,
  onAddToWatched,
  onAddToWatchlist,
  onRemoveFromWatchlist,
  showActions = false,
  isInWatchlist = false,
  isWatched = false,
}: MovieCardProps) {
  const router = useRouter();
  const posterUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : "/placeholder-movie.png";

  const releaseYear = movie.release_date
    ? new Date(movie.release_date).getFullYear()
    : "N/A";

  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : "N/A";

  const handleAddToWatched = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onAddToWatched?.(movie);
  };

  const handleWatchlistToggle = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (isInWatchlist) {
      onRemoveFromWatchlist?.(movie);
    } else {
      onAddToWatchlist?.(movie);
    }
  };

  const handleCardClick = () => {
    router.push(`/movies/${movie.id}`);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleCardClick();
    }
  };

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      className="group cursor-pointer overflow-hidden rounded-lg bg-white shadow-md transition-all hover:scale-105 hover:shadow-xl dark:bg-gray-800"
    >
      {/* Movie Poster */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-gray-200 dark:bg-gray-700">
        {movie.poster_path ? (
          <Image
            src={posterUrl}
            alt={movie.title}
            fill
            className="object-cover transition-transform group-hover:scale-110"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="text-gray-400">No Image</span>
          </div>
        )}

        {/* Action Buttons Overlay */}
        {showActions && (
          <>
            {/* Gradient Background */}
            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/70 from-0% via-black/40 via-70% to-transparent to-100%" />

            {/* Action Buttons */}
            <div className="absolute inset-x-0 top-0 flex items-start justify-end gap-2 p-2">
              {/* Watched Button/Label */}
              {isWatched ? (
                <div className="flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-sm font-medium text-gray-900 shadow-lg dark:bg-gray-800/90 dark:text-white">
                  <Check className="h-4 w-4" />
                  <span>Watched</span>
                </div>
              ) : (
                onAddToWatched && (
                  <button
                    onClick={handleAddToWatched}
                    className="relative rounded-full bg-purple-600 p-2 text-white shadow-lg transition hover:bg-purple-700"
                    title="Add to watched"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                )
              )}

              {/* Watchlist Button - Only show if not watched */}
              {!isWatched && (onAddToWatchlist || onRemoveFromWatchlist) && (
                <button
                  onClick={handleWatchlistToggle}
                  className={`relative rounded-full p-2 shadow-lg transition ${
                    isInWatchlist
                      ? "bg-purple-600 text-white hover:bg-purple-700"
                      : "bg-white text-gray-900 hover:bg-gray-100 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
                  }`}
                  title={isInWatchlist ? "Remove from watchlist" : "Add to watchlist"}
                >
                  <Bookmark className={`h-4 w-4 ${isInWatchlist ? "fill-current" : ""}`} />
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* Movie Info */}
      <div className="p-4">
        <h3 className="mb-2 line-clamp-2 text-lg font-semibold text-gray-900 dark:text-white">
          {movie.title}
        </h3>

        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          {/* Release Year */}
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>{releaseYear}</span>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="font-medium">{rating}</span>
          </div>
        </div>

        {/* Overview (truncated) */}
        {movie.overview && (
          <p className="mt-2 line-clamp-3 text-sm text-gray-600 dark:text-gray-400">
            {movie.overview}
          </p>
        )}
      </div>
    </div>
  );
}
