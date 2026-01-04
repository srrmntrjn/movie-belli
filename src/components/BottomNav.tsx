"use client";

import { usePathname, useRouter } from "next/navigation";
import { Home, Search, User } from "lucide-react";
import { useState } from "react";

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Don't show on landing page
  if (pathname === "/") {
    return null;
  }

  const isActive = (path: string) => pathname === path;

  return (
    <>
      {/* Profile Menu Overlay */}
      {showProfileMenu && (
        <div
          className="fixed inset-0 z-40 bg-black/20"
          onClick={() => setShowProfileMenu(false)}
        >
          <div
            className="absolute bottom-20 right-4 w-56 rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-800"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                router.push("/my-reviews");
                setShowProfileMenu(false);
              }}
              className="flex w-full items-center gap-3 rounded-t-2xl border-b border-gray-100 px-4 py-3 text-left transition hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
                <User className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">My Reviews</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">View your ranked movies</p>
              </div>
            </button>
            <button
              onClick={() => {
                router.push("/following");
                setShowProfileMenu(false);
              }}
              className="flex w-full items-center gap-3 rounded-b-2xl px-4 py-3 text-left transition hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">Following</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">People you follow</p>
              </div>
            </button>
          </div>
        </div>
      )}

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
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className={`flex flex-col items-center gap-1 transition ${
              isActive("/my-reviews") || isActive("/following")
                ? "text-purple-600 dark:text-purple-400"
                : "text-gray-600 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400"
            }`}
          >
            <User
              className={`h-6 w-6 ${
                isActive("/my-reviews") || isActive("/following") ? "fill-current" : ""
              }`}
            />
            <span className="text-xs font-medium">Profile</span>
          </button>
        </div>
      </nav>

      {/* Spacer to prevent content from being hidden behind bottom nav */}
      <div className="h-20" />
    </>
  );
}
