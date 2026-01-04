import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

    // Get search query from URL params
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q");

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ users: [] });
    }

    // Search for users by username or name
    const users = await prisma.user.findMany({
      where: {
        AND: [
          // Exclude current user from results
          { id: { not: session.user.id } },
          // Search by username or name (case-insensitive)
          {
            OR: [
              { username: { contains: query, mode: "insensitive" } },
              { name: { contains: query, mode: "insensitive" } },
            ],
          },
        ],
      },
      select: {
        id: true,
        name: true,
        username: true,
        image: true,
        bio: true,
      },
      take: 20, // Limit to 20 results
      orderBy: [
        // Prioritize exact username matches
        { username: "asc" },
        // Then by name
        { name: "asc" },
      ],
    });

    const userIds = users.map((user) => user.id);

    const follows = await prisma.follow.findMany({
      where: {
        followerId: session.user.id,
        followingId: { in: userIds },
      },
      select: { followingId: true },
    });

    const followingSet = new Set(follows.map((follow) => follow.followingId));

    const usersWithFollowState = users.map((user) => ({
      ...user,
      isFollowing: followingSet.has(user.id),
    }));

    return NextResponse.json({ users: usersWithFollowState });
  } catch (error) {
    console.error("Error searching users:", error);
    return NextResponse.json(
      { error: "Failed to search users" },
      { status: 500 }
    );
  }
}
