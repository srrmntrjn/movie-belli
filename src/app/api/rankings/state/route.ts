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

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, initialStackRanked: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const totalRatings = await prisma.rating.count({
      where: { userId: user.id },
    });

    const needsInitialRanking = totalRatings >= 10 && !user.initialStackRanked;
    let initialRatings:
      | Array<{
          id: string;
          tmdbId: number;
          title: string | null;
          posterPath: string | null;
          rating: number;
        }>
      | undefined;

    if (needsInitialRanking) {
      const ratings = await prisma.rating.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "asc" },
        take: 10,
        select: {
          id: true,
          tmdbId: true,
          cachedTitle: true,
          cachedPosterPath: true,
          rating: true,
        },
      });

      initialRatings = ratings.map((rating) => ({
        id: rating.id,
        tmdbId: rating.tmdbId,
        title: rating.cachedTitle,
        posterPath: rating.cachedPosterPath,
        rating: rating.rating,
      }));
    }

    return NextResponse.json({
      totalRatings,
      needsInitialRanking,
      initialRatings,
    });
  } catch (error) {
    console.error("Error loading ranking state:", error);
    return NextResponse.json(
      { error: "Failed to load ranking state" },
      { status: 500 }
    );
  }
}
