import { NextRequest, NextResponse } from "next/server";

const TMDB_ACCESS_TOKEN = process.env.TMDB_ACCESS_TOKEN;
const BASE_URL = "https://api.themoviedb.org/3";

const resolveMovieId = (request: Request, params?: { id?: string }) => {
  if (params?.id) {
    return params.id;
  }

  try {
    const url = new URL(request.url);
    const segments = url.pathname.split("/").filter(Boolean);
    const maybeId = segments[segments.length - 1];
    return maybeId ?? "";
  } catch (error) {
    console.error("Failed to parse movie id from request URL:", error);
    return "";
  }
};

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  const movieId = resolveMovieId(request, params);

  if (!movieId) {
    return NextResponse.json(
      { error: "Movie id is required" },
      { status: 400 }
    );
  }

  if (!TMDB_ACCESS_TOKEN) {
    console.error("TMDB_ACCESS_TOKEN is not configured");
    return NextResponse.json(
      { error: "Movie service unavailable" },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(`${BASE_URL}/movie/${movieId}`, {
      headers: {
        Authorization: `Bearer ${TMDB_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error(`Error fetching TMDB movie ${movieId}:`, error);
    return NextResponse.json(
      { error: "Failed to fetch movie" },
      { status: 500 }
    );
  }
}
