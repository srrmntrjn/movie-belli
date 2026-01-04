"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Movie } from "@/lib/tmdb";
import { Calendar, Star, ThumbsDown, Meh, ThumbsUp, Loader2 } from "lucide-react";

interface MovieDetailModalProps {
  movie: Movie | null;
  isOpen: boolean;
  onClose: () => void;
}

type RatingCategory = "bad" | "ok" | "great";

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

  if (!movie) return null;

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

  const handleRate = async (category: RatingCategory) => {
    setSelectedRating(category);
    setSaving(true);
    setSaved(false);

    try {
      const response = await fetch("/api/movies/rate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tmdbId: movie.id,
          rating: RATING_CONFIG[category].value,
          category,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save rating");
      }

      setSaved(true);
      setTimeout(() => {
        onClose();
        setSaved(false);
        setSelectedRating(null);
      }, 1500);
    } catch (error) {
      console.error("Error saving rating:", error);
      alert("Failed to save rating. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="sr-only">{movie.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Backdrop Image */}
          {backdropUrl && (
            <div className="relative -mx-6 -mt-6 h-64 overflow-hidden rounded-t-lg">
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
          <div className="flex gap-6">
            {/* Poster */}
            {posterUrl && (
              <div className="relative h-48 w-32 flex-shrink-0 overflow-hidden rounded-lg">
                <Image
                  src={posterUrl}
                  alt={movie.title}
                  fill
                  className="object-cover"
                  sizes="128px"
                />
              </div>
            )}

            {/* Details */}
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {movie.title}
              </h2>

              <div className="mt-2 flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
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
                <p className="mt-4 text-sm text-gray-700 dark:text-gray-300">
                  {movie.overview}
                </p>
              )}
            </div>
          </div>

          {/* Rating Section */}
          <div className="border-t pt-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              How would you rate this movie?
            </h3>

            {saved ? (
              <div className="flex items-center justify-center gap-2 rounded-lg bg-green-50 py-6 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                <ThumbsUp className="h-5 w-5" />
                <span className="font-medium">Rating saved!</span>
              </div>
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
                        disabled={saving}
                        className={`flex flex-col items-center gap-3 rounded-lg p-6 text-white transition-all ${
                          config.color
                        } ${
                          isSelected ? "scale-105 shadow-lg" : "shadow"
                        } disabled:opacity-50`}
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
