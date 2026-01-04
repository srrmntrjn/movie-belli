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

    // Get all users who follow the current user
    const followers = await prisma.follow.findMany({
      where: {
        followingId: session.user.id, // People who are following me
      },
      include: {
        follower: {
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
            image: true,
            _count: {
              select: {
                followers: true,
                following: true,
                ratings: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Check which followers the current user is following back
    const followerIds = followers.map((f) => f.follower.id);
    const followingBack = await prisma.follow.findMany({
      where: {
        followerId: session.user.id,
        followingId: { in: followerIds },
      },
      select: {
        followingId: true,
      },
    });

    const followingBackIds = new Set(followingBack.map((f) => f.followingId));

    return NextResponse.json({
      followers: followers.map((f) => ({
        id: f.follower.id,
        name: f.follower.name,
        username: f.follower.username,
        email: f.follower.email,
        image: f.follower.image,
        followersCount: f.follower._count.followers,
        followingCount: f.follower._count.following,
        ratingsCount: f.follower._count.ratings,
        followedAt: f.createdAt,
        isFollowing: followingBackIds.has(f.follower.id),
      })),
      total: followers.length,
    });
  } catch (error) {
    console.error("Error fetching followers:", error);
    return NextResponse.json(
      { error: "Failed to fetch followers" },
      { status: 500 }
    );
  }
}
