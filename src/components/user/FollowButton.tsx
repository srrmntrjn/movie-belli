'use client';

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

interface FollowButtonProps {
  userId: string;
  initialFollowing: boolean;
  onFollowChange?: (isFollowing: boolean) => void;
}

export function FollowButton({
  userId,
  initialFollowing,
  onFollowChange,
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialFollowing);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setIsFollowing(initialFollowing);
  }, [initialFollowing]);

  const handleToggle = async () => {
    if (isLoading) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/follows", {
        method: isFollowing ? "DELETE" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update follow status");
      }

      setIsFollowing(!isFollowing);
      onFollowChange?.(!isFollowing);
    } catch (error) {
      console.error("Follow action failed:", error);
      setErrorMessage("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const buttonLabel = isFollowing ? "Following" : "Follow";

  return (
    <div className="flex flex-col items-end">
      <button
        onClick={handleToggle}
        disabled={isLoading}
        className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
          isFollowing
            ? "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            : "bg-purple-600 text-white hover:bg-purple-700"
        } ${isLoading ? "opacity-75" : ""}`}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        {buttonLabel}
      </button>
      {errorMessage && (
        <span className="mt-1 text-xs text-red-500">{errorMessage}</span>
      )}
    </div>
  );
}
