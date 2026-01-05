import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { tmdb } from "@/lib/tmdb";

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
  } catch (error) {
    const isUniqueConstraintViolation =
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "P2002";

    if (isUniqueConstraintViolation) {
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

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
      );
    }

    const items = await prisma.watchlistItem.findMany({
      where: { userId: session.user.id },
      orderBy: { addedAt: "desc" },
    });

    if (items.length === 0) {
      return NextResponse.json({ watchlist: [] });
    }

    const entries = await Promise.all(
      items.map(async (item) => {
        try {
          const movie = await tmdb.getMovie(item.tmdbId);
          return {
            id: item.id,
            tmdbId: item.tmdbId,
            addedAt: item.addedAt,
            movie,
          };
        } catch (error) {
          console.error(
            `Failed to load movie ${item.tmdbId} for watchlist item ${item.id}:`,
            error
          );
          return null;
        }
      })
    );

    const filtered = entries.filter(
      (entry): entry is NonNullable<typeof entry> => entry !== null
    );

    return NextResponse.json({ watchlist: filtered });
  } catch (error) {
    console.error("Error loading watchlist:", error);
    return NextResponse.json(
      { error: "Failed to load watchlist" },
      { status: 500 }
    );
  }
}
