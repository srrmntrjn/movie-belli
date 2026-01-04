import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { tmdb } from "@/lib/tmdb";

const DEFAULT_PAGE_SIZE = 24;
const MAX_PAGE_SIZE = 50;

const toPositiveInt = (value: string | null, fallback: number) => {
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.floor(parsed);
};

export async function GET(
  request: NextRequest,
  context: RouteContext<"/api/users/[identifier]">
) {
  try {
    const { identifier } = await context.params;
    const searchParams = new URL(request.url).searchParams;
    const page = toPositiveInt(searchParams.get("page"), 1);
    const requestedLimit = toPositiveInt(
      searchParams.get("limit"),
      DEFAULT_PAGE_SIZE
    );
    const pageSize = Math.min(requestedLimit, MAX_PAGE_SIZE);
    const skip = (page - 1) * pageSize;

    if (!identifier) {
      return NextResponse.json(
        { error: "Missing user identifier" },
        { status: 400 }
      );
    }

    const session = await auth();

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ id: identifier }, { username: identifier }],
      },
      select: {
        id: true,
        name: true,
        username: true,
        bio: true,
        image: true,
        createdAt: true,
        _count: {
          select: {
            ratings: true,
            followers: true,
            following: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const [ratings, totalReviews] = await prisma.$transaction([
      prisma.rating.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
        select: {
          id: true,
          tmdbId: true,
          rating: true,
          createdAt: true,
        },
      }),
      prisma.rating.count({
        where: { userId: user.id },
      }),
    ]);

    const reviews = await Promise.all(
      ratings.map(async (rating) => {
        try {
          const movie = await tmdb.getMovie(rating.tmdbId);
          return {
            id: rating.id,
            rating: rating.rating,
            createdAt: rating.createdAt,
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
          console.error(`Failed to load TMDB data for ${rating.tmdbId}:`, error);
          return null;
        }
      })
    );

    const validReviews = reviews.filter(
      (review): review is NonNullable<typeof review> => review !== null
    );

    const viewerId = session?.user?.id;
    const isCurrentUser = viewerId === user.id;
    let isFollowing = false;

    if (viewerId && !isCurrentUser) {
      const follow = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: viewerId,
            followingId: user.id,
          },
        },
        select: { id: true },
      });
      isFollowing = Boolean(follow);
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        bio: user.bio,
        image: user.image,
        joinedAt: user.createdAt,
      },
      stats: {
        reviews: user._count.ratings,
        followers: user._count.followers,
        following: user._count.following,
      },
      reviews: validReviews,
      isCurrentUser,
      isFollowing,
      pagination: {
        page,
        total: totalReviews,
        pageSize,
        totalPages: totalReviews === 0 ? 1 : Math.ceil(totalReviews / pageSize),
        hasMore: skip + validReviews.length < totalReviews,
      },
    });
  } catch (error) {
    console.error("Error loading user profile:", error);
    return NextResponse.json(
      { error: "Failed to load profile" },
      { status: 500 }
    );
  }
}
