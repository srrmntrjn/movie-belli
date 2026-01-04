import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { tmdb } from "@/lib/tmdb";

export async function GET(request: NextRequest) {
  try {
    // Get the session
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
      );
    }

    // Get user's ratings from database
    const ratings = await prisma.rating.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        tmdbId: true,
        rating: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Fetch TMDB data for each rated movie
    const moviesWithRatings = await Promise.all(
      ratings.map(async (rating) => {
        try {
          const movie = await tmdb.getMovie(rating.tmdbId);
          return {
            id: rating.id,
            rating: rating.rating,
            createdAt: rating.createdAt,
            updatedAt: rating.updatedAt,
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
          console.error(`Failed to fetch movie ${rating.tmdbId}:`, error);
          // Return rating without movie data if TMDB fetch fails
          return {
            id: rating.id,
            rating: rating.rating,
            createdAt: rating.createdAt,
            updatedAt: rating.updatedAt,
            movie: null,
          };
        }
      })
    );

    // Filter out any ratings where movie data failed to load
    const validMovies = moviesWithRatings.filter((item) => item.movie !== null);

    return NextResponse.json({
      reviews: validMovies,
      total: validMovies.length,
    });
  } catch (error) {
    console.error("Error fetching user reviews:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}
