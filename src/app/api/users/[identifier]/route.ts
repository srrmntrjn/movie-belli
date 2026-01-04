import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { tmdb } from "@/lib/tmdb";

export async function GET(
  _request: NextRequest,
  context: RouteContext<"/api/users/[identifier]">
) {
  try {
    const { identifier } = await context.params;

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

    const ratings = await prisma.rating.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        tmdbId: true,
        rating: true,
        createdAt: true,
      },
    });

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
    });
  } catch (error) {
    console.error("Error loading user profile:", error);
    return NextResponse.json(
      { error: "Failed to load profile" },
      { status: 500 }
    );
  }
}
