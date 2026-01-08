"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Movie } from "@/lib/tmdb";
import { Calendar, Star, ThumbsDown, Meh, ThumbsUp, Loader2 } from "lucide-react";
import {
  InitialRankingList,
  type RankingMovie,
} from "@/components/ranking/InitialRankingList";
import {
  BinarySearchRanking,
  type OrderedRating,
  type RatingCategory,
} from "@/components/ranking/BinarySearchRanking";
import {
  MOVIE_CATEGORIES,
  type MovieCategory,
} from "@/lib/movieCategories";

interface MovieDetailModalProps {
  movie: Movie | null;
  isOpen: boolean;
  onClose: () => void;
}

interface RankingStatePayload {
  totalRatings: number;
  needsInitialRanking: boolean;
  initialRatings?: RankingMovie[];
}

const RATING_CONFIG = {
  bad: {
    label: "Bad",
    icon: ThumbsDown,
    value: 1.0,
    color: "bg-red-500 hover:bg-red-600",
    textColor: "text-red-500",
  },
  ok: {
    label: "Ok",
    icon: Meh,
    value: 3.0,
    color: "bg-yellow-500 hover:bg-yellow-600",
    textColor: "text-yellow-500",
  },
  great: {
    label: "Great",
    icon: ThumbsUp,
    value: 5.0,
    color: "bg-green-500 hover:bg-green-600",
    textColor: "text-green-500",
  },
};

