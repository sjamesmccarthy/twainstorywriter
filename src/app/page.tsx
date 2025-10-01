"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import TwainStoryBuilder from "@/components/TwainStoryBuilder";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // If user is authenticated, redirect to book-shelf
    if (status === "authenticated" && session) {
      router.push("/bookshelf");
    }
  }, [session, status, router]);

  // Show loading or the landing page for unauthenticated users
  if (status === "loading") {
    return <div>Loading...</div>;
  }

  // For unauthenticated users, show the main landing page
  return <TwainStoryBuilder />;
}
