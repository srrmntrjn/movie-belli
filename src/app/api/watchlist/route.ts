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

    // Add to watchlist
    const watchlistItem = await prisma.watchlistItem.create({
      data: {
        userId: session.user.id,
        tmdbId,
      },
    });

    // Create activity
    await prisma.activity.create({
      data: {
        userId: session.user.id,
        type: "ADDED_TO_WATCHLIST",
        tmdbId,
      },
    });

    return NextResponse.json({ success: true, watchlistItem });
  } catch (error: any) {
    // Handle unique constraint violation (already in watchlist)
    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "Movie already in watchlist" },
        { status: 409 }
      );
    }

    console.error("Error adding to watchlist:", error);
    return NextResponse.json(
      { error: "Failed to add to watchlist" },
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

    // Remove from watchlist
    await prisma.watchlistItem.delete({
      where: {
        userId_tmdbId: {
          userId: session.user.id,
          tmdbId,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing from watchlist:", error);
    return NextResponse.json(
      { error: "Failed to remove from watchlist" },
      { status: 500 }
    );
  }
}
