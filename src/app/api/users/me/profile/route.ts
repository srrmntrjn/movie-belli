import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Get the session
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
      );
    }

    // Get user data with counts
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        image: true,
        bio: true,
        createdAt: true,
        _count: {
          select: {
            followers: true,
            following: true,
            ratings: true,
            watchlist: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Calculate user rank (based on number of ratings)
    // Get all users with their rating counts
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        _count: {
          select: {
            ratings: true,
          },
        },
      },
    });

    // Sort by rating count descending and find current user's rank
    const sortedUsers = allUsers.sort(
      (a, b) => b._count.ratings - a._count.ratings
    );
    const rank = sortedUsers.findIndex((u) => u.id === user.id) + 1;

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        image: user.image,
        bio: user.bio,
        memberSince: user.createdAt,
      },
      stats: {
        followers: user._count.followers,
        following: user._count.following,
        beenCount: user._count.ratings,
        wantToTryCount: user._count.watchlist,
        rank,
      },
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}
