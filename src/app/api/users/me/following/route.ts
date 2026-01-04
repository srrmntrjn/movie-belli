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
      select: {
        createdAt: true,
        following: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
            bio: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = following.map((entry) => ({
      id: entry.following.id,
      name: entry.following.name,
      username: entry.following.username,
      image: entry.following.image,
      bio: entry.following.bio,
      followedAt: entry.createdAt,
    }));

    return NextResponse.json({ following: formatted });
  } catch (error) {
    console.error("Error fetching following list:", error);
    return NextResponse.json(
      { error: "Failed to load following list" },
      { status: 500 }
    );
  }
}
