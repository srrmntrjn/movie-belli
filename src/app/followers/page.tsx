"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface Follower {
  id: string;
  name: string | null;
  username: string | null;
  email: string;
  image: string | null;
  followersCount: number;
  followingCount: number;
  ratingsCount: number;
  followedAt: string;
  isFollowing: boolean;
}

export default function FollowersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [loading, setLoading] = useState(true);
  const [followingStates, setFollowingStates] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchFollowers();
    }
  }, [status]);

  const fetchFollowers = async () => {
    try {
      const response = await fetch("/api/users/me/followers");
      if (response.ok) {
        const data = await response.json();
        setFollowers(data.followers);
        // Initialize following states
        const states: Record<string, boolean> = {};
        data.followers.forEach((follower: Follower) => {
          states[follower.id] = follower.isFollowing;
        });
        setFollowingStates(states);
      }
    } catch (error) {
      console.error("Error fetching followers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async (userId: string) => {
    const isCurrentlyFollowing = followingStates[userId];

    try {
      const response = await fetch("/api/follows", {
        method: isCurrentlyFollowing ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        setFollowingStates((prev) => ({
          ...prev,
          [userId]: !isCurrentlyFollowing,
        }));
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 pb-24 dark:from-gray-900 dark:to-gray-800">
      <main className="mx-auto max-w-2xl px-4 py-8">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="mb-4 inline-flex items-center gap-2 text-gray-700 transition hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
        >
          <ArrowLeft className="h-5 w-5" />
          Back
        </button>

        {/* Title */}
        <h1 className="mb-6 text-3xl font-bold text-gray-900 dark:text-white">
          Followers
        </h1>

        {/* Followers List */}
        {followers.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-800/60">
            <p className="text-gray-600 dark:text-gray-400">
              You don&apos;t have any followers yet.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {followers.map((follower) => (
              <div
                key={follower.id}
                className="flex items-center justify-between py-4"
              >
                {/* User Info */}
                <Link
                  href={`/users/${follower.id}`}
                  className="flex items-center gap-3 flex-1"
                >
                  {/* Profile Image */}
                  {follower.image ? (
                    <Image
                      src={follower.image}
                      alt={follower.name || follower.email}
                      width={48}
                      height={48}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-blue-600 text-lg font-bold text-white">
                      {(follower.name || follower.email)[0].toUpperCase()}
                    </div>
                  )}

                  {/* Name */}
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {follower.name || follower.email}
                    </p>
                    {follower.username && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        @{follower.username}
                      </p>
                    )}
                  </div>
                </Link>

                {/* Follow/Following Button */}
                {followingStates[follower.id] ? (
                  <button
                    onClick={() => handleFollowToggle(follower.id)}
                    className="text-sm font-medium text-gray-600 transition hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    Following
                  </button>
                ) : (
                  <button
                    onClick={() => handleFollowToggle(follower.id)}
                    className="rounded-full bg-purple-600 px-6 py-2 text-sm font-medium text-white transition hover:bg-purple-700"
                  >
                    Follow
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
