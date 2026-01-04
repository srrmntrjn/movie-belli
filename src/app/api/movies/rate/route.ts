import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tmdbId, rating, category } = body;

    if (!tmdbId || !rating) {
      return NextResponse.json(
        { error: "Missing required fields: tmdbId and rating" },
        { status: 400 }
      );
    }

    // In development mode without DB, just return success for testing
    if (process.env.NODE_ENV === "development") {
      console.log(
        `[DEV MODE] Would save rating: tmdbId=${tmdbId}, rating=${rating}, category=${category}`
      );
      return NextResponse.json({
        success: true,
        message: "Rating saved (dev mode - not persisted)",
        data: {
          tmdbId: parseInt(tmdbId),
          rating: parseFloat(rating),
          category,
        },
      });
    }

    // Production mode - require auth and save to database
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
      );
    }

    // Upsert the rating (create or update)
    const savedRating = await prisma.rating.upsert({
      where: {
        userId_tmdbId: {
          userId: session.user.id,
          tmdbId: parseInt(tmdbId),
        },
      },
      update: {
        rating: parseFloat(rating),
      },
      create: {
        userId: session.user.id,
        tmdbId: parseInt(tmdbId),
        rating: parseFloat(rating),
      },
    });

    // Create an activity entry
    await prisma.activity.create({
      data: {
        userId: session.user.id,
        type: "RATED_MOVIE",
        tmdbId: parseInt(tmdbId),
        metadata: {
          rating: parseFloat(rating),
          category,
        },
      },
    });

    return NextResponse.json({
      success: true,
      rating: savedRating,
    });
  } catch (error) {
    console.error("Error saving rating:", error);
    return NextResponse.json(
      { error: "Failed to save rating" },
      { status: 500 }
    );
  }
}
