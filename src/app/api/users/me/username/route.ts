import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  isUsernameAvailable,
  isValidUsername,
  normalizeUsername,
} from "@/lib/username";

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
      );
    }

    const body = (await request.json()) as { username?: string };
    const normalized = normalizeUsername(body.username ?? "");

    if (!normalized) {
      return NextResponse.json(
        { error: "Username is required." },
        { status: 400 }
      );
    }

    if (!isValidUsername(normalized)) {
      return NextResponse.json(
        {
          error:
            "Usernames must be 3-20 characters and only use letters, numbers, and underscores.",
        },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, username: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.username) {
      return NextResponse.json(
        { error: "Username already set." },
        { status: 409 }
      );
    }

    const available = await isUsernameAvailable(normalized);

    if (!available) {
      return NextResponse.json(
        { error: "That username is already taken." },
        { status: 409 }
      );
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { username: normalized },
    });

    return NextResponse.json({ username: normalized });
  } catch (error) {
    console.error("Error updating username:", error);
    return NextResponse.json(
      { error: "Failed to update username." },
      { status: 500 }
    );
  }
}
