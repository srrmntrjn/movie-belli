"use client";

import { usePathname, useRouter } from "next/navigation";
import { Home, Search, User } from "lucide-react";

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  // Don't show on landing page
  if (pathname === "/") {
    return null;
  }

  const isActive = (path: string) => pathname === path;
  const isProfileActive = pathname === "/profile" || pathname === "/my-reviews" || pathname === "/following" || pathname === "/watchlist";

  return (
    <>
      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-gray-200 bg-white/80 backdrop-blur-lg dark:border-gray-800 dark:bg-gray-900/80">
        <div className="mx-auto flex max-w-md items-center justify-around px-4 py-3">
          {/* Home Button */}
          <button
            onClick={() => router.push("/dashboard")}
            className={`flex flex-col items-center gap-1 transition ${
              isActive("/dashboard")
                ? "text-purple-600 dark:text-purple-400"
                : "text-gray-600 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400"
            }`}
          >
            <Home className={`h-6 w-6 ${isActive("/dashboard") ? "fill-current" : ""}`} />
            <span className="text-xs font-medium">Home</span>
          </button>

          {/* Search/Add Button */}
          <button
            onClick={() => router.push("/search")}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-blue-600 text-white shadow-lg transition hover:scale-105 hover:shadow-xl"
          >
            <Search className="h-6 w-6" />
          </button>

          {/* Profile Button */}
          <button
            onClick={() => router.push("/profile")}
            className={`flex flex-col items-center gap-1 transition ${
              isProfileActive
                ? "text-purple-600 dark:text-purple-400"
                : "text-gray-600 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400"
            }`}
          >
            <User className={`h-6 w-6 ${isProfileActive ? "fill-current" : ""}`} />
            <span className="text-xs font-medium">Profile</span>
          </button>
        </div>
      </nav>

      {/* Spacer to prevent content from being hidden behind bottom nav */}
      <div className="h-20" />
    </>
  );
}
