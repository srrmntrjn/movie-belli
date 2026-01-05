"use client";

import Image from "next/image";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Bookmark, MessageCircle, Star } from "lucide-react";
import type { Movie } from "@/lib/tmdb";

type ActivityType = "RATED_MOVIE" | "REVIEWED_MOVIE" | "ADDED_TO_WATCHLIST";

export interface ActivityFeedEntry {
  id: string;
  type: ActivityType;
  createdAt: string;
  metadata?: Record<string, unknown> | null;
  user: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
  };
  movie: Movie;
}

interface ActivityFeedItemProps {
  entry: ActivityFeedEntry;
  onSelectMovie?: (movie: Movie) => void;
}

export function ActivityFeedItem({
  entry,
  onSelectMovie,
}: ActivityFeedItemProps) {
  const posterUrl = entry.movie.poster_path
    ? `https://image.tmdb.org/t/p/w342${entry.movie.poster_path}`
    : null;

  const formattedTimestamp = formatDistanceToNow(new Date(entry.createdAt), {
    addSuffix: true,
  });

  const rating =
    typeof entry.metadata?.rating === "number" ? entry.metadata.rating : null;

  const actionLabelMap: Record<ActivityType, string> = {
    RATED_MOVIE: "rated",
    REVIEWED_MOVIE: "reviewed",
    ADDED_TO_WATCHLIST: "bookmarked",
  };
  const actionLabel = actionLabelMap[entry.type] ?? "interacted with";

  const profileIdentifier = entry.user.username || entry.user.id;

  return (
    <div className="flex w-full items-center gap-4 rounded-2xl bg-white p-4 shadow-md transition hover:shadow-lg dark:bg-gray-800">
      <button
        type="button"
        onClick={() => onSelectMovie?.(entry.movie)}
        className="relative h-20 w-14 overflow-hidden rounded-lg bg-gray-200 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 dark:bg-gray-700"
      >
        {posterUrl ? (
          <Image
            src={posterUrl}
            alt={entry.movie.title}
            fill
            className="object-cover"
            sizes="56px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-gray-500 dark:text-gray-400">
            No Image
          </div>
        )}
      </button>

      <div className="flex-1">
        <p className="text-base text-gray-700 dark:text-gray-200">
          <Link
            href={`/users/${profileIdentifier}`}
            className="font-semibold text-gray-900 transition hover:text-purple-600 dark:text-white dark:hover:text-purple-400"
          >
            {entry.user.name || "tivi user"}
          </Link>{" "}
          {actionLabel}{" "}
          <button
            type="button"
            onClick={() => onSelectMovie?.(entry.movie)}
            className="font-semibold text-purple-600 hover:underline dark:text-purple-400"
          >
            {entry.movie.title}
          </button>
        </p>

        <div className="mt-2 flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
          {rating !== null && (
            <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-1 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-300">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              {rating.toFixed(2)}
            </span>
          )}
          {entry.type === "REVIEWED_MOVIE" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300">
              <MessageCircle className="h-4 w-4" />
              Review posted
            </span>
          )}
          {entry.type === "ADDED_TO_WATCHLIST" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2 py-1 text-purple-600 dark:bg-purple-500/10 dark:text-purple-300">
              <Bookmark className="h-4 w-4" />
              Watchlist
            </span>
          )}
          <span>•</span>
          <span>{formattedTimestamp}</span>
        </div>
      </div>
    </div>
  );
}
