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

  return (
    <div className="space-y-4 rounded-2xl bg-white p-6 shadow dark:bg-gray-900">
      <div className="flex items-start gap-4">
        <div className="relative h-32 w-24 overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-800">
          {movie.poster_path ? (
            <Image
              src={`https://image.tmdb.org/t/p/w342${movie.poster_path}`}
              alt={movie.title}
              fill
              className="object-cover"
              sizes="96px"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-gray-500">
              No Image
            </div>
          )}
        </div>
        <div>
          <p className="text-sm font-semibold text-purple-600 dark:text-purple-300">
            {categoryLabel[category]} rating flow
          </p>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
            {movie.title}
          </h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Help us find the right spot by comparing against movies you&apos;ve already
            reviewed.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
        <div className="mb-4 flex items-center gap-3 text-gray-500 dark:text-gray-400">
          <ArrowLeftRight className="h-5 w-5" />
          <span>
            Is <strong>{movie.title}</strong> better or worse than
            <strong> {candidate.title ?? "this movie"}</strong>?
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative h-24 w-16 overflow-hidden rounded-md bg-gray-200 dark:bg-gray-700">
            {candidate.posterPath ? (
              <Image
                src={`https://image.tmdb.org/t/p/w154${candidate.posterPath}`}
                alt={candidate.title ?? "Movie"}
                fill
                className="object-cover"
                sizes="64px"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[10px] text-gray-500">
                No Image
              </div>
            )}
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {candidate.title ?? "Untitled movie"}
            </p>
            <p className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
              <Star className="h-4 w-4 text-yellow-400" />
              <span>{describeRating(candidate.rating)}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => handleDecision("better")}
          className="flex-1 rounded-full bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700"
        >
          Better
        </button>
        <button
          type="button"
          onClick={() => handleDecision("worse")}
          className="flex-1 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
        >
          Worse
        </button>
        <button
          type="button"
          onClick={() => handleDecision("similar")}
          className="flex-1 rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
        >
          Similar
        </button>
      </div>

      <button
        type="button"
        onClick={onCancel}
        className="w-full rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
      >
        Cancel
      </button>
    </div>
  );
}
