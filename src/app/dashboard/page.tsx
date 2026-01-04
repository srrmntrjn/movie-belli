"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Film, LogOut, User, Mail, Search, Star, Users, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { UserCard } from "@/components/user/UserCard";
import { ActivityFeedItem, type ActivityFeedEntry } from "@/components/feed/ActivityFeedItem";
import { MovieDetailModal } from "@/components/movie/MovieDetailModal";
import type { Movie } from "@/lib/tmdb";

interface SearchResultUser {
  id: string;
  name: string;
  username?: string | null;
  image?: string | null;
  bio?: string | null;
  isFollowing: boolean;
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResultUser[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [feedItems, setFeedItems] = useState<ActivityFeedEntry[]>([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        searchUsers(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const searchUsers = async (query: string) => {
    setSearchLoading(true);
    try {
      const response = await fetch(
        `/api/users/search?q=${encodeURIComponent(query)}`
      );
      if (response.ok) {
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
        setSearchResults(usersWithStatus);
      }
    } catch (error) {
      console.error("Error searching users:", error);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleFollowToggle = (userId: string, following: boolean) => {
    setSearchResults((prev) =>
      prev.map((user) =>
        user.id === userId ? { ...user, isFollowing: following } : user
      )
    );
  };

  useEffect(() => {
    if (status !== "authenticated") {
      return;
    }

    let isMounted = true;
    const loadFeed = async () => {
      setFeedLoading(true);
      setFeedError(null);
      try {
        const response = await fetch("/api/feed");
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data.error || "Unable to load activity feed");
        }
        if (isMounted) {
          setFeedItems(data.feed || []);
        }
      } catch (error) {
        console.error("Error loading activity feed:", error);
        if (isMounted) {
          setFeedError(
            error instanceof Error
              ? error.message
              : "Unable to load activity feed"
          );
        }
      } finally {
        if (isMounted) {
          setFeedLoading(false);
        }
      }
    };

    loadFeed();
    return () => {
      isMounted = false;
    };
  }, [status]);

  const handleMovieSelect = (movie: Movie) => {
    setSelectedMovie(movie);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedMovie(null);
  };

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/50 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-900/50">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-purple-600 p-2">
              <Film className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              Movie Belli
            </span>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex items-center gap-2 rounded-full bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Welcome to Movie Belli!
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Your infrastructure is set up and authentication is working perfectly.
          </p>
        </div>

        {/* User Info Card */}
        <div className="rounded-2xl bg-white p-8 shadow-lg dark:bg-gray-800">
          <div className="flex items-start gap-6">
            {session.user?.image && (
              <Image
                src={session.user.image}
                alt={session.user.name || "User"}
                width={80}
                height={80}
                className="rounded-full"
              />
            )}
            <div className="flex-1">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                {session.user?.name}
              </h2>
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                  <Mail className="h-5 w-5" />
                  <span>{session.user?.email}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                  <User className="h-5 w-5" />
                  <span>User ID: {session.user?.id || "N/A"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h3 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
            Quick Actions
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              href="/search"
              className="flex items-center gap-4 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
            >
              <div className="rounded-full bg-white/20 p-3">
                <Search className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-semibold">Search Movies</h4>
                <p className="text-sm text-white/80">Find your next watch</p>
              </div>
            </Link>
            <Link
              href="/my-reviews"
              className="flex items-center gap-4 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 p-6 text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
            >
              <div className="rounded-full bg-white/20 p-3">
                <Star className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-semibold">My Reviews</h4>
                <p className="text-sm text-white/80">View your rated movies</p>
              </div>
            </Link>
            <Link
              href="/following"
              className="flex items-center gap-4 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 p-6 text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
            >
              <div className="rounded-full bg-white/20 p-3">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-semibold">Following</h4>
                <p className="text-sm text-white/80">Manage people you follow</p>
              </div>
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.6fr,1fr]">
          {/* User Search */}
          <section id="find-users">
            <h3 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
              Find Users
            </h3>
            <div className="rounded-2xl bg-white p-6 shadow-lg dark:bg-gray-800">
              {/* Search Input */}
              <div className="relative mb-4">
                <Users className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or username..."
                  className="w-full rounded-full border border-gray-300 bg-white py-3 pl-12 pr-4 text-base shadow transition-all focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                />
                {searchLoading && (
                  <Loader2 className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin text-purple-600" />
                )}
              </div>

              {/* Search Results */}
              {searchQuery && (
                <div className="space-y-2">
                  {searchLoading && searchResults.length === 0 ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                    </div>
                  ) : searchResults.length > 0 ? (
                    <>
                      <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">
                        Found {searchResults.length} user{searchResults.length !== 1 ? "s" : ""}
                      </p>
                      <div className="space-y-2">
                        {searchResults.map((user) => (
                          <UserCard
                            key={user.id}
                            user={user}
                            showFollowButton
                            isFollowing={user.isFollowing}
                            onFollowToggle={handleFollowToggle}
                          />
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                      No users found matching &ldquo;{searchQuery}&rdquo;
                    </div>
                  )}
                </div>
              )}

              {/* Initial State */}
              {!searchQuery && (
                <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                  Search for users by name or username
                </div>
              )}
            </div>
          </section>

          {/* Activity Feed */}
          <section>
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Recent Activity from People You Follow
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Stay up to date with new reviews and ratings
              </p>
            </div>

            {feedLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, index) => (
                  <div
                    key={index}
                    className="h-24 animate-pulse rounded-2xl bg-white/60 dark:bg-gray-800/60"
                  />
                ))}
              </div>
            ) : feedError ? (
              <div className="rounded-2xl bg-red-50 p-4 text-red-600 dark:bg-red-900/20 dark:text-red-300">
                {feedError}
              </div>
            ) : feedItems.length === 0 ? (
              <div className="rounded-2xl bg-white p-10 text-center shadow-lg dark:bg-gray-800">
                <p className="text-gray-600 dark:text-gray-400">
                  Follow users to see their activity here.
                </p>
                <Link
                  href="/dashboard#find-users"
                  className="mt-4 inline-flex items-center justify-center rounded-full bg-purple-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-purple-700"
                >
                  Find users to follow
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {feedItems.map((entry) => (
                  <ActivityFeedItem
                    key={entry.id}
                    entry={entry}
                    onSelectMovie={handleMovieSelect}
                  />
                ))}
              </div>
            )}
          </section>
        </div>

      </main>
      <MovieDetailModal
        movie={selectedMovie}
        isOpen={isModalOpen}
        onClose={closeModal}
      />
    </div>
  );
}
