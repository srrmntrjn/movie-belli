import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { tmdbId } = body;

    if (!tmdbId || typeof tmdbId !== "number") {
      return NextResponse.json(
        { error: "Invalid tmdbId" },
        { status: 400 }
      );
    }

    // Add to watched movies
    const watchedMovie = await prisma.watchedMovie.create({
      data: {
        userId: session.user.id,
        tmdbId,
      },
    });

    // Create activity
    await prisma.activity.create({
      data: {
        userId: session.user.id,
        type: "MARKED_AS_WATCHED",
        tmdbId,
      },
    });

    // Remove from watchlist if it exists
    await prisma.watchlistItem.deleteMany({
      where: {
        userId: session.user.id,
        tmdbId,
      },
    });

    return NextResponse.json({ success: true, watchedMovie });
  } catch (error: any) {
    // Handle unique constraint violation (already marked as watched)
    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "Movie already marked as watched" },
        { status: 409 }
      );
    }

    console.error("Error marking as watched:", error);
    return NextResponse.json(
      { error: "Failed to mark as watched" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const tmdbId = parseInt(searchParams.get("tmdbId") || "");

    if (!tmdbId || isNaN(tmdbId)) {
      return NextResponse.json(
        { error: "Invalid tmdbId" },
        { status: 400 }
      );
    }

    // Remove from watched movies
    await prisma.watchedMovie.delete({
      where: {
        userId_tmdbId: {
          userId: session.user.id,
          tmdbId,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing from watched:", error);
    return NextResponse.json(
      { error: "Failed to remove from watched" },
      { status: 500 }
    );
  }
}
