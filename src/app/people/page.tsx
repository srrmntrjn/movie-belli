"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2, Users as UsersIcon } from "lucide-react";
import { UserCard } from "@/components/user/UserCard";

interface SearchResultUser {
  id: string;
  name: string;
  username?: string | null;
  image?: string | null;
  bio?: string | null;
  isFollowing: boolean;
}

export default function PeoplePage() {
  const { status } = useSession();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultUser[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/");
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") {
      return;
    }
    const timer = setTimeout(() => {
      if (query.trim()) {
        searchUsers(query);
      } else {
        setResults([]);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [query, status]);

  const searchUsers = async (term: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(term)}`);
      if (!response.ok) {
        throw new Error("Failed to search users");
      }
      const data = await response.json();
      const usersWithStatus: SearchResultUser[] = (data.users || []).map(
        (
          user: Omit<SearchResultUser, "isFollowing"> & {
            isFollowing?: boolean;
          }
        ) => ({
          ...user,
          isFollowing: Boolean(user.isFollowing),
        })
      );
      setResults(usersWithStatus);
    } catch (error) {
      console.error("Error searching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = (userId: string, following: boolean) => {
    setResults((prev) =>
      prev.map((user) => (user.id === userId ? { ...user, isFollowing: following } : user))
    );
  };

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-12 dark:from-gray-900 dark:to-gray-800">
      <div className="mx-auto max-w-4xl px-4">
        <div className="text-center">
          <p className="text-sm uppercase tracking-wide text-purple-600 dark:text-purple-300">
            Community
          </p>
          <h1 className="mt-2 text-4xl font-bold text-gray-900 dark:text-white">Find People</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Follow friends and discover new curators to power your activity feed.
          </p>
        </div>

        <div className="mt-10 rounded-3xl bg-white p-6 shadow-2xl dark:bg-gray-900">
          <div className="relative mb-6">
            <UsersIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name or username..."
              className="w-full rounded-full border border-gray-300 bg-white py-3 pl-12 pr-4 text-base shadow transition-all focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
            {loading && (
              <Loader2 className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin text-purple-600" />
            )}
          </div>

          {query.trim().length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 p-8 text-center text-gray-500 dark:border-gray-700 dark:text-gray-400">
              Start typing to discover people on tivi.
            </div>
          ) : results.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 p-8 text-center text-gray-500 dark:border-gray-700 dark:text-gray-400">
              No users found matching “{query}”.
            </div>
          ) : (
            <div className="space-y-3">
              {results.map((user) => (
                <UserCard
                  key={user.id}
                  user={user}
                  showFollowButton
                  isFollowing={user.isFollowing}
                  onFollowToggle={handleFollowToggle}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
