import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

const computePosition = (index: number, total: number) => {
  const denominator = total + 1;
  return new Prisma.Decimal(index + 1).dividedBy(denominator);
};

const positionToRating = (position: Prisma.Decimal) => {
  const scaled = position.mul(10);
  const clamped = scaled.lessThan(0)
    ? new Prisma.Decimal(0)
    : scaled.greaterThan(10)
      ? new Prisma.Decimal(10)
      : scaled;
  return Number(clamped.toFixed(2));
};

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
    const orderedIds: string[] | undefined = body?.orderedIds;

    if (!orderedIds || orderedIds.length === 0) {
      return NextResponse.json(
        { error: "Please provide the ordered rating ids" },
        { status: 400 }
      );
    }

    const ratings = await prisma.rating.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });

    if (ratings.length < 10) {
      return NextResponse.json(
        { error: "At least 10 ratings are required before ranking" },
        { status: 400 }
      );
    }

    const validIds = new Set(ratings.map((rating) => rating.id));
    const invalid = orderedIds.filter((id) => !validIds.has(id));

    if (invalid.length > 0) {
      return NextResponse.json(
        { error: "One or more ratings are invalid" },
        { status: 400 }
      );
    }

    // Ensure we apply ordering for any ratings beyond the provided ids (just in case)
    const orderedSet = new Set(orderedIds);
    const remainingIds = ratings
      .map((rating) => rating.id)
      .filter((id) => !orderedSet.has(id));
    const finalOrder = [...orderedIds, ...remainingIds];

    await prisma.$transaction([
      ...finalOrder.map((id, index) => {
        const position = computePosition(index, finalOrder.length);
        return prisma.rating.update({
          where: { id },
          data: { position, rating: positionToRating(position) },
        });
      }),
      prisma.user.update({
        where: { id: session.user.id },
        data: { initialStackRanked: true },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving initial ranking:", error);
    return NextResponse.json(
      { error: "Failed to save ranking" },
      { status: 500 }
    );
  }
}
