import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const allowedValues = new Set([-1, 0, 1]);

export async function POST(
  request: NextRequest,
  context: RouteContext<"/api/feedback/requests/[id]/vote">
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const { value } = await request.json();

    if (typeof value !== "number" || !allowedValues.has(value)) {
      return NextResponse.json(
        { error: "Vote value must be -1, 0, or 1" },
        { status: 400 }
      );
    }

    const existing = await prisma.featureRequest.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    if (value === 0) {
      await prisma.featureVote.deleteMany({
        where: {
          requestId: id,
          userId: session.user.id,
        },
      });
    } else {
      await prisma.featureVote.upsert({
        where: {
          requestId_userId: {
            requestId: id,
            userId: session.user.id,
          },
        },
        update: { value },
        create: {
          requestId: id,
          userId: session.user.id,
          value,
        },
      });
    }

    const votes = await prisma.featureVote.findMany({
      where: { requestId: id },
      select: { value: true, userId: true },
    });

    const score = votes.reduce((sum, vote) => sum + vote.value, 0);
    const upvotes = votes.filter((vote) => vote.value > 0).length;
    const downvotes = votes.filter((vote) => vote.value < 0).length;
    const viewerVote = votes.find((vote) => vote.userId === session.user.id)?.value ?? 0;

    return NextResponse.json({ score, upvotes, downvotes, viewerVote });
  } catch (error) {
    console.error("Error voting on feature request:", error);
    return NextResponse.json(
      { error: "Failed to submit vote" },
      { status: 500 }
    );
  }
}
