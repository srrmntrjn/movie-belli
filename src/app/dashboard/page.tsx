"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Film,
  LogOut,
  Star,
  Users,
  Lightbulb,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { ActivityFeedItem, type ActivityFeedEntry } from "@/components/feed/ActivityFeedItem";
import { MovieDetailModal } from "@/components/movie/MovieDetailModal";
import type { Movie } from "@/lib/tmdb";

type QuickAction = {
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
  accent: string;
};

const QUICK_ACTIONS: QuickAction[] = [
  {
    label: "My Reviews",
    description: "View your ranked movies",
    href: "/my-reviews",
    icon: Star,
    accent: "from-pink-500 to-purple-600",
  },
  {
    label: "Following",
    description: "Manage people you follow",
    href: "/following",
    icon: Users,
    accent: "from-indigo-500 to-sky-500",
  },
  {
    label: "Find People",
    description: "Search the community",
    href: "/people",
    icon: Search,
    accent: "from-blue-500 to-cyan-500",
  },
  {
    label: "Feedback Board",
    description: "Request or vote on ideas",
    href: "/feedback",
    icon: Lightbulb,
    accent: "from-amber-500 to-orange-500",
  },
];

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [feedItems, setFeedItems] = useState<ActivityFeedEntry[]>([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);

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
      <QuickActionsDrawer
        actions={QUICK_ACTIONS}
        isOpen={quickActionsOpen}
        onToggle={() => setQuickActionsOpen((prev) => !prev)}
      />
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/60 backdrop-blur-sm dark:border-gray-800/60">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-purple-600 p-2">
              <Film className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              Movie Belli
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden rounded-xl border border-gray-200 bg-white/80 px-4 py-2 text-xs text-gray-600 dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-300 sm:block">
              <p className="font-semibold text-gray-900 dark:text-white">
                {session.user?.email}
              </p>
              <p className="mt-1 truncate text-[11px] text-gray-500">
                ID: {session.user?.id || "N/A"}
              </p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-2 py-6 sm:px-4">
        <section className="space-y-4">
          <div className="flex flex-col gap-2 px-2 sm:flex-row sm:items-end sm:justify-between sm:px-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-purple-600 dark:text-purple-300">
                Live from your circle
              </p>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Recent activity
              </h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Stack ranking updates from the people you follow.
            </p>
          </div>
          {feedLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, index) => (
                <div
                  key={index}
                  className="h-24 w-full animate-pulse rounded-2xl bg-white/60 dark:bg-gray-800/60"
                />
              ))}
            </div>
          ) : feedError ? (
            <div className="w-full rounded-2xl bg-red-50 p-4 text-red-600 dark:bg-red-900/20 dark:text-red-300">
              {feedError}
            </div>
          ) : feedItems.length === 0 ? (
            <div className="w-full rounded-2xl bg-purple-50 p-6 text-center shadow-inner dark:bg-purple-900/20">
              <p className="text-gray-600 dark:text-gray-300">
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

        <div className="mt-10 space-y-8 px-2 sm:px-4">
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

          <section className="md:hidden">
            <h3 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
              Quick Actions
            </h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {QUICK_ACTIONS.map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.href}
                    href={action.href}
                    className={`flex items-center gap-4 rounded-xl bg-gradient-to-r ${action.accent} p-6 text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl`}
                  >
                    <div className="rounded-full bg-white/20 p-3">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="font-semibold">{action.label}</h4>
                      <p className="text-sm text-white/80">{action.description}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
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

function QuickActionsDrawer({
  actions,
  isOpen,
  onToggle,
}: {
  actions: QuickAction[];
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="fixed left-4 top-1/3 z-40 hidden md:block">
      <div className="relative">
        <button
          type="button"
          onClick={onToggle}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-purple-600 text-white shadow-2xl transition hover:bg-purple-700 focus:outline-none focus:ring-4 focus:ring-purple-300 dark:hover:bg-purple-500 dark:focus:ring-purple-800"
          aria-expanded={isOpen}
          aria-label="Toggle quick actions"
        >
          {isOpen ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
        </button>
        <div
          className={`absolute left-16 top-1/2 w-72 -translate-y-1/2 transform transition-all duration-300 ${
            isOpen ? "translate-x-0 opacity-100" : "-translate-x-6 opacity-0 pointer-events-none"
          }`}
        >
          <div className="rounded-3xl border border-purple-200/70 bg-white/90 p-5 shadow-2xl backdrop-blur dark:border-purple-900/40 dark:bg-gray-900/90">
            <p className="text-xs font-semibold uppercase tracking-wide text-purple-600 dark:text-purple-300">
              Quick Actions
            </p>
            <nav className="mt-4 space-y-2">
              {actions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white/80 p-3 text-left text-sm font-medium text-gray-900 shadow-sm transition hover:translate-x-1 hover:border-purple-200 hover:bg-purple-50 dark:border-gray-800/70 dark:bg-gray-900/80 dark:text-gray-100 dark:hover:border-purple-700 dark:hover:bg-gray-800"
                  >
                    <div className={`rounded-2xl bg-gradient-to-br ${action.accent} p-2 text-white`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p>{action.label}</p>
                      <p className="text-xs font-normal text-gray-500 dark:text-gray-400">
                        {action.description}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
}
