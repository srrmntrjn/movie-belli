"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2, Users, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { UserCard } from "@/components/user/UserCard";

interface FollowingUser {
  id: string;
  name: string;
  username?: string | null;
  image?: string | null;
  bio?: string | null;
  followedAt: string;
}

export default function FollowingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [following, setFollowing] = useState<FollowingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchFollowing();
    }
  }, [status]);

  const fetchFollowing = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/users/me/following");
      if (!response.ok) {
        throw new Error("Failed to load following list");
      }
      const data = await response.json();
      setFollowing(data.following || []);
    } catch (err) {
      console.error("Error loading following:", err);
      setError("Unable to load your following list. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = (userId: string, isFollowing: boolean) => {
    if (!isFollowing) {
      setFollowing((prev) => prev.filter((user) => user.id !== userId));
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
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="rounded-full bg-white/70 p-2 shadow hover:bg-white dark:bg-gray-800/70 dark:hover:bg-gray-800"
          >
            <ArrowLeft className="h-5 w-5 text-gray-700 dark:text-gray-200" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Following
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {following.length} user{following.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl bg-red-50 p-4 text-red-700 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          </div>
        ) : following.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl bg-white p-10 text-center shadow-lg dark:bg-gray-800">
            <Users className="mb-4 h-12 w-12 text-gray-400 dark:text-gray-500" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              You&apos;re not following anyone yet
            </h3>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Discover and follow users to see their reviews in your feed.
            </p>
            <Link
              href="/dashboard"
              className="mt-6 rounded-full bg-purple-600 px-6 py-3 text-white shadow-lg transition hover:bg-purple-700"
            >
              Find people to follow
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {following.map((user) => (
              <div key={user.id} className="space-y-2">
                <UserCard
                  user={user}
                  showFollowButton
                  isFollowing
                  onFollowToggle={handleFollowToggle}
                />
                <p className="pl-4 text-sm text-gray-500 dark:text-gray-400">
                  Following since {format(new Date(user.followedAt), "MMM d, yyyy")}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
