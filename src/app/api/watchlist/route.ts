import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { tmdb } from "@/lib/tmdb";

interface WatchlistRequestBody {
  tmdbId: number;
  movie?: {
    title?: string;
    poster_path?: string | null;
    release_date?: string | null;
  };
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
      );
    }

    const mode = request.nextUrl.searchParams.get("mode");
    const items = await prisma.watchlistItem.findMany({
      where: { userId: session.user.id },
      orderBy: { addedAt: "desc" },
    });

    if (mode === "ids") {
      return NextResponse.json({
        ids: items.map((item) => item.tmdbId),
      });
    }

    const movieResults = await Promise.allSettled(
      items.map((item) => tmdb.getMovie(item.tmdbId))
    );

    const enriched = items.map((item, index) => ({
      id: item.id,
      tmdbId: item.tmdbId,
      addedAt: item.addedAt,
      priority: item.priority,
      movie:
        movieResults[index].status === "fulfilled"
          ? movieResults[index].value
          : null,
    }));

    return NextResponse.json({ items: enriched });
  } catch (error) {
    console.error("Failed to fetch watchlist:", error);
    return NextResponse.json(
      { error: "Failed to fetch watchlist" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
      );
    }

    const body = (await request.json()) as WatchlistRequestBody;
    const tmdbId = Number(body?.tmdbId);

    if (!tmdbId || Number.isNaN(tmdbId)) {
      return NextResponse.json({ error: "Missing tmdbId" }, { status: 400 });
    }

    const existing = await prisma.watchlistItem.findUnique({
      where: {
        userId_tmdbId: {
          userId: session.user.id,
          tmdbId,
        },
      },
    });

    if (existing) {
      return NextResponse.json({ item: existing, added: false });
    }

    const created = await prisma.watchlistItem.create({
      data: {
        userId: session.user.id,
        tmdbId,
      },
    });

    await prisma.activity.create({
      data: {
        userId: session.user.id,
        type: "ADDED_TO_WATCHLIST",
        tmdbId,
        metadata: body.movie ?? undefined,
      },
    });

    return NextResponse.json({ item: created, added: true });
  } catch (error) {
    console.error("Failed to add to watchlist:", error);
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

    const body = (await request.json().catch(() => ({}))) as Partial<
      WatchlistRequestBody
    >;
    const tmdbId = Number(body?.tmdbId);

    if (!tmdbId || Number.isNaN(tmdbId)) {
      return NextResponse.json({ error: "Missing tmdbId" }, { status: 400 });
    }

    await prisma.watchlistItem.delete({
      where: {
        userId_tmdbId: {
          userId: session.user.id,
          tmdbId,
        },
      },
    });

    return NextResponse.json({ removed: true });
  } catch (error) {
    console.error("Failed to remove from watchlist:", error);
    return NextResponse.json(
      { error: "Failed to remove from watchlist" },
      { status: 500 }
    );
  }
}
