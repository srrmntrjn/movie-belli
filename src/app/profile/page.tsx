"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Check, Bookmark, ChevronRight, Loader2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface ProfileStats {
  followers: number;
  following: number;
  beenCount: number;
  wantToTryCount: number;
  rank: number;
}

interface ProfileData {
  user: {
    id: string;
    name: string | null;
    username: string | null;
    email: string;
    image: string | null;
    bio: string | null;
    memberSince: string;
  };
  stats: ProfileStats;
}

interface Review {
  id: string;
  rating: number;
  createdAt: string;
  updatedAt: string;
  movie: {
    id: number;
    title: string;
    overview: string;
    poster_path: string | null;
    backdrop_path: string | null;
    release_date: string;
    vote_average: number;
    vote_count: number;
  } | null;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchProfileData();
      fetchReviews();
    }
  }, [status]);

  const fetchProfileData = async () => {
    try {
      const response = await fetch("/api/users/me/profile");
      if (response.ok) {
        const data = await response.json();
        setProfileData(data);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await fetch("/api/users/me/reviews");
      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews.slice(0, 10)); // Get latest 10 reviews
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
    }
  };

  const formatMemberSince = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!session || !profileData) {
    return null;
  }

  const displayName = profileData.user.name || profileData.user.email;
  const username = profileData.user.username || "user";
  const memberSince = formatMemberSince(profileData.user.memberSince);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 pb-24 dark:from-gray-900 dark:to-gray-800">
      <main className="mx-auto max-w-2xl px-4 py-8">
        {/* Profile Section */}
        <div className="mb-8 text-center">
          {/* Profile Image */}
          <div className="mb-4 flex justify-center">
            {profileData.user.image ? (
              <Image
                src={profileData.user.image}
                alt={displayName}
                width={160}
                height={160}
                className="h-40 w-40 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-40 w-40 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-blue-600 text-5xl font-bold text-white">
                {displayName[0].toUpperCase()}
              </div>
            )}
          </div>

          {/* Username */}
          <p className="mb-1 text-xl font-semibold text-gray-900 dark:text-white">
            @{username}
          </p>

          {/* Member Since */}
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
            Member since {memberSince}
          </p>

          {/* Stats */}
          <div className="mb-6 grid grid-cols-2 gap-4">
            <Link href="/followers" className="transition hover:opacity-70">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {profileData.stats.followers}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Followers
              </p>
            </Link>
            <Link href="/following" className="transition hover:opacity-70">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {profileData.stats.following}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Following
              </p>
            </Link>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button className="flex-1 rounded-full border border-gray-300 bg-white px-6 py-3 text-base font-medium text-gray-900 transition hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700">
              Edit profile
            </button>
            <button className="flex-1 rounded-full border border-gray-300 bg-white px-6 py-3 text-base font-medium text-gray-900 transition hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700">
              Share profile
            </button>
          </div>
        </div>

        {/* Watched & Want to Try Sections */}
        <div className="mb-8 space-y-2">
          <Link
            href="/my-reviews"
            className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-4 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800/60 dark:hover:bg-gray-800"
          >
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
                {profileData.stats.beenCount}
              </span>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </div>
          </Link>

          <Link
            href="/watchlist"
            className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-4 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800/60 dark:hover:bg-gray-800"
          >
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
                {profileData.stats.wantToTryCount}
              </span>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </div>
          </Link>
        </div>

        {/* Recent Reviews Feed */}
        {reviews.length > 0 && (
          <div>
            <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
              Recent Reviews
            </h2>
            <div className="space-y-4">
              {reviews.map((review) => (
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

        {/* Sign Out Button */}
        <div className="mt-8">
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="w-full rounded-full border border-red-200 bg-red-50 px-6 py-3 text-base font-medium text-red-600 transition hover:bg-red-100 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
          >
            Sign Out
          </button>
        </div>
      </main>
    </div>
  );
}