export function MovieDetailModal({
  movie,
  isOpen,
  onClose,
}: MovieDetailModalProps) {
  const [selectedRating, setSelectedRating] = useState<RatingCategory | null>(
    null
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [phase, setPhase] = useState<"rate" | "initial" | "compare">("rate");
  const [rankingState, setRankingState] = useState<RankingStatePayload | null>(null);
  const [initialRankingData, setInitialRankingData] = useState<RankingMovie[]>([]);
  const [pendingCategory, setPendingCategory] = useState<RatingCategory | null>(null);
  const [selectedMovieCategory, setSelectedMovieCategory] =
    useState<MovieCategory | null>(null);
  const [comparisonList, setComparisonList] = useState<OrderedRating[]>([]);
  const [orderedCache, setOrderedCache] = useState<OrderedRating[] | null>(null);
  const [rankingLoading, setRankingLoading] = useState(false);

  const resetState = useCallback(() => {
    setSelectedRating(null);
    setSaving(false);
    setSaved(false);
    setActionError(null);
    setPhase("rate");
    setRankingState(null);
    setInitialRankingData([]);
    setPendingCategory(null);
    setSelectedMovieCategory(null);
    setComparisonList([]);
    setOrderedCache(null);
    setRankingLoading(false);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      resetState();
    }
  }, [isOpen, resetState]);

  const fetchRankingState = useCallback(async () => {
    try {
      const response = await fetch("/api/rankings/state");
      const payload = (await response.json()) as
        | RankingStatePayload
        | { error?: string };
      if (!response.ok) {
        throw new Error(
          "error" in payload && payload.error
            ? payload.error
            : "Failed to load ranking state"
        );
      }
      const data = payload as RankingStatePayload;
      setRankingState(data);
      if (data.initialRatings) {
        setInitialRankingData(data.initialRatings);
      }
      return data;
    } catch (error) {
      console.error("Failed to fetch ranking state:", error);
      setActionError(
        error instanceof Error ? error.message : "Unable to load ranking state"
      );
      return null;
    }
  }, []);

  const fetchOrderedRatings = useCallback(async () => {
    try {
      const response = await fetch("/api/rankings/ordered");
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Unable to load rankings");
      }
      const formatted: OrderedRating[] = (payload.ratings || []).map(
        (rating: any) => ({
          id: rating.id,
          tmdbId: rating.tmdbId,
          title: rating.title,
          posterPath: rating.posterPath,
          releaseDate: rating.releaseDate,
          rating: rating.rating,
          position:
            rating.position !== null && rating.position !== undefined
              ? Number(rating.position)
              : null,
        })
      );
      setOrderedCache(formatted);
      return formatted;
    } catch (error) {
      console.error("Failed to fetch ordered rankings:", error);
      setActionError(
        error instanceof Error
          ? error.message
          : "Unable to load comparison data"
      );
      return null;
    }
  }, []);

  const submitRating = useCallback(
    async (
      category: RatingCategory,
      placement?: { beforeId: string | null; afterId: string | null }
    ) => {
      if (!movie) return;
      if (!selectedMovieCategory) {
        setActionError("Select a movie category before rating.");
        return;
      }
      setSelectedRating(category);
      setSaving(true);
      setSaved(false);
      setActionError(null);

      try {
        const response = await fetch("/api/movies/rate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            tmdbId: movie.id,
            category,
            movieCategory: selectedMovieCategory,
            movie: {
              title: movie.title,
              poster_path: movie.poster_path,
              release_date: movie.release_date,
            },
            placement,
          }),
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.error || "Failed to save rating");
        }

        setSaved(true);
        setPhase("rate");
        setComparisonList([]);
        setPendingCategory(null);
        setOrderedCache(null);
        setRankingState((prev) =>
          prev
            ? {
                ...prev,
                totalRatings: prev.totalRatings + 1,
              }
            : prev
        );

        setTimeout(() => {
          onClose();
          resetState();
        }, 1200);
      } catch (error) {
        console.error("Error saving rating:", error);
        setActionError(
          error instanceof Error ? error.message : "Failed to save rating"
        );
      } finally {
        setSaving(false);
      }
    },
    [movie, onClose, resetState, selectedMovieCategory]
  );

  const startComparison = useCallback(
    async (category: RatingCategory, totalRatings: number) => {
      if (!movie) return;
      if (totalRatings < 10) {
        await submitRating(category);
        return;
      }
      const ordered = orderedCache ?? (await fetchOrderedRatings());
      if (!ordered) {
        return;
      }
      const filtered = ordered.filter((rating) => rating.tmdbId !== movie.id);
      if (filtered.length === 0) {
        await submitRating(category);
        return;
      }
      setComparisonList(filtered);
      setPhase("compare");
    },
    [fetchOrderedRatings, movie, orderedCache, submitRating]
  );

  const handleComparisonComplete = useCallback(
    async (placement: { beforeId: string | null; afterId: string | null }) => {
      if (!pendingCategory) return;
      await submitRating(pendingCategory, placement);
    },
    [pendingCategory, submitRating]
  );

  const handleInitialRankingSubmit = async (orderedIds: string[]) => {
    setRankingLoading(true);
    setActionError(null);
    try {
      const response = await fetch("/api/rankings/initial", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderedIds }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || "Failed to save ranking order");
      }
      const updatedState = await fetchRankingState();
      setPhase("rate");
      if (pendingCategory && updatedState && !updatedState.needsInitialRanking) {
        await startComparison(pendingCategory, updatedState.totalRatings);
      }
    } catch (error) {
      console.error("Failed to complete initial ranking:", error);
      setActionError(
        error instanceof Error
          ? error.message
          : "Unable to save ranking order"
      );
    } finally {
      setRankingLoading(false);
    }
  };

  const handleRate = async (category: RatingCategory) => {
    if (!movie) return;
    if (!selectedMovieCategory) {
      setActionError("Select a movie category before rating.");
      return;
    }
    setPendingCategory(category);
    setActionError(null);

    const state = rankingState ?? (await fetchRankingState());
    if (!state) return;

    if (state.needsInitialRanking) {
      setPhase("initial");
      if (state.initialRatings) {
        setInitialRankingData(state.initialRatings);
      }
      return;
    }

    if (state.totalRatings < 10) {
      await submitRating(category);
      return;
    }

    await startComparison(category, state.totalRatings);
  };

  if (!movie) {
    return null;
  }

  const posterUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : null;

  const backdropUrl = movie.backdrop_path
    ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`
    : null;

  const releaseYear = movie.release_date
    ? new Date(movie.release_date).getFullYear()
    : "N/A";

  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : "N/A";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto max-w-[95vw] sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="sr-only">{movie.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6">
          {/* Rating Section */}
          {phase !== "compare" && (
            <>
              {/* Backdrop Image */}
              {backdropUrl && (
                <div className="relative -mx-4 -mt-4 h-48 overflow-hidden rounded-t-lg sm:-mx-6 sm:-mt-6 sm:h-64">
                  <Image
                    src={backdropUrl}
                    alt={movie.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 768px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                </div>
              )}

              {/* Movie Info */}
              <div className="flex gap-3 sm:gap-6">
                {/* Poster */}
                {posterUrl && (
                  <div className="relative h-32 w-24 flex-shrink-0 overflow-hidden rounded-lg sm:h-48 sm:w-32">
                    <Image
                      src={posterUrl}
                      alt={movie.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 96px, 128px"
                    />
                  </div>
                )}

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">
                    {movie.title}
                  </h2>

                  <div className="mt-2 flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 sm:gap-4">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{releaseYear}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{rating}</span>
                    </div>
                  </div>

                  {movie.overview && (
                    <p className="mt-3 text-sm text-gray-700 line-clamp-4 dark:text-gray-300 sm:mt-4 sm:line-clamp-none">
                      {movie.overview}
                    </p>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Rating Section */}
          <div className="border-t pt-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              How would you rate this movie?
            </h3>

            {actionError && (
              <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-300">
                {actionError}
              </div>
            )}

            <div className="mb-6">
              <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
                Choose a category
              </h4>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Required before you can rate this movie.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {MOVIE_CATEGORIES.map((category) => {
                  const isSelected = selectedMovieCategory === category.id;
                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => {
                        setSelectedMovieCategory(category.id);
                        setActionError(null);
                      }}
                      className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                        isSelected
                          ? "border-gray-900 bg-gray-900 text-white dark:border-white dark:bg-white dark:text-gray-900"
                          : "border-gray-300 bg-white text-gray-700 hover:border-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                      }`}
                      disabled={saving}
                    >
                      {category.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {saved ? (
              <div className="flex items-center justify-center gap-2 rounded-lg bg-green-50 py-6 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                <ThumbsUp className="h-5 w-5" />
                <span className="font-medium">Rating saved!</span>
              </div>
            ) : phase === "initial" ? (
              <InitialRankingList
                movies={initialRankingData}
                onSubmit={handleInitialRankingSubmit}
                onCancel={() => {
                  setPhase("rate");
                  setPendingCategory(null);
                }}
                submitting={rankingLoading}
              />
            ) : phase === "compare" ? (
              <BinarySearchRanking
                movie={movie}
                category={pendingCategory ?? "ok"}
                ratings={comparisonList}
                onComplete={handleComparisonComplete}
                onCancel={() => {
                  setPhase("rate");
                  setComparisonList([]);
                  setPendingCategory(null);
                }}
              />
            ) : (
              <div className="grid grid-cols-3 gap-4">
                {(Object.keys(RATING_CONFIG) as RatingCategory[]).map(
                  (category) => {
                    const config = RATING_CONFIG[category];
                    const Icon = config.icon;
                    const isSelected = selectedRating === category;

                    return (
                      <button
                        key={category}
                        onClick={() => handleRate(category)}
                        disabled={saving || !selectedMovieCategory}
                        className={`flex flex-col items-center gap-3 rounded-lg p-6 text-white transition-all ${
                          config.color
                        } ${
                          isSelected ? "scale-105 shadow-lg" : "shadow"
                        } disabled:cursor-not-allowed disabled:opacity-50`}
                      >
                        {saving && isSelected ? (
                          <Loader2 className="h-8 w-8 animate-spin" />
                        ) : (
                          <Icon className="h-8 w-8" />
                        )}
                        <span className="text-lg font-semibold">
                          {config.label}
                        </span>
                      </button>
                    );
                  }
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
