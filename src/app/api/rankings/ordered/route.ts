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

    const ratings = await prisma.rating.findMany({
      where: { userId: session.user.id },
      orderBy: [
        { position: "asc" },
        { createdAt: "asc" },
      ],
      select: {
        id: true,
        tmdbId: true,
        cachedTitle: true,
        cachedPosterPath: true,
        cachedReleaseDate: true,
        rating: true,
        position: true,
      },
    });

    const formatted = ratings.map((rating) => ({
      id: rating.id,
      tmdbId: rating.tmdbId,
      title: rating.cachedTitle,
      posterPath: rating.cachedPosterPath,
      releaseDate: rating.cachedReleaseDate,
      rating: rating.rating,
      position: rating.position ? rating.position.toString() : null,
    }));

    return NextResponse.json({ ratings: formatted });
  } catch (error) {
    console.error("Error loading ordered rankings:", error);
    return NextResponse.json(
      { error: "Failed to load ordered rankings" },
      { status: 500 }
    );
  }
}
