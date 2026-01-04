"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Film, LogOut, User, Mail, Star, Users, Loader2, Lightbulb, Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ActivityFeedItem, type ActivityFeedEntry } from "@/components/feed/ActivityFeedItem";
import { MovieDetailModal } from "@/components/movie/MovieDetailModal";
import type { Movie } from "@/lib/tmdb";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
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

        <div className="mt-8 grid gap-8 lg:grid-cols-[320px,1fr]">
          <aside className="space-y-6">
            <SidebarCard
              title="My Reviews"
              description="Browse every movie you’ve stack ranked so far."
              actionLabel="Go to My Reviews"
              href="/my-reviews"
            />
            <SidebarCard
              title="People I Follow"
              description="See the people inspiring your feed."
              actionLabel="Manage Following"
              href="/following"
            />
          </aside>

          <div className="space-y-8">
            <section className="rounded-3xl bg-gradient-to-br from-purple-600 to-blue-600 p-8 text-white shadow-xl">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-wide text-white/80">
                    Ready for something new?
                  </p>
                  <h3 className="mt-2 text-3xl font-bold">Search the Movie Library</h3>
                  <p className="mt-2 max-w-xl text-white/80">
                    Explore titles, log your ranking, and keep refining your stack as you watch.
                  </p>
                </div>
                <Link
                  href="/search"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-purple-700 shadow-lg transition hover:scale-105"
                >
                  <Search className="h-5 w-5" />
                  Launch search
                </Link>
              </div>
            </section>

            <section>
              <h3 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
                Quick Actions
              </h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Link
                  href="/my-reviews"
                  className="flex items-center gap-4 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 p-6 text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
                >
                  <div className="rounded-full bg-white/20 p-3">
                    <Star className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-semibold">My Reviews</h4>
                    <p className="text-sm text-white/80">View your ranked movies</p>
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
                <Link
                  href="/people"
                  className="flex items-center gap-4 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 p-6 text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
                >
                  <div className="rounded-full bg-white/20 p-3">
                    <Users className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Find People</h4>
                    <p className="text-sm text-white/80">Search the community</p>
                  </div>
                </Link>
                <Link
                  href="/feedback"
                  className="flex items-center gap-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 p-6 text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
                >
                  <div className="rounded-full bg-white/20 p-3">
                    <Lightbulb className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Feedback Board</h4>
                    <p className="text-sm text-white/80">Request or vote on ideas</p>
                  </div>
                </Link>
              </div>
            </section>

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
                    href="/people"
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

function SidebarCard({
  title,
  description,
  actionLabel,
  href,
}: {
  title: string;
  description: string;
  actionLabel: string;
  href: string;
}) {
  return (
    <details
      className="group rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition dark:border-gray-800 dark:bg-gray-900"
      open
    >
      <summary className="flex cursor-pointer items-center justify-between text-left text-lg font-semibold text-gray-900 transition group-open:text-purple-600 dark:text-white">
        {title}
        <span className="text-xs font-medium text-gray-400 group-open:text-purple-500">
          Toggle
        </span>
      </summary>
      <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">{description}</p>
      <Link
        href={href}
        className="mt-4 inline-flex items-center justify-center rounded-full bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-700"
      >
        {actionLabel}
      </Link>
    </details>
  );
}
