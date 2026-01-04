import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { identifier: string } }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
      );
    }

    const target = await prisma.user.findFirst({
      where: {
        OR: [{ id: params.identifier }, { username: params.identifier }],
      },
      select: { id: true },
    });

    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Users cannot follow themselves
    if (target.id === session.user.id) {
      return NextResponse.json({ isFollowing: false });
    }

    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: session.user.id,
          followingId: target.id,
        },
      },
      select: { id: true },
    });

    return NextResponse.json({ isFollowing: Boolean(follow) });
  } catch (error) {
    console.error("Error checking follow status:", error);
    return NextResponse.json(
      { error: "Failed to determine follow status" },
      { status: 500 }
    );
  }
}
