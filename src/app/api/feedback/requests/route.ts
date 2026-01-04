import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const requestSchema = z.object({
  title: z.string().min(4).max(120),
  description: z.string().min(10).max(5000),
  type: z.enum(["FEATURE", "BUG"]),
});

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
      );
    }

    const requests = await prisma.featureRequest.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
        votes: {
          select: {
            value: true,
            userId: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 100,
    });

    const formatted = requests
      .map((request) => {
        const score = request.votes.reduce((sum, vote) => sum + vote.value, 0);
        const viewerVote = request.votes.find(
          (vote) => vote.userId === session.user.id
        )?.value;
        const upvotes = request.votes.filter((vote) => vote.value > 0).length;
        const downvotes = request.votes.filter((vote) => vote.value < 0).length;

        return {
          id: request.id,
          title: request.title,
          description: request.description,
          type: request.type,
          status: request.status,
          createdAt: request.createdAt,
          user: request.user,
          score,
          upvotes,
          downvotes,
          viewerVote: viewerVote ?? 0,
        };
      })
      .sort((a, b) => b.score - a.score || +new Date(b.createdAt) - +new Date(a.createdAt));

    return NextResponse.json({ requests: formatted });
  } catch (error) {
    console.error("Error loading feature requests:", error);
    return NextResponse.json(
      { error: "Failed to load feature requests" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const payload = parsed.data;

    const created = await prisma.featureRequest.create({
      data: {
        userId: session.user.id,
        title: payload.title,
        description: payload.description,
        type: payload.type,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json({
      request: {
        id: created.id,
        title: created.title,
        description: created.description,
        type: created.type,
        status: created.status,
        createdAt: created.createdAt,
        user: created.user,
        score: 0,
        upvotes: 0,
        downvotes: 0,
        viewerVote: 0,
      },
    });
  } catch (error) {
    console.error("Error creating feature request:", error);
    return NextResponse.json(
      { error: "Failed to submit feature request" },
      { status: 500 }
    );
  }
}
