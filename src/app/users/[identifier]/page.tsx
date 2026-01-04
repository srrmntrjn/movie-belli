"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2, User, Users, Star, ArrowLeft } from "lucide-react";
import { MovieDetailModal } from "@/components/movie/MovieDetailModal";
import { MovieRatingCard } from "@/components/movie/MovieRatingCard";
import { FollowButton } from "@/components/user/FollowButton";
import type { Movie } from "@/lib/tmdb";

interface ProfileReview {
  id: string;
  rating: number;
  createdAt: string;
  movie: Movie;
}

interface ProfileData {
  user: {
    id: string;
    name: string | null;
    username: string | null;
    bio: string | null;
    image: string | null;
    joinedAt: string;
  };
  stats: {
    reviews: number;
    followers: number;
    following: number;
  };
  reviews: ProfileReview[];
  isCurrentUser: boolean;
  isFollowing: boolean;
}

export default function UserProfilePage({
  params,
}: {
  params: { identifier: string };
}) {
  const { status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const identifier = params.identifier;

  useEffect(() => {
    let isMounted = true;
    const loadProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `/api/users/${encodeURIComponent(identifier)}`
        );
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || "User not found");
        }
        const data: ProfileData = await response.json();
        if (isMounted) {
          setProfile(data);
        }
      } catch (err) {
        console.error("Failed to load profile:", err);
        if (isMounted) {
          setError(
            err instanceof Error ? err.message : "Failed to load profile"
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadProfile();
    return () => {
      isMounted = false;
    };
  }, [identifier]);

  const handleFollowChange = (isFollowing: boolean) => {
    setProfile((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        isFollowing,
        stats: {
          ...prev.stats,
          followers: isFollowing
            ? prev.stats.followers + 1
            : Math.max(prev.stats.followers - 1, 0),
        },
      };
    });
  };

  const handleMovieSelect = (movie: Movie) => {
    setSelectedMovie(movie);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedMovie(null);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 text-center dark:from-gray-900 dark:to-gray-800">
        <User className="mb-4 h-16 w-16 text-gray-400 dark:text-gray-600" />
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
          {error || "Profile not found"}
        </h2>
        <button
          onClick={() => router.back()}
          className="mt-6 rounded-full bg-purple-600 px-6 py-3 text-white shadow-lg transition hover:bg-purple-700"
        >
          Go Back
        </button>
      </div>
    );
  }

  const isLoggedIn = status === "authenticated";

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <button
          onClick={() => router.back()}
          className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-sm font-medium text-gray-700 shadow hover:bg-white dark:bg-gray-800/70 dark:text-gray-200 dark:hover:bg-gray-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="rounded-3xl bg-white p-8 shadow-xl dark:bg-gray-900">
          <div className="flex flex-col gap-6 md:flex-row md:items-center">
            <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500">
              {profile.user.image ? (
                <Image
                  src={profile.user.image}
                  alt={profile.user.name || "User avatar"}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <User className="h-12 w-12 text-white" />
                </div>
              )}
            </div>

            <div className="flex-1">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {profile.user.name || "Movie Belli User"}
                  </h1>
                  {profile.user.username && (
                    <p className="text-gray-500 dark:text-gray-400">
                      @{profile.user.username}
                    </p>
                  )}
                  {profile.user.bio && (
                    <p className="mt-4 text-gray-700 dark:text-gray-300">
                      {profile.user.bio}
                    </p>
                  )}
                </div>

                {isLoggedIn && !profile.isCurrentUser && (
                  <FollowButton
                    userId={profile.user.id}
                    initialFollowing={profile.isFollowing}
                    onFollowChange={handleFollowChange}
                  />
                )}
              </div>

              <div className="mt-6 grid grid-cols-3 gap-4">
                <ProfileStat
                  label="Reviews"
                  value={profile.stats.reviews}
                  icon={<Star className="h-4 w-4 text-yellow-500" />}
                />
                <ProfileStat
                  label="Followers"
                  value={profile.stats.followers}
                  icon={<Users className="h-4 w-4 text-blue-500" />}
                />
                <ProfileStat
                  label="Following"
                  value={profile.stats.following}
                  icon={<User className="h-4 w-4 text-purple-500" />}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10">
          <h2 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-white">
            Recent Reviews
          </h2>

          {profile.reviews.length === 0 ? (
            <div className="rounded-2xl bg-white p-10 text-center shadow dark:bg-gray-900">
              <p className="text-gray-600 dark:text-gray-400">
                No reviews yet
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {profile.reviews.map((review) => (
                <MovieRatingCard
                  key={review.id}
                  movie={review.movie}
                  rating={review.rating}
                  createdAt={new Date(review.createdAt)}
                  onSelect={handleMovieSelect}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <MovieDetailModal
        movie={selectedMovie}
        isOpen={isModalOpen}
        onClose={closeModal}
      />
    </div>
  );
}

function ProfileStat({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-gray-50 p-4 dark:bg-gray-800">
      <div className="rounded-full bg-white p-2 dark:bg-gray-900">{icon}</div>
      <div>
        <p className="text-xl font-bold text-gray-900 dark:text-white">
          {value}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      </div>
    </div>
  );
}
