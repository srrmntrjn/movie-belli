import Image from "next/image";
import Link from "next/link";
import { User as UserIcon } from "lucide-react";

interface UserCardProps {
  user: {
    id: string;
    name: string;
    username?: string | null;
    image?: string | null;
    bio?: string | null;
  };
  showFollowButton?: boolean;
  isFollowing?: boolean;
  onFollowToggle?: (userId: string) => void;
}

export function UserCard({
  user,
  showFollowButton = false,
  isFollowing = false,
  onFollowToggle,
}: UserCardProps) {
  // Use username if available, otherwise use ID for profile link
  const profileIdentifier = user.username || user.id;

  return (
    <div className="flex items-center gap-4 rounded-lg bg-white p-4 shadow transition-all hover:shadow-md dark:bg-gray-800">
      {/* User Avatar */}
      <Link href={`/users/${profileIdentifier}`}>
        <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
          {user.image ? (
            <Image
              src={user.image}
              alt={user.name}
              fill
              className="object-cover"
              sizes="48px"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <UserIcon className="h-6 w-6 text-gray-400" />
            </div>
          )}
        </div>
      </Link>

      {/* User Info */}
      <Link href={`/users/${profileIdentifier}`} className="flex-1 min-w-0">
        <div>
          <h3 className="truncate font-semibold text-gray-900 dark:text-white">
            {user.name}
          </h3>
          {user.username && (
            <p className="truncate text-sm text-gray-500 dark:text-gray-400">
              @{user.username}
            </p>
          )}
          {user.bio && (
            <p className="mt-1 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
              {user.bio}
            </p>
          )}
        </div>
      </Link>

      {/* Follow Button (placeholder for now) */}
      {showFollowButton && (
        <button
          onClick={() => onFollowToggle?.(user.id)}
          className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            isFollowing
              ? "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              : "bg-purple-600 text-white hover:bg-purple-700"
          }`}
        >
          {isFollowing ? "Following" : "Follow"}
        </button>
      )}
    </div>
  );
}
