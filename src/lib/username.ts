import { prisma } from "@/lib/prisma";

const usernameRegex = /^[a-z0-9_]{3,20}$/i;

export function normalizeUsername(value: string) {
  return value.trim().replace(/^@/, "");
}

export function isValidUsername(value: string) {
  return usernameRegex.test(value);
}

export async function isUsernameAvailable(value: string) {
  const existing = await prisma.user.findUnique({
    where: { username: value },
    select: { id: true },
  });

  return !existing;
}
