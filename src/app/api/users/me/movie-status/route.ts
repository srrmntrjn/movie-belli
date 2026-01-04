import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
      );
    }

    // Get all watchlist and watched movie IDs
    const [watchlistItems, watchedMovies] = await Promise.all([
      prisma.watchlistItem.findMany({
        where: { userId: session.user.id },
        select: { tmdbId: true },
      }),
      prisma.watchedMovie.findMany({
        where: { userId: session.user.id },
        select: { tmdbId: true },
      }),
    ]);

    const watchlistIds = watchlistItems.map((item) => item.tmdbId);
    const watchedIds = watchedMovies.map((item) => item.tmdbId);

    return NextResponse.json({
      watchlist: watchlistIds,
      watched: watchedIds,
    });
  } catch (error) {
    console.error("Error fetching movie status:", error);
    return NextResponse.json(
      { error: "Failed to fetch movie status" },
      { status: 500 }
    );
  }
}
