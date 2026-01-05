"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Check, Bookmark, Loader2, User } from "lucide-react";
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
    memberSince: string;
  };
  stats: {
    followers: number;
    following: number;
    beenCount: number;
    wantToTryCount: number;
  };
  reviews: ProfileReview[];
  isCurrentUser: boolean;
}

export default function UserProfilePage() {
  const { status } = useSession();
  const router = useRouter();
  const params = useParams();
  const identifier = useMemo(() => {
    const raw = params?.identifier;
    if (!raw) return "";
    if (Array.isArray(raw)) return raw[0] ?? "";
    return raw;
  }, [params]);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfileData = useCallback(
    async () => {
      if (!identifier) {
        throw new Error("Missing user identifier");
      }
      const response = await fetch(
        `/api/users/${encodeURIComponent(identifier)}?page=1&limit=10`
      );
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || "User not found");
      }
      return payload as ProfileData;
    },
    [identifier]
  );

  useEffect(() => {
    let isMounted = true;
    if (!identifier) {
      setError("Profile not found");
      setLoading(false);
      return () => {
        isMounted = false;
      };
    }
    const loadProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchProfileData();
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
  }, [fetchProfileData]);

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
  const displayName = profile.user.name || profile.user.username || "tivi User";
  const username = profile.user.username || "user";
  const memberSince = new Date(profile.user.memberSince).toLocaleDateString(
    "en-US",
    { month: "long", year: "numeric" }
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 pb-24 dark:from-gray-900 dark:to-gray-800">
      <main className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            {profile.user.image ? (
              <Image
                src={profile.user.image}
                alt={displayName}
                width={160}
                height={160}
                className="h-40 w-40 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-40 w-40 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-blue-600 text-5xl font-bold text-white">
                {displayName[0]?.toUpperCase()}
              </div>
            )}
          </div>

          <p className="mb-1 text-xl font-semibold text-gray-900 dark:text-white">
            @{username}
          </p>

          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
            Member since {memberSince}
          </p>

          <div className="mb-6 grid grid-cols-2 gap-4">
            <div className="transition hover:opacity-70">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {profile.stats.followers}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Followers
              </p>
            </div>
            <div className="transition hover:opacity-70">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {profile.stats.following}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Following
              </p>
            </div>
          </div>
        </div>

        <div className="mb-8 space-y-2">
          <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-4 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800/60 dark:hover:bg-gray-800">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
                <Check className="h-6 w-6 text-gray-900 dark:text-white" />
              </div>
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                Watched
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                {profile.stats.beenCount}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-4 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800/60 dark:hover:bg-gray-800">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
                <Bookmark className="h-6 w-6 text-gray-900 dark:text-white" />
              </div>
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                Watch List
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                {profile.stats.wantToTryCount}
              </span>
            </div>
          </div>
        </div>

        {profile.reviews.length > 0 && (
          <div>
            <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
              Recent Reviews
            </h2>
            <div className="space-y-4">
              {profile.reviews.map((review) => (
                <div
                  key={review.id}
                  className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800/60"
                >
                  <div className="flex gap-4">
                    {review.movie?.poster_path && (
                      <Image
                        src={`https://image.tmdb.org/t/p/w200${review.movie.poster_path}`}
                        alt={review.movie.title}
                        width={80}
                        height={120}
                        className="h-24 w-16 rounded-lg object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {review.movie?.title || "Unknown Movie"}
                      </h3>
                      <div className="mt-1 flex items-center gap-2">
                        <div className="flex items-center">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <span
                              key={i}
                              className={
                                i < Math.floor(review.rating)
                                  ? "text-yellow-400"
                                  : "text-gray-300"
                              }
                            >
                              ★
                            </span>
                          ))}
                        </div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {review.rating.toFixed(1)}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {isLoggedIn && (
          <div className="mt-8">
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="w-full rounded-full border border-red-200 bg-red-50 px-6 py-3 text-base font-medium text-red-600 transition hover:bg-red-100 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
            >
              Sign Out
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
