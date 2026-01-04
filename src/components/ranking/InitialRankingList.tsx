"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { GripVertical } from "lucide-react";

export interface RankingMovie {
  id: string;
  tmdbId: number;
  title: string | null;
  posterPath: string | null;
  rating: number;
}

interface InitialRankingListProps {
  movies: RankingMovie[];
  onSubmit: (order: string[]) => Promise<void> | void;
  onCancel?: () => void;
  submitting?: boolean;
}

export function InitialRankingList({
  movies,
  onSubmit,
  onCancel,
  submitting = false,
}: InitialRankingListProps) {
  const [order, setOrder] = useState(movies);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const handleDragStart = (id: string) => {
    setDraggingId(id);
  };

  const handleDragOver = (event: React.DragEvent<HTMLLIElement>, id: string) => {
    event.preventDefault();
    if (!draggingId || draggingId === id) {
      return;
    }

    setOrder((current) => {
      const fromIndex = current.findIndex((movie) => movie.id === draggingId);
      const toIndex = current.findIndex((movie) => movie.id === id);
      if (fromIndex === -1 || toIndex === -1) {
        return current;
      }
      const updated = [...current];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      return updated;
    });
  };

  const handleDragEnd = () => {
    setDraggingId(null);
  };

  const titlesPreview = useMemo(
    () => order.map((movie, index) => `${index + 1}. ${movie.title ?? "Untitled"}`),
    [order]
  );

  const submitOrder = () => {
    onSubmit(order.map((movie) => movie.id));
  };

  return (
    <div className="space-y-4 rounded-2xl bg-white p-6 shadow dark:bg-gray-900">
      <div>
        <p className="text-lg font-semibold text-gray-900 dark:text-white">
          Rank your first 10 movies
        </p>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Drag each movie to reorder them from lowest to highest. We&apos;ll use this
          ordering to power future recommendations.
        </p>
      </div>

      <ol className="space-y-3">
        {order.map((movie, index) => (
          <li
            key={movie.id}
            draggable
            onDragStart={() => handleDragStart(movie.id)}
            onDragOver={(event) => handleDragOver(event, movie.id)}
            onDragEnd={handleDragEnd}
            className={`flex items-center gap-4 rounded-xl border border-dashed border-purple-200 bg-white/70 p-3 shadow-sm transition dark:border-gray-700 dark:bg-gray-800/70 ${
              draggingId === movie.id ? "opacity-70" : ""
            }`}
          >
            <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
              <GripVertical className="h-5 w-5" />
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                {index + 1}
              </span>
            </div>
            <div className="relative h-16 w-12 overflow-hidden rounded-md bg-gray-200 dark:bg-gray-700">
              {movie.posterPath ? (
                <Image
                  src={`https://image.tmdb.org/t/p/w154${movie.posterPath}`}
                  alt={movie.title ?? "Movie poster"}
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-gray-500">
                  No Image
                </div>
              )}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900 dark:text-white">
                {movie.title ?? "Untitled movie"}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Rating #{index + 1}
              </p>
            </div>
          </li>
        ))}
      </ol>

      <div className="rounded-lg bg-purple-50 p-4 text-sm text-purple-800 dark:bg-purple-900/40 dark:text-purple-200">
        <p className="font-medium">Current order:</p>
        <p className="mt-1 text-xs text-purple-700 dark:text-purple-200">
          {titlesPreview.join(" · ")}
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
            disabled={submitting}
          >
            Cancel
          </button>
        )}
        <button
          type="button"
          onClick={submitOrder}
          disabled={submitting}
          className="flex-1 rounded-full bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:opacity-70"
        >
          {submitting ? "Saving..." : "Save order"}
        </button>
      </div>
    </div>
  );
}
