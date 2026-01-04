"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2, Film } from "lucide-react";
import { MovieRatingCard } from "@/components/movie/MovieRatingCard";
import { Movie } from "@/lib/tmdb";

interface Review {
  id: string;
  rating: number;
  createdAt: string;
  movie: Movie;
}

export default function MyReviewsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchReviews();
    }
  }, [status]);

  const fetchReviews = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/users/me/reviews");

      if (!response.ok) {
        throw new Error("Failed to fetch reviews");
      }

      const data = await response.json();
      setReviews(data.reviews || []);
    } catch (err) {
      console.error("Error fetching reviews:", err);
      setError("Failed to load your reviews. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            My Reviews
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {reviews.length > 0
              ? `You've rated ${reviews.length} movie${reviews.length !== 1 ? "s" : ""}`
              : "You haven't rated any movies yet"}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-8 rounded-lg bg-red-50 p-4 text-red-700 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          </div>
        )}

        {/* Reviews Grid */}
        {!loading && reviews.length > 0 && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {reviews.map((review) => (
              <MovieRatingCard
                key={review.id}
                movie={review.movie}
                rating={review.rating}
                createdAt={new Date(review.createdAt)}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && reviews.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Film className="mb-4 h-16 w-16 text-gray-300 dark:text-gray-600" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              No reviews yet
            </h3>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Start rating movies to see them here
            </p>
            <button
              onClick={() => router.push("/search")}
              className="mt-4 rounded-full bg-purple-600 px-6 py-3 text-base font-medium text-white shadow-lg transition-all hover:bg-purple-700 hover:shadow-xl"
            >
              Search Movies
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
