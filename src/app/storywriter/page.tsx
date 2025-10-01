"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import TwainStoryWriter from "@/components/TwainStoryWriter";

// Type definition to match the Book interface from TwainStoryBuilder
interface Book {
  id: number;
  title: string;
  subtitle?: string;
  author: string;
  edition: string;
  copyrightYear: string;
  wordCount: number;
  coverImage?: string;
  createdAt: string;
  updatedAt: string;
  isSeries?: boolean;
  seriesName?: string;
  seriesNumber?: number;
}

export default function StoryWriterPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isQuickStoryMode, setIsQuickStoryMode] = useState(false);

  useEffect(() => {
    // If not authenticated, redirect to home
    if (status === "authenticated" && !session) {
      router.push("/");
      return;
    }

    // Get book data from localStorage or session storage
    // This is a temporary solution - in a real app you'd pass this via URL params or global state
    const bookData = localStorage.getItem("currentSelectedBook");
    const quickStoryMode = localStorage.getItem("isQuickStoryMode") === "true";

    if (bookData) {
      setSelectedBook(JSON.parse(bookData));
      setIsQuickStoryMode(quickStoryMode);
    } else {
      // No book selected, redirect back to bookshelf
      router.push("/bookshelf");
    }
  }, [session, status, router]);

  const handleBackToBookshelf = () => {
    // Clear the selected book data
    localStorage.removeItem("currentSelectedBook");
    localStorage.removeItem("isQuickStoryMode");
    router.push("/bookshelf");
  };

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  if (!session) {
    return <div>Please sign in to access the story writer.</div>;
  }

  if (!selectedBook) {
    return <div>Loading book...</div>;
  }

  return (
    <TwainStoryWriter
      book={selectedBook}
      onBackToBookshelf={handleBackToBookshelf}
      isQuickStoryMode={isQuickStoryMode}
      autoStartStory={isQuickStoryMode}
    />
  );
}
