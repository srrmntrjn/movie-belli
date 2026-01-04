import Image from "next/image";
import { Star, Calendar, ThumbsDown, Meh, ThumbsUp } from "lucide-react";
import { Movie } from "@/lib/tmdb";
import { format } from "date-fns";

interface MovieRatingCardProps {
  movie: Movie;
  rating: number;
  createdAt: Date;
  onSelect?: (movie: Movie) => void;
  showReviewer?: boolean;
  reviewer?: {
    name: string;
    username?: string;
    image?: string;
  };
}

// Map rating values to categories
const getRatingCategory = (rating: number) => {
  if (rating <= 2) return "bad";
  if (rating <= 3.5) return "ok";
  return "great";
};

const ratingConfig = {
  bad: {
    label: "Bad",
    icon: ThumbsDown,
    bgColor: "bg-red-500",
    textColor: "text-red-500",
  },
  ok: {
    label: "Ok",
    icon: Meh,
    bgColor: "bg-yellow-500",
    textColor: "text-yellow-500",
  },
  great: {
    label: "Great",
    icon: ThumbsUp,
    bgColor: "bg-green-500",
    textColor: "text-green-500",
  },
};

export function MovieRatingCard({
  movie,
  rating,
  createdAt,
  onSelect,
  showReviewer = false,
  reviewer,
}: MovieRatingCardProps) {
  const posterUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : null;

  const releaseYear = movie.release_date
    ? new Date(movie.release_date).getFullYear()
    : "N/A";

  const category = getRatingCategory(rating);
  const config = ratingConfig[category];
  const RatingIcon = config.icon;

  const formattedDate = format(new Date(createdAt), "MMM d, yyyy");

  return (
    <div
      onClick={() => onSelect?.(movie)}
      className="group relative cursor-pointer overflow-hidden rounded-lg bg-white shadow-md transition-all hover:scale-105 hover:shadow-xl dark:bg-gray-800"
    >
      {/* Movie Poster */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-gray-200 dark:bg-gray-700">
        {posterUrl ? (
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

        {/* Rating Badge Overlay */}
        <div
          className={`absolute right-2 top-2 flex items-center gap-1 rounded-full ${config.bgColor} px-3 py-1.5 text-white shadow-lg`}
        >
          <RatingIcon className="h-4 w-4" />
          <span className="text-sm font-semibold">{config.label}</span>
        </div>
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

          {/* TMDB Rating */}
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="font-medium">
              {movie.vote_average ? movie.vote_average.toFixed(1) : "N/A"}
            </span>
          </div>
        </div>

        {/* Rating Date */}
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-500">
          Rated on {formattedDate}
        </div>

        {/* Reviewer Info (for feed) */}
        {showReviewer && reviewer && (
          <div className="mt-2 flex items-center gap-2 border-t pt-2 dark:border-gray-700">
            {reviewer.image && (
              <Image
                src={reviewer.image}
                alt={reviewer.name}
                width={24}
                height={24}
                className="rounded-full"
              />
            )}
            <div className="text-sm">
              <span className="font-medium text-gray-900 dark:text-white">
                {reviewer.name}
              </span>
              {reviewer.username && (
                <span className="text-gray-500 dark:text-gray-400">
                  {" "}
                  @{reviewer.username}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
