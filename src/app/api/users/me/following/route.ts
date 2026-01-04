import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
      );
    }

    const following = await prisma.follow.findMany({
      where: { followerId: session.user.id },
      include: {
        following: {
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
            image: true,
            bio: true,
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
      orderBy: { createdAt: "desc" },
    });

    const formatted = following.map((entry) => ({
      id: entry.following.id,
      name: entry.following.name,
      username: entry.following.username,
      email: entry.following.email,
      image: entry.following.image,
      bio: entry.following.bio,
      followersCount: entry.following._count.followers,
      followingCount: entry.following._count.following,
      ratingsCount: entry.following._count.ratings,
      followedAt: entry.createdAt,
    }));

    return NextResponse.json({ following: formatted, total: formatted.length });
  } catch (error) {
    console.error("Error fetching following list:", error);
    return NextResponse.json(
      { error: "Failed to load following list" },
      { status: 500 }
    );
  }
}
