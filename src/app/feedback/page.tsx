"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Loader2,
  Lightbulb,
  Bug,
  ArrowUp,
  ArrowDown,
  Send,
} from "lucide-react";

type RequestType = "FEATURE" | "BUG";

interface RequestItem {
  id: string;
  title: string;
  description: string;
  type: RequestType;
  status: string;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
  };
  score: number;
  upvotes: number;
  downvotes: number;
  viewerVote: number;
}

export default function FeedbackPage() {
  const { status } = useSession();
  const router = useRouter();
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "FEATURE" as RequestType,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/");
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") {
      return;
    }
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/feedback/requests");
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data.error || "Unable to load feedback");
        }
        if (!cancelled) {
          setRequests(data.requests || []);
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load feedback");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [status]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/feedback/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Failed to submit request");
      }
      setRequests((prev) => [data.request, ...prev]);
      setForm({ title: "", description: "", type: form.type });
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  };

  const castVote = async (requestId: string, value: number) => {
    try {
      const response = await fetch(`/api/feedback/requests/${requestId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Failed to vote");
      }
      setRequests((prev) =>
        prev.map((item) =>
          item.id === requestId
            ? {
                ...item,
                score: data.score,
                upvotes: data.upvotes,
                downvotes: data.downvotes,
                viewerVote: data.viewerVote,
              }
            : item
        )
      );
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to vote");
    }
  };

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-10 dark:from-gray-900 dark:to-gray-800">
      <div className="mx-auto max-w-5xl px-4">
        <div className="mb-8 text-center">
          <p className="text-sm uppercase tracking-wide text-purple-600 dark:text-purple-300">
            Community Board
          </p>
          <h1 className="mt-2 text-4xl font-bold text-gray-900 dark:text-white">
            Feature Requests & Bugs
          </h1>
          <p className="mt-3 text-base text-gray-600 dark:text-gray-300">
            Tell us what to build next and vote on the ideas that matter to you.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
          <section className="rounded-3xl bg-white p-6 shadow-xl dark:bg-gray-900">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Submit an idea
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Share feedback about new features or report a pesky bug.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, type: "FEATURE" }))}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                    form.type === "FEATURE"
                      ? "border-purple-500 bg-purple-50 text-purple-700"
                      : "border-gray-200 text-gray-500 hover:border-purple-200"
                  }`}
                >
                  <Lightbulb className="h-4 w-4" /> Feature
                </button>
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, type: "BUG" }))}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                    form.type === "BUG"
                      ? "border-amber-500 bg-amber-50 text-amber-700"
                      : "border-gray-200 text-gray-500 hover:border-amber-200"
                  }`}
                >
                  <Bug className="h-4 w-4" /> Bug
                </button>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Title
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, title: event.target.value }))
                  }
                  placeholder="Summarize your idea in a few words"
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm shadow-sm transition focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Details
                </label>
                <textarea
                  value={form.description}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, description: event.target.value }))
                  }
                  placeholder="Explain the problem or describe the feature."
                  rows={4}
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm shadow-sm transition focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-purple-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-purple-700 disabled:opacity-70"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Submit feedback
              </button>
            </form>
          </section>

          <section className="rounded-3xl bg-white p-6 shadow-xl dark:bg-gray-900">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Community board
              </h2>
              <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700 dark:bg-purple-500/10 dark:text-purple-200">
                {requests.length} ideas
              </span>
            </div>

            {error && (
              <div className="mt-4 rounded-2xl bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-300">
                {error}
              </div>
            )}

            {loading ? (
              <div className="mt-8 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
              </div>
            ) : requests.length === 0 ? (
              <div className="mt-8 rounded-2xl border border-dashed border-gray-300 p-6 text-center text-gray-500 dark:border-gray-700 dark:text-gray-400">
                No feedback yet. Be the first to share an idea!
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                {requests.map((item) => (
                  <RequestCard key={item.id} request={item} onVote={castVote} />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function RequestCard({
  request,
  onVote,
}: {
  request: RequestItem;
  onVote: (id: string, value: number) => void;
}) {
  const { id, title, description, type, status, score, viewerVote, createdAt } = request;
  const badgeStyles =
    type === "BUG"
      ? "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-200"
      : "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-200";

  const statusLabel = status.replace(/_/g, " ").toLowerCase();

  const toggleVote = (value: number) => {
    const nextValue = viewerVote === value ? 0 : value;
    onVote(id, nextValue);
  };

  return (
    <div className="flex gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-purple-200 dark:border-gray-800 dark:bg-gray-800">
      <div className="flex flex-col items-center gap-2">
        <button
          aria-label="Upvote"
          onClick={() => toggleVote(1)}
          className={`rounded-full border p-1 transition ${
            viewerVote === 1
              ? "border-green-500 bg-green-50 text-green-600"
              : "border-gray-200 text-gray-500 hover:border-green-200"
          } dark:border-gray-700 dark:text-gray-400 dark:hover:border-green-400`}
        >
          <ArrowUp className="h-4 w-4" />
        </button>
        <span className="text-lg font-semibold text-gray-900 dark:text-white">
          {score}
        </span>
        <button
          aria-label="Downvote"
          onClick={() => toggleVote(-1)}
          className={`rounded-full border p-1 transition ${
            viewerVote === -1
              ? "border-red-500 bg-red-50 text-red-600"
              : "border-gray-200 text-gray-500 hover:border-red-200"
          } dark:border-gray-700 dark:text-gray-400 dark:hover:border-red-400`}
        >
          <ArrowDown className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeStyles}`}>
            {type === "BUG" ? "Bug" : "Feature"}
          </span>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
            {statusLabel}
          </span>
          <span className="text-xs text-gray-400">
            {new Date(createdAt).toLocaleDateString()}
          </span>
        </div>
        <h3 className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">
          {title}
        </h3>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{description}</p>
      </div>
    </div>
  );
}
