import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { tmdb } from "@/lib/tmdb";

const FEED_LIMIT = 10;
type SupportedActivityType = "RATED_MOVIE" | "REVIEWED_MOVIE";
const SUPPORTED_ACTIVITY_TYPES: SupportedActivityType[] = [
  "RATED_MOVIE",
  "REVIEWED_MOVIE",
];

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
      );
    }

    const follows = await prisma.follow.findMany({
      where: { followerId: session.user.id },
      select: { followingId: true },
    });

    const followedIds = follows.map((follow) => follow.followingId);

    if (followedIds.length === 0) {
      return NextResponse.json({ feed: [] });
    }

    const activities = await prisma.activity.findMany({
      where: {
        userId: { in: followedIds },
        type: { in: [...SUPPORTED_ACTIVITY_TYPES] },
      },
      include: {
        user: {
          select: { id: true, name: true, username: true, image: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: FEED_LIMIT,
    });

    const feedItems = await Promise.all(
      activities.map(async (activity) => {
        if (!activity.tmdbId) {
          return null;
        }

        try {
          const movie = await tmdb.getMovie(activity.tmdbId);

          return {
            id: activity.id,
            type: activity.type as SupportedActivityType,
            createdAt: activity.createdAt,
            metadata: activity.metadata,
            user: activity.user,
            movie: {
              id: movie.id,
              title: movie.title,
              overview: movie.overview,
              poster_path: movie.poster_path,
              backdrop_path: movie.backdrop_path,
              release_date: movie.release_date,
              vote_average: movie.vote_average,
              vote_count: movie.vote_count,
            },
          };
        } catch (error) {
          console.error(
            `Failed to load TMDB data for activity ${activity.id}:`,
            error
          );
          return null;
        }
      })
    );

    const validFeedItems = feedItems.filter(
      (item): item is NonNullable<typeof item> => item !== null
    );

    return NextResponse.json({ feed: validFeedItems });
  } catch (error) {
    console.error("Error loading activity feed:", error);
    return NextResponse.json(
      { error: "Failed to load activity feed" },
      { status: 500 }
    );
  }
}
