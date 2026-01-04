import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const TMDB_ACCESS_TOKEN = process.env.TMDB_ACCESS_TOKEN;
const BASE_URL = "https://api.themoviedb.org/3";

type FollowedReviewSummary = {
  count: number;
  reviewers: Array<{
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
  }>;
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("query");
  const page = searchParams.get("page") || "1";

  if (!query) {
    return NextResponse.json(
      { error: "Query parameter is required" },
      { status: 400 }
    );
  }

  try {
    const url = `${BASE_URL}/search/movie?query=${encodeURIComponent(
      query
    )}&page=${page}&include_adult=false`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${TMDB_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.statusText}`);
    }

    const data = await response.json();
    const session = await auth();

    if (!session?.user?.id || !Array.isArray(data.results) || data.results.length === 0) {
      return NextResponse.json(data);
    }

    const follows = await prisma.follow.findMany({
      where: { followerId: session.user.id },
      select: { followingId: true },
    });

    const followedIds = follows.map((follow) => follow.followingId);

    if (followedIds.length === 0) {
      return NextResponse.json(data);
    }

    const tmdbIds = data.results.map((movie: { id: number }) => movie.id);

    const reviews = await prisma.review.findMany({
      where: {
        tmdbId: { in: tmdbIds },
        userId: { in: followedIds },
      },
      include: {
        user: {
          select: { id: true, name: true, username: true, image: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const reviewsByMovie = new Map<number, FollowedReviewSummary>();

    reviews.forEach((review) => {
      const current = reviewsByMovie.get(review.tmdbId) ?? {
        count: 0,
        reviewers: [],
      };

      current.count += 1;
      if (current.reviewers.length < 3) {
        current.reviewers.push(review.user);
      }

      reviewsByMovie.set(review.tmdbId, current);
    });

    const enrichedResults = data.results.map((movie: { id: number }) => {
      const summary = reviewsByMovie.get(movie.id);
      return summary ? { ...movie, followedReviews: summary } : movie;
    });

    return NextResponse.json({ ...data, results: enrichedResults });
  } catch (error) {
    console.error("Error fetching from TMDB:", error);
    return NextResponse.json(
      { error: "Failed to fetch movies" },
      { status: 500 }
    );
  }
}
