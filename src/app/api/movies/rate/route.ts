import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RatingCategory = "bad" | "ok" | "great";

interface RateRequestBody {
  tmdbId: number;
  category: RatingCategory;
  movie: {
    title: string;
    poster_path?: string | null;
    release_date?: string | null;
  };
  placement?: {
    beforeId?: string | null;
    afterId?: string | null;
  };
}

const CATEGORY_VALUE: Record<RatingCategory, number> = {
  bad: 1,
  ok: 2,
  great: 3,
};

const DEFAULT_POSITIONS: Record<RatingCategory, Prisma.Decimal> = {
  bad: new Prisma.Decimal("0.1666666667"),
  ok: new Prisma.Decimal("0.5"),
  great: new Prisma.Decimal("0.8333333333"),
};

const midpoint = (a: Prisma.Decimal, b: Prisma.Decimal) =>
  a.plus(b.minus(a).dividedBy(2));

const normalizePosition = (index: number, total: number) => {
  const denominator = total + 1;
  return new Prisma.Decimal(index + 1).dividedBy(denominator);
};

async function rebalancePositions(userId: string) {
  const ratings = await prisma.rating.findMany({
    where: { userId },
    orderBy: [
      { position: "asc" },
      { createdAt: "asc" },
    ],
    select: { id: true },
  });

  if (ratings.length === 0) {
    return;
  }

  await prisma.$transaction(
    ratings.map((rating, index) =>
      prisma.rating.update({
        where: { id: rating.id },
        data: { position: normalizePosition(index, ratings.length) },
      })
    )
  );
}

async function resolvePlacementPosition(
  userId: string,
  placement: { beforeId?: string | null; afterId?: string | null },
  hasRebalanced = false
): Promise<Prisma.Decimal> {
  const [before, after] = await Promise.all([
    placement.beforeId
      ? prisma.rating.findUnique({
          where: { id: placement.beforeId },
          select: { position: true },
        })
      : null,
    placement.afterId
      ? prisma.rating.findUnique({
          where: { id: placement.afterId },
          select: { position: true },
        })
      : null,
  ]);

  const beforePosition = before?.position ?? new Prisma.Decimal(0);
  const afterPosition = after?.position ?? new Prisma.Decimal(1);

  if (afterPosition.lessThanOrEqualTo(beforePosition)) {
    if (hasRebalanced) {
      // As a fallback, spread the values slightly apart
      return beforePosition.plus(new Prisma.Decimal("0.0000000001"));
    }
    await rebalancePositions(userId);
    return resolvePlacementPosition(userId, placement, true);
  }

  return midpoint(beforePosition, afterPosition);
}

export async function POST(request: NextRequest) {
  try {
    const body: RateRequestBody = await request.json();
    const category = body.category;
    const tmdbId = Number(body.tmdbId);

    if (!category || !CATEGORY_VALUE[category]) {
      return NextResponse.json(
        { error: "Invalid rating category" },
        { status: 400 }
      );
    }

    if (!tmdbId || Number.isNaN(tmdbId)) {
      return NextResponse.json(
        { error: "Missing tmdbId" },
        { status: 400 }
      );
    }

    if (!body.movie?.title) {
      return NextResponse.json(
        { error: "Movie title is required" },
        { status: 400 }
      );
    }

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

    if (totalRatings >= 10 && !user.initialStackRanked) {
      return NextResponse.json(
        { error: "Stack ranking required before adding more reviews" },
        { status: 409 }
      );
    }

    let position: Prisma.Decimal;

    if (totalRatings < 10) {
      position = DEFAULT_POSITIONS[category];
    } else {
      if (!body.placement) {
        return NextResponse.json(
          { error: "Placement details are required" },
          { status: 400 }
        );
      }
      position = await resolvePlacementPosition(user.id, body.placement);
    }

    const numericRating = CATEGORY_VALUE[category];

    const savedRating = await prisma.rating.upsert({
      where: {
        userId_tmdbId: {
          userId: user.id,
          tmdbId,
        },
      },
      update: {
        rating: numericRating,
        position,
        cachedTitle: body.movie.title,
        cachedPosterPath: body.movie.poster_path ?? null,
        cachedReleaseDate: body.movie.release_date ?? null,
      },
      create: {
        userId: user.id,
        tmdbId,
        rating: numericRating,
        position,
        cachedTitle: body.movie.title,
        cachedPosterPath: body.movie.poster_path ?? null,
        cachedReleaseDate: body.movie.release_date ?? null,
      },
    });

    await prisma.activity.create({
      data: {
        userId: user.id,
        type: "RATED_MOVIE",
        tmdbId,
        metadata: {
          rating: numericRating,
          category,
        },
      },
    });

    return NextResponse.json({ success: true, rating: savedRating });
  } catch (error) {
    console.error("Error saving rating:", error);
    return NextResponse.json(
      { error: "Failed to save rating" },
      { status: 500 }
    );
  }
}
