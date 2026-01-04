"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { ArrowLeftRight, Star } from "lucide-react";
import type { Movie } from "@/lib/tmdb";

export type RatingCategory = "bad" | "ok" | "great";

export interface OrderedRating {
  id: string;
  tmdbId: number;
  title: string | null;
  posterPath: string | null;
  releaseDate?: string | null;
  rating: number;
  position: number | null;
}

interface BinarySearchRankingProps {
  movie: Movie;
  category: RatingCategory;
  ratings: OrderedRating[];
  onComplete: (placement: { beforeId: string | null; afterId: string | null }) => void;
  onCancel: () => void;
}

const categoryLabel: Record<RatingCategory, string> = {
  bad: "Bad",
  ok: "Ok",
  great: "Great",
};

const describeRating = (value: number) => {
  if (Number.isInteger(value) && value >= 1 && value <= 3) {
    if (value === 1) return "Bad";
    if (value === 2) return "Ok";
    return "Great";
  }

  if (value < 4) return "Bad";
  if (value <= 7) return "Ok";
  return "Great";
};

const computeInitialIndex = (category: RatingCategory, total: number) => {
  if (total <= 0) {
    return 0;
  }

  const base = Math.floor(total / 3);
  const remainder = total % 3;

  const sizeBad = base + (remainder > 0 ? 1 : 0);
  const sizeOk = base + (remainder > 1 ? 1 : 0);
  const sizeGreat = total - sizeBad - sizeOk;

  const ranges: Record<RatingCategory, { start: number; end: number }> = {
    bad: { start: 0, end: sizeBad - 1 },
    ok: { start: sizeBad, end: sizeBad + sizeOk - 1 },
    great: { start: sizeBad + sizeOk, end: total - 1 },
  };

  const range = ranges[category];
  if (range.start > range.end) {
    return Math.floor(total / 2);
  }
  return Math.floor((range.start + range.end) / 2);
};

export function BinarySearchRanking({
  movie,
  category,
  ratings,
  onComplete,
  onCancel,
}: BinarySearchRankingProps) {
  const total = ratings.length;
  const initialIndex = useMemo(
    () => computeInitialIndex(category, total),
    [category, total]
  );

  const [low, setLow] = useState(0);
  const [high, setHigh] = useState(Math.max(total - 1, 0));
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [complete, setComplete] = useState<{
    beforeId: string | null;
    afterId: string | null;
  } | null>(null);

  useEffect(() => {
    setLow(0);
    setHigh(Math.max(total - 1, 0));
    setCurrentIndex(computeInitialIndex(category, total));
    setComplete(null);
  }, [category, total]);

  useEffect(() => {
    if (complete) {
      onComplete(complete);
    }
  }, [complete, onComplete]);

  useEffect(() => {
    if (total === 0) {
      onComplete({ beforeId: null, afterId: null });
    }
  }, [total, onComplete]);

  if (total === 0) {
    return null;
  }

  const candidate = ratings[currentIndex];

  const handleDecision = (decision: "better" | "worse" | "similar") => {
    let nextLow = low;
    let nextHigh = high;

    if (decision === "better") {
      nextLow = Math.min(currentIndex + 1, total);
    } else if (decision === "worse") {
      nextHigh = Math.max(currentIndex - 1, -1);
    } else {
      if (currentIndex - low <= high - currentIndex) {
        nextHigh = Math.max(currentIndex - 1, -1);
      } else {
        nextLow = Math.min(currentIndex + 1, total);
      }
    }

    if (nextLow > nextHigh) {
      const insertionIndex = nextLow;
      const before = insertionIndex - 1 >= 0 ? ratings[insertionIndex - 1] : null;
      const after = insertionIndex < ratings.length ? ratings[insertionIndex] : null;
      setComplete({
        beforeId: before?.id ?? null,
        afterId: after?.id ?? null,
      });
      return;
    }

    setLow(nextLow);
    setHigh(nextHigh);
    setCurrentIndex(Math.floor((nextLow + nextHigh) / 2));
  };

  const movieYear = movie.release_date
    ? new Date(movie.release_date).getFullYear()
    : null;
  const candidateYear = candidate.releaseDate
    ? new Date(candidate.releaseDate).getFullYear()
    : null;

  return (
    <div className="space-y-6">
      {/* Which do you prefer header */}
      <h3 className="text-center text-2xl font-bold text-gray-900 dark:text-white">
        Which do you prefer?
      </h3>

      {/* Side by side comparison cards */}
      <div className="relative flex items-stretch gap-4">
        {/* New movie card */}
        <button
          type="button"
          onClick={() => handleDecision("better")}
          className="group flex flex-1 flex-col items-center justify-center rounded-3xl border-2 border-gray-300 bg-white p-8 transition-all hover:border-purple-500 hover:shadow-xl dark:border-gray-700 dark:bg-gray-800 dark:hover:border-purple-400"
        >
          <div className="relative mb-4 h-48 w-32 overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-700">
            {movie.poster_path ? (
              <Image
                src={`https://image.tmdb.org/t/p/w342${movie.poster_path}`}
                alt={movie.title}
                fill
                className="object-cover"
                sizes="128px"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-gray-500">
                No Image
              </div>
            )}
          </div>
          <h4 className="text-center text-xl font-bold text-gray-900 dark:text-white">
            {movie.title}
          </h4>
          {movieYear && (
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {movieYear}
            </p>
          )}
        </button>

        {/* OR badge */}
        <div className="absolute left-1/2 top-1/2 z-10 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-gray-800 text-sm font-bold text-white shadow-lg dark:bg-gray-600">
          OR
        </div>

        {/* Comparison movie card */}
        <button
          type="button"
          onClick={() => handleDecision("worse")}
          className="group flex flex-1 flex-col items-center justify-center rounded-3xl border-2 border-gray-300 bg-white p-8 transition-all hover:border-purple-500 hover:shadow-xl dark:border-gray-700 dark:bg-gray-800 dark:hover:border-purple-400"
        >
          <div className="relative mb-4 h-48 w-32 overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-700">
            {candidate.posterPath ? (
              <Image
                src={`https://image.tmdb.org/t/p/w342${candidate.posterPath}`}
                alt={candidate.title ?? "Movie"}
                fill
                className="object-cover"
                sizes="128px"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-gray-500">
                No Image
              </div>
            )}
          </div>
          <h4 className="text-center text-xl font-bold text-gray-900 dark:text-white">
            {candidate.title ?? "Untitled"}
          </h4>
          {candidateYear && (
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {candidateYear}
            </p>
          )}
        </button>
      </div>

      {/* Bottom action buttons */}
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-2 rounded-full border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          <ArrowLeftRight className="h-4 w-4" />
          Undo
        </button>
        <button
          type="button"
          onClick={() => handleDecision("similar")}
          className="rounded-full border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          Too tough
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          Skip →
        </button>
      </div>
    </div>
  );
}
