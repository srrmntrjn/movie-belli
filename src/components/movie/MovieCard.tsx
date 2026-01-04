import Image from "next/image";
import type { ReactNode } from "react";
import { Star, Calendar } from "lucide-react";
import { Movie } from "@/lib/tmdb";

interface MovieCardAction {
  label: string;
  onClick: (movie: Movie) => void;
  disabled?: boolean;
  icon?: ReactNode;
  variant?: "primary" | "secondary" | "danger";
}

interface MovieCardProps {
  movie: Movie;
  onSelect?: (movie: Movie) => void;
  action?: MovieCardAction;
}

const ACTION_STYLES: Record<NonNullable<MovieCardAction["variant"]>, string> = {
  primary:
    "bg-purple-600 text-white hover:bg-purple-700 focus-visible:ring-purple-500",
  secondary:
    "bg-gray-100 text-gray-700 hover:bg-gray-200 focus-visible:ring-gray-400 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600",
  danger:
    "bg-red-100 text-red-700 hover:bg-red-200 focus-visible:ring-red-400 dark:bg-red-900/30 dark:text-red-200 dark:hover:bg-red-900/50",
};

export function MovieCard({ movie, onSelect, action }: MovieCardProps) {
  const posterUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : "/placeholder-movie.png";

  const releaseYear = movie.release_date
    ? new Date(movie.release_date).getFullYear()
    : "N/A";

  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : "N/A";

  return (
    <div
      onClick={() => onSelect?.(movie)}
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

        {action && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              action.onClick(movie);
            }}
            disabled={action.disabled}
            className={`mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full px-3 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${ACTION_STYLES[action.variant ?? "primary"]}`}
          >
            {action.icon}
            <span>{action.label}</span>
          </button>
        )}
      </div>
    </div>
  );
}
