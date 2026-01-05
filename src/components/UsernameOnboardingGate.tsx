"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";

export function UsernameOnboardingGate() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (status !== "authenticated") {
      return;
    }

    if (pathname === "/onboarding/username") {
      return;
    }

    if (session?.user?.username) {
      return;
    }

    router.replace("/onboarding/username");
  }, [status, pathname, session?.user?.username, router]);

  return null;
}
