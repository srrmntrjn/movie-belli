import Link from "next/link";
import { Lightbulb } from "lucide-react";

export function TopNav() {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
        <span className="text-xl font-bold text-gray-900 dark:text-white">
          tivi
        </span>
        <Link
          href="/feedback"
          className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm font-medium text-gray-700 backdrop-blur-sm transition-colors hover:bg-white dark:bg-gray-800/80 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          <Lightbulb className="h-4 w-4" />
          Feedback
        </Link>
      </div>
    </header>
  );
}
