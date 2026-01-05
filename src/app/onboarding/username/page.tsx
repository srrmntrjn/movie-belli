"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

const MIN_LENGTH = 3;
const MAX_LENGTH = 20;
const USERNAME_REGEX = /^[a-z0-9_]+$/i;

export default function UsernameOnboardingPage() {
  const router = useRouter();
  const { data: session, status, update } = useSession();
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.username) {
      router.replace("/dashboard");
    }
  }, [status, session?.user?.username, router]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="rounded-full border border-white/50 px-6 py-3 text-gray-600 dark:text-gray-300">
          Checking your session…
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 text-center">
        <div className="space-y-4">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Sign in to pick a username
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            You need to be signed in before choosing a username.
          </p>
          <button
            onClick={() => router.replace("/")}
            className="rounded-full bg-white px-6 py-3 text-sm font-medium text-gray-900 shadow"
          >
            Return home
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = username.trim().replace(/^@/, "");

    if (trimmed.length < MIN_LENGTH || trimmed.length > MAX_LENGTH) {
      setError(`Username must be ${MIN_LENGTH}-${MAX_LENGTH} characters.`);
      return;
    }

    if (!USERNAME_REGEX.test(trimmed)) {
      setError("Usernames can only use letters, numbers, and underscores.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/users/me/username", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username: trimmed }),
      });

      const payload = await response.json();

      if (!response.ok) {
        setError(payload?.error ?? "Unable to save username.");
        return;
      }

      await update({ username: trimmed });
      router.replace("/dashboard");
    } catch (err) {
      console.error("Failed to set username", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 px-4 dark:from-gray-900 dark:to-gray-800">
      <main className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl dark:bg-gray-900">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Create your username
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
          This is how friends will find you on tivi.
        </p>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Username
            <div className="mt-2 flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 focus-within:border-purple-400 focus-within:ring-2 focus-within:ring-purple-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white">
              <span className="text-gray-400">@</span>
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="yourname"
                className="flex-1 bg-transparent text-sm outline-none"
              />
            </div>
          </label>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {MIN_LENGTH}-{MAX_LENGTH} characters. Letters, numbers, and underscores only.
          </p>
          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-300">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center rounded-full bg-purple-600 px-6 py-3 text-sm font-medium text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Saving…" : "Save username"}
          </button>
        </form>
      </main>
    </div>
  );
}
