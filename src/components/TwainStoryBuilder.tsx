"use client";

import React, { useState, useRef, useEffect } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Button,
  Typography,
  MenuItem,
  IconButton,
  Modal,
  Box,
  TextField,
  Tooltip,
  Select,
  FormControl,
  InputLabel,
  ButtonGroup,
  FormControlLabel,
  Switch,
  Checkbox,
  FormGroup,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddCircleOutlinedIcon from "@mui/icons-material/AddCircleOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import DrawOutlinedIcon from "@mui/icons-material/DrawOutlined";
import SimCardDownloadOutlinedIcon from "@mui/icons-material/SimCardDownloadOutlined";
import DeleteForeverOutlinedIcon from "@mui/icons-material/DeleteForeverOutlined";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import AddIcon from "@mui/icons-material/Add";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import FileCopyOutlinedIcon from "@mui/icons-material/FileCopyOutlined";
import TabletAndroidOutlinedIcon from "@mui/icons-material/TabletAndroidOutlined";
import Image from "next/image";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import TwainStoryWriter from "./TwainStoryWriter";
import TwainDeleteConfirmationModal from "./TwainDeleteConfirmationModal";
import TwainStoryPricingModal, {
  ProfessionalFeatureChip,
} from "./TwainStoryPricingModal";
import TwainProfileMenu from "./TwainProfileMenu";
import { useUserPreferences } from "../hooks/useUserPreferences";
import { migrateUserPreferencesEndDate } from "../lib/userPreferences";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  PageBreak,
  ImageRun,
} from "docx";
import { saveAs } from "file-saver";
import JSZip from "jszip";

// Type definitions
interface Contributor {
  id: string;
  role:
    | "Co-Author"
    | "Editor"
    | "Illustrator"
    | "Photographer"
    | "Translator"
    | "Foreword"
    | "Introduction"
    | "Preface"
    | "Agent"
    | "Proof Reader"
    | "Advisor"
    | "Typesetter";
  firstName: string;
  lastName: string;
}

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
  contributors?: Contributor[];
  description?: string;
  genre?: string;
  ageGroup?: "Adult" | "Teen" | "Child";
  publisherName?: string;
  isbnEpub?: string;
  isbnKindle?: string;
  isbnPaperback?: string;
  isbnHardcover?: string;
  isbnPdf?: string;
  clauseAllRightsReserved?: boolean;
  clauseFiction?: boolean;
  clauseMoralRights?: boolean;
  clauseCustom?: boolean;
  customClauseText?: string;
}

// Local storage utilities
const getBooksStorageKey = (userEmail: string): string => {
  return `twain-story-builder-books-${userEmail}`;
};

const loadBooksFromStorage = (userEmail?: string): Book[] => {
  if (typeof window === "undefined" || !userEmail) return [];
  try {
    const storageKey = getBooksStorageKey(userEmail);
    const stored = localStorage.getItem(storageKey);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Error loading books from localStorage:", error);
    return [];
  }
};

const saveBooksToStorage = (books: Book[], userEmail?: string): void => {
  if (typeof window === "undefined" || !userEmail) return;
  try {
    const storageKey = getBooksStorageKey(userEmail);
    localStorage.setItem(storageKey, JSON.stringify(books));
  } catch (error) {
    console.error("Error saving books to localStorage:", error);
  }
};

const generateBookId = (existingBooks: Book[]): number => {
  return existingBooks.length > 0
    ? Math.max(...existingBooks.map((book) => book.id)) + 1
    : 1;
};

const updateBookWordCount = (
  bookId: number,
  wordCount: number,
  userEmail?: string
): void => {
  if (typeof window === "undefined" || !userEmail) return;
  try {
    const books = loadBooksFromStorage(userEmail);
    const updatedBooks = books.map((book) =>
      book.id === bookId
        ? { ...book, wordCount, updatedAt: new Date().toISOString() }
        : book
    );
    saveBooksToStorage(updatedBooks, userEmail);

    // Trigger a custom event to notify components that books were updated
    window.dispatchEvent(new CustomEvent("booksUpdated"));
  } catch (error) {
    console.error("Error updating word count:", error);
  }
};

const updateQuickStoryWordCount = (
  storyId: number,
  wordCount: number,
  userEmail?: string
): void => {
  if (typeof window === "undefined" || !userEmail) return;
  try {
    const quickStories = loadQuickStoriesFromStorage(userEmail);
    const updatedQuickStories = quickStories.map((story) =>
      story.id === storyId
        ? { ...story, wordCount, updatedAt: new Date().toISOString() }
        : story
    );
    saveQuickStoriesToStorage(updatedQuickStories, userEmail);

    // Trigger a custom event to notify components that quick stories were updated
    window.dispatchEvent(new CustomEvent("quickStoriesUpdated"));
  } catch (error) {
    console.error("Error updating quick story word count:", error);
  }
};

// Quick Stories localStorage utilities
const getQuickStoriesStorageKey = (userEmail: string): string => {
  return `twain-story-builder-quickstories-${userEmail}`;
};

const loadQuickStoriesFromStorage = (userEmail?: string): Book[] => {
  if (typeof window === "undefined" || !userEmail) return [];
  try {
    const storageKey = getQuickStoriesStorageKey(userEmail);
    const stored = localStorage.getItem(storageKey);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Error loading quick stories from localStorage:", error);
    return [];
  }
};

const saveQuickStoriesToStorage = (
  stories: Book[],
  userEmail?: string
): void => {
  if (typeof window === "undefined" || !userEmail) return;
  try {
    const storageKey = getQuickStoriesStorageKey(userEmail);
    localStorage.setItem(storageKey, JSON.stringify(stories));
  } catch (error) {
    console.error("Error saving quick stories to localStorage:", error);
  }
};

const generateQuickStoryId = (existingStories: Book[]): number => {
  return existingStories.length > 0
    ? Math.max(...existingStories.map((story) => story.id)) + 1
    : 1;
};

// Helper function to get unique series names from books
const getUniqueSeriesNames = (books: Book[]): string[] => {
  const seriesNames = books
    .filter((book) => book.isSeries && book.seriesName)
    .map((book) => book.seriesName!)
    .filter((name, index, array) => array.indexOf(name) === index); // Remove duplicates

  return seriesNames.sort(); // Sort alphabetically
};

// Helper function to count existing series for a user
const getExistingSeriesCount = (books: Book[]): number => {
  const uniqueSeriesNames = getUniqueSeriesNames(books);
  return uniqueSeriesNames.length;
};

// Helper function to count total books in series for a user
const getTotalBooksInSeries = (books: Book[]): number => {
  return books.filter((book) => book.isSeries).length;
};

// Helper function to get available book numbers for a series
const getAvailableBookNumbers = (
  books: Book[],
  seriesName: string,
  currentBookId?: number
): number[] => {
  // Get all book numbers already used in this series (excluding the current book being edited)
  const usedNumbers = books
    .filter(
      (book) =>
        book.isSeries &&
        book.seriesName === seriesName &&
        book.id !== currentBookId
    )
    .map((book) => book.seriesNumber || 1);

  // Generate all possible numbers (1-12) and filter out used ones
  const allNumbers = Array.from({ length: 12 }, (_, i) => i + 1);
  return allNumbers.filter((num) => !usedNumbers.includes(num));
};

// Reusable Footer Component
import TwainPageFooter from "./TwainPageFooter";

const TwainFooter: React.FC = () => {
  return <TwainPageFooter variant="bookshelf" />;
};
const TwainStoryBuilder: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { planType, isActivePlan, updatePlan, recordLogin } =
    useUserPreferences();
  const [createBookModalOpen, setCreateBookModalOpen] = useState(false);
  const [bookTitle, setBookTitle] = useState("");
  const [createStoryModalOpen, setCreateStoryModalOpen] = useState(false);
  const [storyTitle, setStoryTitle] = useState("");
  const [currentView, setCurrentView] = useState<
    "bookshelf" | "manage" | "write"
  >("bookshelf");
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [quickStories, setQuickStories] = useState<Book[]>([]);
  const [isQuickStoryMode, setIsQuickStoryMode] = useState(false);
  const [filter, setFilter] = useState<"all" | "books" | "stories">("all");
  const [seriesFilter, setSeriesFilter] = useState<string>("all");
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [managedBookTitle, setManagedBookTitle] = useState("");
  const [managedBookAuthor, setManagedBookAuthor] = useState("");
  const [managedBookSubtitle, setManagedBookSubtitle] = useState("");
  const [managedBookEdition, setManagedBookEdition] = useState("First Edition");
  const [managedBookCopyrightYear, setManagedBookCopyrightYear] = useState(
    new Date().getFullYear().toString()
  );
  const [managedBookIsSeries, setManagedBookIsSeries] = useState(false);
  const [managedBookSeriesName, setManagedBookSeriesName] = useState("");
  const [managedBookSeriesNumber, setManagedBookSeriesNumber] = useState(1);
  const [managedBookContributors, setManagedBookContributors] = useState<
    Contributor[]
  >([]);
  const [managedBookDescription, setManagedBookDescription] = useState("");
  const [managedBookGenre, setManagedBookGenre] = useState("");
  const [managedBookAgeGroup, setManagedBookAgeGroup] = useState<
    "Adult" | "Teen" | "Child"
  >("Adult");
  const [managedBookPublisherName, setManagedBookPublisherName] = useState("");
  const [managedBookIsbnEpub, setManagedBookIsbnEpub] = useState("");
  const [managedBookIsbnKindle, setManagedBookIsbnKindle] = useState("");
  const [managedBookIsbnPaperback, setManagedBookIsbnPaperback] = useState("");
  const [managedBookIsbnHardcover, setManagedBookIsbnHardcover] = useState("");
  const [managedBookIsbnPdf, setManagedBookIsbnPdf] = useState("");
  const [
    managedBookClauseAllRightsReserved,
    setManagedBookClauseAllRightsReserved,
  ] = useState(false);
  const [managedBookClauseFiction, setManagedBookClauseFiction] =
    useState(false);
  const [managedBookClauseMoralRights, setManagedBookClauseMoralRights] =
    useState(false);
  const [managedBookClauseCustom, setManagedBookClauseCustom] = useState(false);
  const [managedBookCustomClauseText, setManagedBookCustomClauseText] =
    useState("");
  const [notification, setNotification] = useState<string>("");
  const [showPricing, setShowPricing] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{
    book: Book;
    isStory: boolean;
  } | null>(null);
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [showStoryOptionsModal, setShowStoryOptionsModal] = useState(false);
  const [selectedStoryForOptions, setSelectedStoryForOptions] =
    useState<Book | null>(null);
  const [storyOptionsTitle, setStoryOptionsTitle] = useState("");
  const [storyOptionsMoveToBook, setStoryOptionsMoveToBook] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use twain5.png for the login screen
  const backgroundImage = `/images/twain5.png`;

  // Debug: Log which image is being used
  console.log("Loading Twain image:", backgroundImage);

  // Debug: Log session data
  console.log("Session status:", status);
  console.log("Session data:", session);
  console.log("User image URL:", session?.user?.image);

  // Compute filtered books based on current filter settings
  const filteredBooks = React.useMemo(() => {
    if (filter === "all") {
      return books; // Show all books when in "all" mode
    } else if (filter === "books") {
      if (seriesFilter === "all") {
        return books; // Show all books
      } else if (seriesFilter === "no-series") {
        return books.filter((book) => !book.isSeries || !book.seriesName);
      } else {
        return books.filter(
          (book) => book.isSeries && book.seriesName === seriesFilter
        );
      }
    }
    return books;
  }, [books, filter, seriesFilter]);

  // Notification helper
  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(""), 3000);
  };

  // Load books from localStorage on component mount
  useEffect(() => {
    if (session?.user?.email) {
      const storedBooks = loadBooksFromStorage(session.user.email);
      setBooks(storedBooks);
      setIsDataLoaded(true);
    } else if (session === null) {
      // Session is null (not loading), so we can consider data loaded even if no user
      setIsDataLoaded(true);
    }
  }, [session?.user?.email, session]);

  // Load quick stories from localStorage on component mount
  useEffect(() => {
    if (session?.user?.email) {
      const storedQuickStories = loadQuickStoriesFromStorage(
        session.user.email
      );
      setQuickStories(storedQuickStories);
    }
  }, [session?.user?.email]);

  // Listen for word count updates and reload books/stories
  useEffect(() => {
    const handleBooksUpdated = () => {
      if (session?.user?.email) {
        const storedBooks = loadBooksFromStorage(session.user.email);
        setBooks(storedBooks);
      }
    };

    const handleQuickStoriesUpdated = () => {
      if (session?.user?.email) {
        const storedQuickStories = loadQuickStoriesFromStorage(
          session.user.email
        );
        setQuickStories(storedQuickStories);
      }
    };

    window.addEventListener("booksUpdated", handleBooksUpdated);
    window.addEventListener("quickStoriesUpdated", handleQuickStoriesUpdated);

    return () => {
      window.removeEventListener("booksUpdated", handleBooksUpdated);
      window.removeEventListener(
        "quickStoriesUpdated",
        handleQuickStoriesUpdated
      );
    };
  }, [session?.user?.email]);

  // Record login when session becomes available
  useEffect(() => {
    if (session?.user?.email && status === "authenticated") {
      recordLogin();
      // Run migration to ensure endDate is set for professional plans
      migrateUserPreferencesEndDate(session.user.email);
    }
  }, [session?.user?.email, status, recordLogin]);

  const handleSignIn = () => {
    signIn("google");
  };

  const handleRequestAccess = () => {
    router.push("/auth/signup");
  };

  const handleShowPricing = () => {
    setShowPricing(true);
  };

  const handleClosePricing = () => {
    setShowPricing(false);
  };

  const handleCloseExportModal = () => {
    setShowExportModal(false);
  };

  // Helper interfaces for Word export
  interface Chapter {
    id: string;
    title: string;
    content: string; // JSON string of Quill delta
    createdAt: Date | string;
  }

  interface Story {
    id: string;
    title: string;
    content: string; // JSON string of Quill delta
    createdAt: Date | string;
  }

  interface Part {
    id: string;
    title: string;
    chapterIds: string[];
    storyIds: string[];
    createdAt: Date | string;
  }

  interface DeltaOperation {
    insert?: string | { image?: string };
    attributes?: {
      bold?: boolean;
      italic?: boolean;
      underline?: boolean;
      strike?: boolean;
      header?: number;
      align?: string;
      indent?: number;
      list?: string;
      blockquote?: boolean;
    };
  }

  interface QuillDelta {
    ops: DeltaOperation[];
  }

  // Helper function to convert Quill delta to docx paragraphs
  const convertQuillDeltaToParagraphs = (delta: QuillDelta): Paragraph[] => {
    const paragraphs: Paragraph[] = [];
    let currentParagraphRuns: TextRun[] = [];
    let currentAttributes: DeltaOperation["attributes"] | undefined = undefined;

    // Handle empty or invalid delta
    if (!delta || !delta.ops || !Array.isArray(delta.ops)) {
      return [new Paragraph({ children: [new TextRun("")] })];
    }

    delta.ops.forEach((op, index) => {
      if (typeof op.insert === "string") {
        const lines = op.insert.split("\n");

        lines.forEach((line, lineIndex) => {
          if (lineIndex > 0 && currentParagraphRuns.length > 0) {
            // Create paragraph with accumulated runs
            const alignment =
              currentAttributes?.align === "center"
                ? AlignmentType.CENTER
                : currentAttributes?.align === "right"
                ? AlignmentType.RIGHT
                : currentAttributes?.align === "justify"
                ? AlignmentType.JUSTIFIED
                : AlignmentType.LEFT;

            const heading = currentAttributes?.header
              ? currentAttributes.header === 1
                ? HeadingLevel.HEADING_1
                : currentAttributes.header === 2
                ? HeadingLevel.HEADING_2
                : HeadingLevel.HEADING_3
              : undefined;

            paragraphs.push(
              new Paragraph({
                children: currentParagraphRuns,
                alignment: alignment,
                heading: heading,
                indent: currentAttributes?.indent
                  ? { left: currentAttributes.indent * 720 }
                  : undefined,
              })
            );

            currentParagraphRuns = [];
          }

          if (line.length > 0 || lineIndex > 0) {
            const attributes = op.attributes || {};
            currentAttributes = attributes;

            currentParagraphRuns.push(
              new TextRun({
                text: line,
                bold: attributes.bold || false,
                italics: attributes.italic || false,
                underline: attributes.underline ? {} : undefined,
                strike: attributes.strike || false,
              })
            );
          }
        });

        // If this is the last operation, add the final paragraph
        if (index === delta.ops.length - 1 && currentParagraphRuns.length > 0) {
          const alignment =
            currentAttributes?.align === "center"
              ? AlignmentType.CENTER
              : currentAttributes?.align === "right"
              ? AlignmentType.RIGHT
              : currentAttributes?.align === "justify"
              ? AlignmentType.JUSTIFIED
              : AlignmentType.LEFT;

          const heading = currentAttributes?.header
            ? currentAttributes.header === 1
              ? HeadingLevel.HEADING_1
              : currentAttributes.header === 2
              ? HeadingLevel.HEADING_2
              : HeadingLevel.HEADING_3
            : undefined;

          paragraphs.push(
            new Paragraph({
              children: currentParagraphRuns,
              alignment: alignment,
              heading: heading,
              indent: currentAttributes?.indent
                ? { left: currentAttributes.indent * 720 }
                : undefined,
            })
          );
        }
      }
    });

    // If no paragraphs were created, return an empty paragraph
    if (paragraphs.length === 0) {
      paragraphs.push(new Paragraph({ children: [new TextRun("")] }));
    }

    return paragraphs;
  };

  // Main export to Word function
  const handleExportToWord = async () => {
    if (!selectedBook || !session?.user?.email) return;

    try {
      // Load book data from localStorage
      const chaptersKey = `twain-book-chapters-${selectedBook.id}-${session.user.email}`;
      const storiesKey = `twain-book-stories-${selectedBook.id}-${session.user.email}`;
      const partsKey = `twain-book-parts-${selectedBook.id}-${session.user.email}`;

      const storedChapters = localStorage.getItem(chaptersKey);
      const storedStories = localStorage.getItem(storiesKey);
      const storedParts = localStorage.getItem(partsKey);

      const chapters: Chapter[] = storedChapters
        ? JSON.parse(storedChapters)
        : [];
      const stories: Story[] = storedStories ? JSON.parse(storedStories) : [];
      const parts: Part[] = storedParts ? JSON.parse(storedParts) : [];

      // Load author bio from localStorage
      const aboutAuthor = localStorage.getItem("aboutAuthor") || "";

      // Create document sections
      const sections: Paragraph[] = [];

      // Page 1: Title Page
      sections.push(
        new Paragraph({
          children: [new TextRun("")],
          spacing: { before: 4000 },
        })
      );

      // Add cover image if available (as centered paragraph before title)
      if (selectedBook.coverImage) {
        try {
          // Convert base64 to Uint8Array buffer
          const base64Data = selectedBook.coverImage.replace(
            /^data:image\/(jpeg|jpg|png|gif);base64,/,
            ""
          );
          const binaryString = atob(base64Data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }

          sections.push(
            new Paragraph({
              children: [
                new ImageRun({
                  data: bytes,
                  transformation: {
                    width: 300,
                    height: 450,
                  },
                  type: "png",
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
            })
          );
        } catch (error) {
          console.error("Error adding cover image to Word document:", error);
          // Add a note if image failed to load
          sections.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: "[Cover Image]",
                  italics: true,
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
            })
          );
        }
      }

      sections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: selectedBook.title,
              bold: true,
              size: 48,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        })
      );

      if (selectedBook.subtitle) {
        sections.push(
          new Paragraph({
            children: [
              new TextRun({
                text: selectedBook.subtitle,
                size: 32,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 800 },
          })
        );
      }

      sections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `by ${selectedBook.author}`,
              size: 28,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        })
      );

      // Add contributors if available
      if (selectedBook.contributors && selectedBook.contributors.length > 0) {
        selectedBook.contributors.forEach((contributor) => {
          sections.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `${contributor.role}: ${contributor.firstName} ${contributor.lastName}`,
                  size: 24,
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 200 },
            })
          );
        });
      }

      // Add publisher if available
      if (selectedBook.publisherName) {
        sections.push(
          new Paragraph({
            children: [new TextRun("")],
            spacing: { before: 800 },
          })
        );
        sections.push(
          new Paragraph({
            children: [
              new TextRun({
                text: selectedBook.publisherName,
                size: 24,
              }),
            ],
            alignment: AlignmentType.CENTER,
          })
        );
      }

      // Page 2: Copyright Page
      sections.push(
        new Paragraph({
          children: [new PageBreak()],
        })
      );

      sections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `Copyright © ${selectedBook.copyrightYear} by ${selectedBook.author}`,
              size: 22,
            }),
          ],
          spacing: { after: 400 },
        })
      );

      sections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${selectedBook.edition}`,
              size: 22,
            }),
          ],
          spacing: { after: 400 },
        })
      );

      // Add copyright clauses
      if (selectedBook.clauseAllRightsReserved) {
        sections.push(
          new Paragraph({
            children: [
              new TextRun({
                text: "All rights reserved. No part of this publication may be reproduced, distributed, or transmitted in any form or by any means, including photocopying, recording, or other electronic or mechanical methods, without the prior written permission of the publisher, except in the case of brief quotations embodied in critical reviews and certain other noncommercial uses permitted by copyright law.",
                size: 20,
              }),
            ],
            spacing: { after: 400 },
          })
        );
      }

      if (selectedBook.clauseFiction) {
        sections.push(
          new Paragraph({
            children: [
              new TextRun({
                text: "This is a work of fiction. Names, characters, businesses, places, events, locales, and incidents are either the products of the author's imagination or used in a fictitious manner. Any resemblance to actual persons, living or dead, or actual events is purely coincidental.",
                size: 20,
              }),
            ],
            spacing: { after: 400 },
          })
        );
      }

      if (selectedBook.clauseMoralRights) {
        sections.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `The author asserts the moral right to be identified as the author of this work.`,
                size: 20,
              }),
            ],
            spacing: { after: 400 },
          })
        );
      }

      if (selectedBook.clauseCustom && selectedBook.customClauseText) {
        sections.push(
          new Paragraph({
            children: [
              new TextRun({
                text: selectedBook.customClauseText,
                size: 20,
              }),
            ],
            spacing: { after: 400 },
          })
        );
      }

      // Add ISBNs if available
      const isbns = [];
      if (selectedBook.isbnPaperback)
        isbns.push(`ISBN (Paperback): ${selectedBook.isbnPaperback}`);
      if (selectedBook.isbnHardcover)
        isbns.push(`ISBN (Hardcover): ${selectedBook.isbnHardcover}`);
      if (selectedBook.isbnEpub)
        isbns.push(`ISBN (ePub): ${selectedBook.isbnEpub}`);
      if (selectedBook.isbnKindle)
        isbns.push(`ISBN (Kindle): ${selectedBook.isbnKindle}`);
      if (selectedBook.isbnPdf)
        isbns.push(`ISBN (PDF): ${selectedBook.isbnPdf}`);

      if (isbns.length > 0) {
        sections.push(
          new Paragraph({
            children: [new TextRun("")],
            spacing: { before: 400 },
          })
        );
        isbns.forEach((isbn) => {
          sections.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: isbn,
                  size: 20,
                }),
              ],
              spacing: { after: 200 },
            })
          );
        });
      }

      // Page 3: Dedication (if available)
      if (selectedBook.description && selectedBook.description.trim()) {
        sections.push(
          new Paragraph({
            children: [new PageBreak()],
          })
        );
        sections.push(
          new Paragraph({
            children: [
              new TextRun({
                text: selectedBook.description,
                size: 24,
                italics: true,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 2000 },
          })
        );
      }

      // Page 4+: Story Content
      sections.push(
        new Paragraph({
          children: [new PageBreak()],
        })
      );

      // Organize content by parts or chapters
      if (parts.length > 0) {
        // If parts are defined, use that order
        for (const part of parts) {
          // Add part title
          sections.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: part.title,
                  bold: true,
                  size: 36,
                }),
              ],
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
              spacing: { before: 800, after: 800 },
            })
          );

          // Add chapters in this part
          if (part.chapterIds && part.chapterIds.length > 0) {
            for (const chapterId of part.chapterIds) {
              const chapter = chapters.find((ch) => ch.id === chapterId);
              if (chapter) {
                sections.push(
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: chapter.title,
                        bold: true,
                        size: 32,
                      }),
                    ],
                    heading: HeadingLevel.HEADING_2,
                    spacing: { before: 600, after: 400 },
                  })
                );

                try {
                  const delta: QuillDelta = JSON.parse(chapter.content || "{}");
                  const contentParagraphs =
                    convertQuillDeltaToParagraphs(delta);
                  sections.push(...contentParagraphs);
                } catch (error) {
                  console.error("Error parsing chapter content:", error);
                  // Add a paragraph indicating the content couldn't be loaded
                  sections.push(
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: "[Content could not be loaded]",
                          italics: true,
                        }),
                      ],
                    })
                  );
                }

                sections.push(
                  new Paragraph({
                    children: [new TextRun("")],
                    spacing: { after: 400 },
                  })
                );
              }
            }
          }

          // Add stories in this part
          if (part.storyIds && part.storyIds.length > 0) {
            for (const storyId of part.storyIds) {
              const story = stories.find((st) => st.id === storyId);
              if (story) {
                sections.push(
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: story.title,
                        bold: true,
                        size: 32,
                      }),
                    ],
                    heading: HeadingLevel.HEADING_2,
                    spacing: { before: 600, after: 400 },
                  })
                );

                try {
                  const delta: QuillDelta = JSON.parse(story.content || "{}");
                  const contentParagraphs =
                    convertQuillDeltaToParagraphs(delta);
                  sections.push(...contentParagraphs);
                } catch (error) {
                  console.error("Error parsing story content:", error);
                  // Add a paragraph indicating the content couldn't be loaded
                  sections.push(
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: "[Content could not be loaded]",
                          italics: true,
                        }),
                      ],
                    })
                  );
                }

                sections.push(
                  new Paragraph({
                    children: [new TextRun("")],
                    spacing: { after: 400 },
                  })
                );
              }
            }
          }
        }
      } else {
        // No parts defined, use chapters in order
        for (const chapter of chapters) {
          sections.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: chapter.title,
                  bold: true,
                  size: 32,
                }),
              ],
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 600, after: 400 },
            })
          );

          try {
            const delta: QuillDelta = JSON.parse(chapter.content || "{}");
            const contentParagraphs = convertQuillDeltaToParagraphs(delta);
            sections.push(...contentParagraphs);
          } catch (error) {
            console.error("Error parsing chapter content:", error);
            // Add a paragraph indicating the content couldn't be loaded
            sections.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: "[Content could not be loaded]",
                    italics: true,
                  }),
                ],
              })
            );
          }

          sections.push(
            new Paragraph({
              children: [new TextRun("")],
              spacing: { after: 400 },
            })
          );
        }
      }

      // Final Page: About The Author
      if (aboutAuthor && aboutAuthor.trim()) {
        sections.push(
          new Paragraph({
            children: [new PageBreak()],
          })
        );
        sections.push(
          new Paragraph({
            children: [
              new TextRun({
                text: "About The Author",
                bold: true,
                size: 32,
              }),
            ],
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { before: 400, after: 600 },
          })
        );
        sections.push(
          new Paragraph({
            children: [
              new TextRun({
                text: aboutAuthor,
                size: 24,
              }),
            ],
            spacing: { after: 400 },
          })
        );
      }

      // Create the document
      const doc = new Document({
        sections: [
          {
            properties: {},
            children: sections,
          },
        ],
      });

      // Generate and download the file
      const blob = await Packer.toBlob(doc);
      const fileName = `${selectedBook.title.replace(/[^a-z0-9]/gi, "_")}.docx`;
      saveAs(blob, fileName);

      handleCloseExportModal();
    } catch (error) {
      console.error("Error exporting to Word:", error);
      alert("An error occurred while exporting the book. Please try again.");
    }
  };

  // Helper function to convert Quill delta to HTML for ePub
  const convertQuillDeltaToHTML = (delta: QuillDelta): string => {
    if (!delta || !delta.ops || !Array.isArray(delta.ops)) {
      return "<p></p>";
    }

    let html = "";
    let currentParagraph = "";
    let inList = false;
    let listType = "";

    delta.ops.forEach((op) => {
      if (typeof op.insert === "string") {
        const text = op.insert;
        const attributes = op.attributes || {};

        // Split by newlines to handle paragraphs
        const lines = text.split("\n");

        lines.forEach((line, index) => {
          if (index > 0 && currentParagraph) {
            // Close previous paragraph or list item
            if (inList) {
              html += `<li>${currentParagraph}</li>`;
            } else if (attributes.header) {
              html += `<h${attributes.header}>${currentParagraph}</h${attributes.header}>`;
            } else if (attributes.blockquote) {
              html += `<blockquote>${currentParagraph}</blockquote>`;
            } else {
              const align = attributes.align
                ? ` style="text-align: ${attributes.align};"`
                : "";
              html += `<p${align}>${currentParagraph}</p>`;
            }
            currentParagraph = "";
          }

          if (line.length > 0) {
            let formattedText = line;

            // Apply text formatting
            if (attributes.bold)
              formattedText = `<strong>${formattedText}</strong>`;
            if (attributes.italic) formattedText = `<em>${formattedText}</em>`;
            if (attributes.underline) formattedText = `<u>${formattedText}</u>`;
            if (attributes.strike) formattedText = `<s>${formattedText}</s>`;

            currentParagraph += formattedText;
          }

          // Handle lists
          if (attributes.list && !inList) {
            listType = attributes.list;
            inList = true;
            html += listType === "ordered" ? "<ol>" : "<ul>";
          } else if (!attributes.list && inList) {
            html += listType === "ordered" ? "</ol>" : "</ul>";
            inList = false;
            listType = "";
          }
        });
      }
    });

    // Close any remaining open paragraph
    if (currentParagraph) {
      if (inList) {
        html += `<li>${currentParagraph}</li>`;
      } else {
        html += `<p>${currentParagraph}</p>`;
      }
    }

    // Close any remaining open list
    if (inList) {
      html += listType === "ordered" ? "</ol>" : "</ul>";
    }

    return html || "<p></p>";
  };

  // Main export to ePub function
  const handleExportToEpub = async () => {
    if (!selectedBook || !session?.user?.email) return;

    try {
      const zip = new JSZip();

      // Load book data from localStorage
      const chaptersKey = `twain-book-chapters-${selectedBook.id}-${session.user.email}`;
      const storiesKey = `twain-book-stories-${selectedBook.id}-${session.user.email}`;
      const partsKey = `twain-book-parts-${selectedBook.id}-${session.user.email}`;

      const storedChapters = localStorage.getItem(chaptersKey);
      const storedStories = localStorage.getItem(storiesKey);
      const storedParts = localStorage.getItem(partsKey);

      const chapters: Chapter[] = storedChapters
        ? JSON.parse(storedChapters)
        : [];
      const stories: Story[] = storedStories ? JSON.parse(storedStories) : [];
      const parts: Part[] = storedParts ? JSON.parse(storedParts) : [];

      // Load author bio from localStorage
      const aboutAuthor = localStorage.getItem("aboutAuthor") || "";

      // Create mimetype file (must be first and uncompressed)
      zip.file("mimetype", "application/epub+zip", { compression: "STORE" });

      // Create META-INF directory
      const metaInf = zip.folder("META-INF");
      if (metaInf) {
        metaInf.file(
          "container.xml",
          `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`
        );
      }

      // Create OEBPS directory
      const oebps = zip.folder("OEBPS");
      if (!oebps) return;

      // Generate unique ID for the book
      const bookId = `urn:uuid:${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      // Create content.opf (package document)
      let manifestItems = `
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
    <item id="titlepage" href="titlepage.xhtml" media-type="application/xhtml+xml"/>
    <item id="copyright" href="copyright.xhtml" media-type="application/xhtml+xml"/>`;

      // Add cover image to manifest if available
      if (selectedBook.coverImage) {
        // Determine image type from base64 data
        const imageType =
          selectedBook.coverImage.match(
            /data:image\/(jpeg|jpg|png|gif);base64,/
          )?.[1] || "jpeg";
        const mediaType = `image/${imageType}`;
        manifestItems += `
    <item id="cover-image" href="cover.${imageType}" media-type="${mediaType}" properties="cover-image"/>`;
      }

      let spineItems = `
    <itemref idref="titlepage"/>
    <itemref idref="copyright"/>`;

      let navPoints = `
    <navPoint id="navpoint-1" playOrder="1">
      <navLabel><text>Title Page</text></navLabel>
      <content src="titlepage.xhtml"/>
    </navPoint>
    <navPoint id="navpoint-2" playOrder="2">
      <navLabel><text>Copyright</text></navLabel>
      <content src="copyright.xhtml"/>
    </navPoint>`;

      let navList = `
      <li><a href="titlepage.xhtml">Title Page</a></li>
      <li><a href="copyright.xhtml">Copyright</a></li>`;

      let playOrder = 3;

      // Add dedication if available
      if (selectedBook.description && selectedBook.description.trim()) {
        manifestItems += `
    <item id="dedication" href="dedication.xhtml" media-type="application/xhtml+xml"/>`;
        spineItems += `
    <itemref idref="dedication"/>`;
        navPoints += `
    <navPoint id="navpoint-${playOrder}" playOrder="${playOrder}">
      <navLabel><text>Dedication</text></navLabel>
      <content src="dedication.xhtml"/>
    </navPoint>`;
        navList += `
      <li><a href="dedication.xhtml">Dedication</a></li>`;
        playOrder++;
      }

      // Generate chapter/story files based on parts or chapters
      const contentFiles: { id: string; filename: string; title: string }[] =
        [];

      if (parts.length > 0) {
        // If parts are defined, use that order
        parts.forEach((part) => {
          // Add chapters in this part
          if (part.chapterIds && part.chapterIds.length > 0) {
            part.chapterIds.forEach((chapterId) => {
              const chapter = chapters.find((ch) => ch.id === chapterId);
              if (chapter) {
                const fileId = `chapter-${chapterId}`;
                const filename = `${fileId}.xhtml`;
                contentFiles.push({
                  id: fileId,
                  filename: filename,
                  title: chapter.title,
                });
              }
            });
          }

          // Add stories in this part
          if (part.storyIds && part.storyIds.length > 0) {
            part.storyIds.forEach((storyId) => {
              const story = stories.find((st) => st.id === storyId);
              if (story) {
                const fileId = `story-${storyId}`;
                const filename = `${fileId}.xhtml`;
                contentFiles.push({
                  id: fileId,
                  filename: filename,
                  title: story.title,
                });
              }
            });
          }
        });
      } else {
        // No parts defined, use chapters in order
        chapters.forEach((chapter) => {
          const fileId = `chapter-${chapter.id}`;
          const filename = `${fileId}.xhtml`;
          contentFiles.push({
            id: fileId,
            filename: filename,
            title: chapter.title,
          });
        });
      }

      // Add manifest items and spine for content files
      contentFiles.forEach((file) => {
        manifestItems += `
    <item id="${file.id}" href="${file.filename}" media-type="application/xhtml+xml"/>`;
        spineItems += `
    <itemref idref="${file.id}"/>`;
        navPoints += `
    <navPoint id="navpoint-${playOrder}" playOrder="${playOrder}">
      <navLabel><text>${file.title}</text></navLabel>
      <content src="${file.filename}"/>
    </navPoint>`;
        navList += `
      <li><a href="${file.filename}">${file.title}</a></li>`;
        playOrder++;
      });

      // Add about the author if available
      if (aboutAuthor && aboutAuthor.trim()) {
        manifestItems += `
    <item id="about" href="about.xhtml" media-type="application/xhtml+xml"/>`;
        spineItems += `
    <itemref idref="about"/>`;
        navPoints += `
    <navPoint id="navpoint-${playOrder}" playOrder="${playOrder}">
      <navLabel><text>About The Author</text></navLabel>
      <content src="about.xhtml"/>
    </navPoint>`;
        navList += `
      <li><a href="about.xhtml">About The Author</a></li>`;
      }

      // Create content.opf
      const contentOpf = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="bookid">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf">
    <dc:identifier id="bookid">${bookId}</dc:identifier>
    <dc:title>${selectedBook.title}</dc:title>
    <dc:creator>${selectedBook.author}</dc:creator>
    <dc:language>en</dc:language>
    <dc:date>${new Date().toISOString().split("T")[0]}</dc:date>
    <meta property="dcterms:modified">${
      new Date().toISOString().split(".")[0]
    }Z</meta>
  </metadata>
  <manifest>${manifestItems}
  </manifest>
  <spine toc="ncx">${spineItems}
  </spine>
</package>`;

      oebps.file("content.opf", contentOpf);

      // Create toc.ncx (NCX navigation for EPUB2 compatibility)
      const tocNcx = `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="${bookId}"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle>
    <text>${selectedBook.title}</text>
  </docTitle>
  <navMap>${navPoints}
  </navMap>
</ncx>`;

      oebps.file("toc.ncx", tocNcx);

      // Create nav.xhtml (EPUB3 navigation)
      const navXhtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head>
  <title>Navigation</title>
</head>
<body>
  <nav epub:type="toc">
    <h1>Table of Contents</h1>
    <ol>${navList}
    </ol>
  </nav>
</body>
</html>`;

      oebps.file("nav.xhtml", navXhtml);

      // Create titlepage.xhtml
      let contributorsHTML = "";
      if (selectedBook.contributors && selectedBook.contributors.length > 0) {
        contributorsHTML = selectedBook.contributors
          .map(
            (c) =>
              `<p style="text-align: center; font-size: 0.9em; margin: 5px 0;">${c.role}: ${c.firstName} ${c.lastName}</p>`
          )
          .join("\n");
      }

      // Determine cover image file extension if available
      const coverImageType = selectedBook.coverImage
        ? selectedBook.coverImage.match(
            /data:image\/(jpeg|jpg|png|gif);base64,/
          )?.[1] || "jpeg"
        : null;

      const titlepageXhtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>Title Page</title>
</head>
<body style="font-family: serif;">
  <div style="text-align: center; padding-top: 100px;">
    ${
      selectedBook.coverImage && coverImageType
        ? `<img src="cover.${coverImageType}" alt="Book Cover" style="max-width: 400px; max-height: 600px; margin: 0 auto 40px auto; display: block;"/>`
        : ""
    }
    <h1 style="font-size: 2.5em; font-weight: bold; margin-bottom: 20px;">${
      selectedBook.title
    }</h1>
    ${
      selectedBook.subtitle
        ? `<h2 style="font-size: 1.5em; margin-bottom: 30px;">${selectedBook.subtitle}</h2>`
        : ""
    }
    <p style="font-size: 1.2em; margin-top: 40px;">by ${selectedBook.author}</p>
    ${contributorsHTML}
    ${
      selectedBook.publisherName
        ? `<p style="font-size: 1em; margin-top: 50px;">${selectedBook.publisherName}</p>`
        : ""
    }
  </div>
</body>
</html>`;

      oebps.file("titlepage.xhtml", titlepageXhtml);

      // Add cover image file if available
      if (selectedBook.coverImage && coverImageType) {
        const base64Data = selectedBook.coverImage.replace(
          /^data:image\/(jpeg|jpg|png|gif);base64,/,
          ""
        );
        oebps.file(`cover.${coverImageType}`, base64Data, { base64: true });
      }

      // Create copyright.xhtml
      let clausesHTML = "";
      if (selectedBook.clauseAllRightsReserved) {
        clausesHTML += `<p>All rights reserved. No part of this publication may be reproduced, distributed, or transmitted in any form or by any means, including photocopying, recording, or other electronic or mechanical methods, without the prior written permission of the publisher, except in the case of brief quotations embodied in critical reviews and certain other noncommercial uses permitted by copyright law.</p>`;
      }
      if (selectedBook.clauseFiction) {
        clausesHTML += `<p>This is a work of fiction. Names, characters, businesses, places, events, locales, and incidents are either the products of the author's imagination or used in a fictitious manner. Any resemblance to actual persons, living or dead, or actual events is purely coincidental.</p>`;
      }
      if (selectedBook.clauseMoralRights) {
        clausesHTML += `<p>The author asserts the moral right to be identified as the author of this work.</p>`;
      }
      if (selectedBook.clauseCustom && selectedBook.customClauseText) {
        clausesHTML += `<p>${selectedBook.customClauseText}</p>`;
      }

      let isbnsHTML = "";
      const isbns = [];
      if (selectedBook.isbnPaperback)
        isbns.push(`ISBN (Paperback): ${selectedBook.isbnPaperback}`);
      if (selectedBook.isbnHardcover)
        isbns.push(`ISBN (Hardcover): ${selectedBook.isbnHardcover}`);
      if (selectedBook.isbnEpub)
        isbns.push(`ISBN (ePub): ${selectedBook.isbnEpub}`);
      if (selectedBook.isbnKindle)
        isbns.push(`ISBN (Kindle): ${selectedBook.isbnKindle}`);
      if (selectedBook.isbnPdf)
        isbns.push(`ISBN (PDF): ${selectedBook.isbnPdf}`);
      if (isbns.length > 0) {
        isbnsHTML = `<div style="margin-top: 20px;">${isbns
          .map((isbn) => `<p>${isbn}</p>`)
          .join("")}</div>`;
      }

      const copyrightXhtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>Copyright</title>
</head>
<body style="font-family: serif; padding: 20px;">
  <p>Copyright © ${selectedBook.copyrightYear} by ${selectedBook.author}</p>
  <p>${selectedBook.edition}</p>
  ${clausesHTML}
  ${isbnsHTML}
</body>
</html>`;

      oebps.file("copyright.xhtml", copyrightXhtml);

      // Create dedication.xhtml if available
      if (selectedBook.description && selectedBook.description.trim()) {
        const dedicationXhtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>Dedication</title>
</head>
<body style="font-family: serif; padding: 40px;">
  <div style="text-align: center; padding-top: 100px;">
    <p style="font-style: italic; font-size: 1.2em;">${selectedBook.description}</p>
  </div>
</body>
</html>`;
        oebps.file("dedication.xhtml", dedicationXhtml);
      }

      // Create content files (chapters/stories)
      if (parts.length > 0) {
        // If parts are defined, use that order
        parts.forEach((part) => {
          // Add chapters in this part
          if (part.chapterIds && part.chapterIds.length > 0) {
            part.chapterIds.forEach((chapterId) => {
              const chapter = chapters.find((ch) => ch.id === chapterId);
              if (chapter) {
                try {
                  const delta: QuillDelta = JSON.parse(chapter.content || "{}");
                  const contentHTML = convertQuillDeltaToHTML(delta);

                  const chapterXhtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>${chapter.title}</title>
</head>
<body style="font-family: serif; padding: 20px;">
  <h2>${chapter.title}</h2>
  ${contentHTML}
</body>
</html>`;
                  oebps.file(`chapter-${chapterId}.xhtml`, chapterXhtml);
                } catch (error) {
                  console.error("Error parsing chapter content:", error);
                }
              }
            });
          }

          // Add stories in this part
          if (part.storyIds && part.storyIds.length > 0) {
            part.storyIds.forEach((storyId) => {
              const story = stories.find((st) => st.id === storyId);
              if (story) {
                try {
                  const delta: QuillDelta = JSON.parse(story.content || "{}");
                  const contentHTML = convertQuillDeltaToHTML(delta);

                  const storyXhtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>${story.title}</title>
</head>
<body style="font-family: serif; padding: 20px;">
  <h2>${story.title}</h2>
  ${contentHTML}
</body>
</html>`;
                  oebps.file(`story-${storyId}.xhtml`, storyXhtml);
                } catch (error) {
                  console.error("Error parsing story content:", error);
                }
              }
            });
          }
        });
      } else {
        // No parts defined, use chapters in order
        chapters.forEach((chapter) => {
          try {
            const delta: QuillDelta = JSON.parse(chapter.content || "{}");
            const contentHTML = convertQuillDeltaToHTML(delta);

            const chapterXhtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>${chapter.title}</title>
</head>
<body style="font-family: serif; padding: 20px;">
  <h2>${chapter.title}</h2>
  ${contentHTML}
</body>
</html>`;
            oebps.file(`chapter-${chapter.id}.xhtml`, chapterXhtml);
          } catch (error) {
            console.error("Error parsing chapter content:", error);
          }
        });
      }

      // Create about.xhtml if available
      if (aboutAuthor && aboutAuthor.trim()) {
        const aboutXhtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>About The Author</title>
</head>
<body style="font-family: serif; padding: 20px;">
  <h2 style="text-align: center;">About The Author</h2>
  <p>${aboutAuthor}</p>
</body>
</html>`;
        oebps.file("about.xhtml", aboutXhtml);
      }

      // Generate the ePub file
      const epubBlob = await zip.generateAsync({ type: "blob" });
      const fileName = `${selectedBook.title.replace(/[^a-z0-9]/gi, "_")}.epub`;
      saveAs(epubBlob, fileName);

      handleCloseExportModal();
    } catch (error) {
      console.error("Error exporting to ePub:", error);
      alert("An error occurred while exporting the book. Please try again.");
    }
  };

  const handleOpenDeleteModal = (book: Book, isStory: boolean = false) => {
    setItemToDelete({ book, isStory });
    setShowDeleteModal(true);
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setItemToDelete(null);
  };

  const handleConfirmDelete = () => {
    if (!itemToDelete) return;

    const { book, isStory } = itemToDelete;

    if (isStory) {
      // Handle quick story deletion
      const updatedQuickStories = quickStories.filter((s) => s.id !== book.id);
      setQuickStories(updatedQuickStories);
      if (session?.user?.email) {
        saveQuickStoriesToStorage(updatedQuickStories, session.user.email);
        // Clean up all related localStorage data for this quick story
        cleanupBookData(book.id, session.user.email, true);
      }
      showNotification(`"${book.title}" story has been deleted.`);
      console.log("Story deleted successfully:", book.title);
    } else {
      // Handle book deletion
      const updatedBooks = books.filter((b) => b.id !== book.id);
      setBooks(updatedBooks);
      if (session?.user?.email) {
        saveBooksToStorage(updatedBooks, session.user.email);
        // Clean up all related localStorage data for this book
        cleanupBookData(book.id, session.user.email, false);
      }
      showNotification(`"${book.title}" has been deleted.`);
      console.log("Book deleted successfully:", book.title);

      // If we're deleting the currently selected book, go back to bookshelf
      if (selectedBook && selectedBook.id === book.id) {
        handleBackToBookshelf();
      }
    }

    handleCloseDeleteModal();
  };

  const handleLogout = () => {
    signOut();
  };

  const handleAccountSettings = () => {
    router.push("/account-settings");
  };

  const handleAbout = () => {
    router.push("/about");
  };

  const handleHelp = () => {
    router.push("/help");
  };

  const handleFeedback = () => {
    router.push("/feedback");
  };

  const handleUpgradePlan = (newPlanType: "professional") => {
    // This would typically integrate with a payment system
    // For now, we'll just update the local preferences
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 1); // Add 1 year

    updatePlan({
      type: newPlanType,
      status: "active",
      startDate: new Date().toISOString(),
      endDate: endDate.toISOString(),
    });

    showNotification(
      `Successfully upgraded to ${
        newPlanType.charAt(0).toUpperCase() + newPlanType.slice(1)
      } plan!`
    );
    setShowPricing(false);
  };

  const handleFilterChange = (newFilter: "all" | "books" | "stories") => {
    setFilter(newFilter);
    // Reset series filter when changing main filter
    if (newFilter !== "books") {
      setSeriesFilter("all");
    }
  };

  const handleSeriesFilterChange = (newSeriesFilter: string) => {
    setSeriesFilter(newSeriesFilter);
  };

  const handleCreateBookClick = () => {
    setCreateBookModalOpen(true);
  };

  const handleCreateBookModalClose = () => {
    setCreateBookModalOpen(false);
    setBookTitle("");
  };

  const handleCreateBook = () => {
    if (bookTitle.trim()) {
      const newBook: Book = {
        id: generateBookId(books),
        title: bookTitle.trim(),
        subtitle: "",
        author: session?.user?.name || "Unknown Author",
        edition: "First Edition",
        copyrightYear: new Date().getFullYear().toString(),
        wordCount: 0,
        isSeries: false,
        seriesName: undefined,
        seriesNumber: undefined,
        contributors: undefined,
        description: undefined,
        genre: undefined,
        ageGroup: "Adult",
        publisherName: undefined,
        isbnEpub: undefined,
        isbnKindle: undefined,
        isbnPaperback: undefined,
        isbnHardcover: undefined,
        isbnPdf: undefined,
        clauseAllRightsReserved: undefined,
        clauseFiction: undefined,
        clauseMoralRights: undefined,
        clauseCustom: undefined,
        customClauseText: undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const updatedBooks = [...books, newBook];
      setBooks(updatedBooks);
      if (session?.user?.email) {
        saveBooksToStorage(updatedBooks, session.user.email);
      }

      // Close modal first to prevent any rendering conflicts
      handleCreateBookModalClose();

      // Set the new book as selected and switch to write view
      setIsQuickStoryMode(false);
      setSelectedBook(newBook);
      setCurrentView("write");
      showNotification(`"${newBook.title}" has been created successfully!`);
      console.log("Book created successfully:", newBook.title);
    }
  };

  const handleCreateStoryClick = () => {
    setCreateStoryModalOpen(true);
  };

  const handleCreateStoryModalClose = () => {
    setCreateStoryModalOpen(false);
    setStoryTitle("");
  };

  const handleCreateStory = () => {
    if (storyTitle.trim()) {
      const quickStoryBook: Book = {
        id: generateQuickStoryId(quickStories),
        title: storyTitle.trim(),
        subtitle: "",
        author: session?.user?.name || "Unknown Author",
        edition: "First Edition",
        copyrightYear: new Date().getFullYear().toString(),
        wordCount: 0,
        isSeries: false,
        seriesName: undefined,
        seriesNumber: undefined,
        contributors: undefined,
        description: undefined,
        genre: undefined,
        ageGroup: "Adult",
        publisherName: undefined,
        isbnEpub: undefined,
        isbnKindle: undefined,
        isbnPaperback: undefined,
        isbnHardcover: undefined,
        isbnPdf: undefined,
        clauseAllRightsReserved: undefined,
        clauseFiction: undefined,
        clauseMoralRights: undefined,
        clauseCustom: undefined,
        customClauseText: undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const updatedQuickStories = [...quickStories, quickStoryBook];
      setQuickStories(updatedQuickStories);
      if (session?.user?.email) {
        saveQuickStoriesToStorage(updatedQuickStories, session.user.email);
      }

      // Close modal first to prevent any rendering conflicts
      handleCreateStoryModalClose();

      // Set quick story mode and switch to write view
      setIsQuickStoryMode(true);
      setSelectedBook(quickStoryBook);
      setCurrentView("write");
      showNotification(`"${quickStoryBook.title}" story is ready to write!`);
    }
  };

  const handleManageBook = (book: Book) => {
    setSelectedBook(book);
    setManagedBookTitle(book.title);
    setManagedBookAuthor(book.author);
    setManagedBookSubtitle(book.subtitle || "");
    setManagedBookEdition(book.edition);
    setManagedBookCopyrightYear(book.copyrightYear);
    setManagedBookIsSeries(book.isSeries || false);

    // For freelance users who already have a series, auto-select it
    if (planType !== "professional" && getExistingSeriesCount(books) >= 1) {
      const existingSeriesNames = getUniqueSeriesNames(books);
      if (existingSeriesNames.length > 0) {
        const selectedSeriesName = book.seriesName || existingSeriesNames[0];
        setManagedBookSeriesName(selectedSeriesName);

        // Set book number to current or next available number
        if (book.seriesNumber) {
          setManagedBookSeriesNumber(book.seriesNumber);
        } else {
          // For new books, set to the next available number
          const availableNumbers = getAvailableBookNumbers(
            books,
            selectedSeriesName,
            book.id
          );
          setManagedBookSeriesNumber(
            availableNumbers.length > 0 ? availableNumbers[0] : 1
          );
        }
      }
    } else {
      setManagedBookSeriesName(book.seriesName || "");
      setManagedBookSeriesNumber(book.seriesNumber || 1);
    }
    setManagedBookContributors(book.contributors || []);
    setManagedBookDescription(book.description || "");
    setManagedBookGenre(book.genre || "");
    setManagedBookAgeGroup(book.ageGroup || "Adult");
    setManagedBookPublisherName(book.publisherName || "");
    setManagedBookIsbnEpub(book.isbnEpub || "");
    setManagedBookIsbnKindle(book.isbnKindle || "");
    setManagedBookIsbnPaperback(book.isbnPaperback || "");
    setManagedBookIsbnHardcover(book.isbnHardcover || "");
    setManagedBookIsbnPdf(book.isbnPdf || "");
    setManagedBookClauseAllRightsReserved(
      book.clauseAllRightsReserved || false
    );
    setManagedBookClauseFiction(book.clauseFiction || false);
    setManagedBookClauseMoralRights(book.clauseMoralRights || false);
    setManagedBookClauseCustom(book.clauseCustom || false);
    setManagedBookCustomClauseText(book.customClauseText || "");
    setCurrentView("manage");
  };

  const handleBackToBookshelf = () => {
    setCurrentView("bookshelf");
    setSelectedBook(null);
    setIsQuickStoryMode(false);
    setManagedBookTitle("");
    setManagedBookAuthor("");
    setManagedBookSubtitle("");
    setManagedBookEdition("First Edition");
    setManagedBookCopyrightYear(new Date().getFullYear().toString());
    setManagedBookIsSeries(false);
    setManagedBookSeriesName("");
    setManagedBookSeriesNumber(1);
    setManagedBookContributors([]);
    setManagedBookDescription("");
    setManagedBookGenre("");
    setManagedBookAgeGroup("Adult");
    setManagedBookPublisherName("");
    setManagedBookIsbnEpub("");
    setManagedBookIsbnKindle("");
    setManagedBookIsbnPaperback("");
    setManagedBookIsbnHardcover("");
    setManagedBookIsbnPdf("");
    setManagedBookClauseAllRightsReserved(false);
    setManagedBookClauseFiction(false);
    setManagedBookClauseMoralRights(false);
    setManagedBookClauseCustom(false);
    setManagedBookCustomClauseText("");

    // Reload books from localStorage to pick up any word count updates
    if (session?.user?.email) {
      const updatedBooks = loadBooksFromStorage(session.user.email);
      setBooks(updatedBooks);
    }
  };

  const handleSaveBook = () => {
    if (managedBookTitle.trim() && managedBookAuthor.trim() && selectedBook) {
      // Validation for series
      if (managedBookIsSeries && !managedBookSeriesName.trim()) {
        showNotification(
          "Please enter a series name or disable the series option."
        );
        return;
      }

      const updatedBook: Book = {
        ...selectedBook,
        title: managedBookTitle.trim(),
        subtitle: managedBookSubtitle.trim(),
        author: managedBookAuthor.trim(),
        edition: managedBookEdition,
        copyrightYear: managedBookCopyrightYear,
        isSeries: managedBookIsSeries,
        seriesName: managedBookIsSeries
          ? managedBookSeriesName.trim()
          : undefined,
        seriesNumber: managedBookIsSeries ? managedBookSeriesNumber : undefined,
        contributors:
          managedBookContributors.length > 0
            ? managedBookContributors
            : undefined,
        description: managedBookDescription.trim() || undefined,
        genre: managedBookGenre.trim() || undefined,
        ageGroup: managedBookAgeGroup,
        publisherName: managedBookPublisherName.trim() || undefined,
        isbnEpub: managedBookIsbnEpub.trim() || undefined,
        isbnKindle: managedBookIsbnKindle.trim() || undefined,
        isbnPaperback: managedBookIsbnPaperback.trim() || undefined,
        isbnHardcover: managedBookIsbnHardcover.trim() || undefined,
        isbnPdf: managedBookIsbnPdf.trim() || undefined,
        clauseAllRightsReserved:
          managedBookClauseAllRightsReserved || undefined,
        clauseFiction: managedBookClauseFiction || undefined,
        clauseMoralRights: managedBookClauseMoralRights || undefined,
        clauseCustom: managedBookClauseCustom || undefined,
        customClauseText: managedBookClauseCustom
          ? managedBookCustomClauseText.trim() || undefined
          : undefined,
        updatedAt: new Date().toISOString(),
      };

      const updatedBooks = books.map((book) =>
        book.id === selectedBook.id ? updatedBook : book
      );

      setBooks(updatedBooks);
      if (session?.user?.email) {
        saveBooksToStorage(updatedBooks, session.user.email);
      }

      showNotification(`"${updatedBook.title}" has been saved successfully!`);
      console.log("Book saved successfully:", updatedBook.title);
      handleBackToBookshelf();
    }
  };

  // Contributor handler functions
  const handleAddContributor = () => {
    if (managedBookContributors.length >= 10) {
      showNotification("Maximum of 10 contributors allowed.");
      return;
    }

    const newContributor: Contributor = {
      id: Date.now().toString(),
      role: "Co-Author",
      firstName: "",
      lastName: "",
    };

    setManagedBookContributors([...managedBookContributors, newContributor]);
  };

  const handleUpdateContributor = (
    id: string,
    field: keyof Contributor,
    value: string
  ) => {
    setManagedBookContributors((contributors) =>
      contributors.map((contributor) =>
        contributor.id === id ? { ...contributor, [field]: value } : contributor
      )
    );
  };

  const handleDeleteContributor = (id: string) => {
    setManagedBookContributors((contributors) =>
      contributors.filter((contributor) => contributor.id !== id)
    );
  };

  const handleMoveContributor = (index: number, direction: "up" | "down") => {
    const newContributors = [...managedBookContributors];
    const targetIndex = direction === "up" ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newContributors.length) return;

    [newContributors[index], newContributors[targetIndex]] = [
      newContributors[targetIndex],
      newContributors[index],
    ];

    setManagedBookContributors(newContributors);
  };

  const handleCoverUpload = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveCover = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the upload click
    if (selectedBook) {
      const updatedBook = {
        ...selectedBook,
        coverImage: undefined,
        updatedAt: new Date().toISOString(),
      };

      setSelectedBook(updatedBook);

      // Update the books array
      const updatedBooks = books.map((book) =>
        book.id === selectedBook.id ? updatedBook : book
      );
      setBooks(updatedBooks);

      // Save to localStorage
      if (session?.user?.email) {
        saveBooksToStorage(updatedBooks, session.user.email);
      }

      showNotification("Cover image removed successfully!");
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check if file is an image
      if (!file.type.startsWith("image/")) {
        showNotification("Please select an image file.");
        return;
      }

      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showNotification("Image file size must be less than 5MB.");
        return;
      }

      // Convert to base64
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64String = e.target?.result as string;
        if (selectedBook) {
          const updatedBook = {
            ...selectedBook,
            coverImage: base64String,
            updatedAt: new Date().toISOString(),
          };

          setSelectedBook(updatedBook);

          // Update the books array
          const updatedBooks = books.map((book) =>
            book.id === selectedBook.id ? updatedBook : book
          );
          setBooks(updatedBooks);

          // Save to localStorage
          if (session?.user?.email) {
            saveBooksToStorage(updatedBooks, session.user.email);
          }

          showNotification("Cover image uploaded successfully!");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExportBook = () => {
    if (selectedBook) {
      setShowExportModal(true);
    }
  };

  // Helper function to clean up all localStorage data for a book
  const cleanupBookData = (
    bookId: number,
    userEmail: string,
    isQuickStory: boolean = false
  ) => {
    const dataTypes = [
      "ideas",
      "characters",
      "chapters",
      "stories",
      "outlines",
      "parts",
      "recent-activity",
    ];

    const prefix = isQuickStory ? "quickstory" : "book";

    dataTypes.forEach((type) => {
      const storageKey = `twain-${prefix}-${type}-${bookId}-${userEmail}`;
      localStorage.removeItem(storageKey);
      console.log(`Removed localStorage key: ${storageKey}`);
    });
  };

  const handleDeleteBook = () => {
    if (selectedBook) {
      handleOpenDeleteModal(selectedBook, false);
    }
  };

  const handleStoryOptions = (story: Book) => {
    setSelectedStoryForOptions(story);
    setStoryOptionsTitle(story.title);
    setStoryOptionsMoveToBook("");
    setShowStoryOptionsModal(true);
  };

  const handleCloseStoryOptionsModal = () => {
    setShowStoryOptionsModal(false);
    setSelectedStoryForOptions(null);
    setStoryOptionsTitle("");
    setStoryOptionsMoveToBook("");
  };

  const handleUpdateStoryOptions = () => {
    if (!selectedStoryForOptions || !session?.user?.email) return;

    // Update story title if changed
    if (
      storyOptionsTitle.trim() &&
      storyOptionsTitle !== selectedStoryForOptions.title
    ) {
      const updatedStory = {
        ...selectedStoryForOptions,
        title: storyOptionsTitle.trim(),
        updatedAt: new Date().toISOString(),
      };

      const updatedQuickStories = quickStories.map((s) =>
        s.id === selectedStoryForOptions.id ? updatedStory : s
      );
      setQuickStories(updatedQuickStories);
      saveQuickStoriesToStorage(updatedQuickStories, session.user.email);
      setSelectedStoryForOptions(updatedStory);
    }

    // Move to book if selected
    if (storyOptionsMoveToBook) {
      handleMoveStoryToBook();
      return;
    }

    showNotification("Story updated successfully!");
    handleCloseStoryOptionsModal();
  };

  const handleMoveStoryToBook = async () => {
    if (
      !selectedStoryForOptions ||
      !session?.user?.email ||
      !storyOptionsMoveToBook
    )
      return;

    try {
      const targetBookId = parseInt(storyOptionsMoveToBook);
      const targetBook = books.find((b) => b.id === targetBookId);

      if (!targetBook) {
        showNotification("Target book not found!");
        return;
      }

      // Load story content from localStorage
      const storyContentKey = `twain-quickstory-stories-${selectedStoryForOptions.id}-${session.user.email}`;
      const storedStoryContent = localStorage.getItem(storyContentKey);

      if (!storedStoryContent) {
        showNotification("Story content not found!");
        return;
      }

      const storyContent = JSON.parse(storedStoryContent);

      // Create a new chapter from the story
      const chaptersKey = `twain-book-chapters-${targetBookId}-${session.user.email}`;
      const existingChapters = localStorage.getItem(chaptersKey);
      const chapters = existingChapters ? JSON.parse(existingChapters) : [];

      const newChapter = {
        id: Date.now().toString(),
        title: storyOptionsTitle.trim() || selectedStoryForOptions.title,
        content:
          storyContent.length > 0
            ? JSON.stringify(storyContent[0].content)
            : '{"ops":[]}',
        createdAt: new Date().toISOString(),
      };

      chapters.push(newChapter);
      localStorage.setItem(chaptersKey, JSON.stringify(chapters));

      // Remove the story from quick stories
      const updatedQuickStories = quickStories.filter(
        (s) => s.id !== selectedStoryForOptions.id
      );
      setQuickStories(updatedQuickStories);
      saveQuickStoriesToStorage(updatedQuickStories, session.user.email);

      // Clean up story data
      cleanupBookData(selectedStoryForOptions.id, session.user.email, true);

      showNotification(
        `Story moved to "${targetBook.title}" as a new chapter!`
      );
      handleCloseStoryOptionsModal();
    } catch (error) {
      console.error("Error moving story to book:", error);
      showNotification("Failed to move story. Please try again.");
    }
  };

  const handleDeleteStoryFromModal = () => {
    if (selectedStoryForOptions) {
      handleCloseStoryOptionsModal();
      handleOpenDeleteModal(selectedStoryForOptions, true);
    }
  };

  const handleWriteBook = (book: Book) => {
    setSelectedBook(book);
    // Store book data for the story writer page
    localStorage.setItem("currentSelectedBook", JSON.stringify(book));
    localStorage.setItem("isQuickStoryMode", "false");
    router.push("/storywriter");
  };

  if (status === "loading") {
    return (
      <div
        className="min-h-screen flex items-center justify-center text-gray-800"
        style={{ fontFamily: "'Crimson-Text', sans-serif" }}
      >
        <Typography>Loading...</Typography>
      </div>
    );
  }

  if (session) {
    // User is logged in - show the bookshelf interface, manage page, or writer
    if (currentView === "write" && selectedBook) {
      return (
        <TwainStoryWriter
          book={selectedBook}
          onBackToBookshelf={handleBackToBookshelf}
          isQuickStoryMode={isQuickStoryMode}
          autoStartStory={isQuickStoryMode}
        />
      );
    }

    if (currentView === "manage" && selectedBook) {
      return (
        <div className="min-h-screen flex flex-col">
          {/* Header - 300px tall */}
          <header
            className="h-[300px] flex flex-col justify-center items-center text-white relative"
            style={{ backgroundColor: "rgb(38, 52, 63)" }}
          >
            {/* Profile Menu - Top Right */}
            <TwainProfileMenu
              session={session}
              planType={planType}
              onAccountSettings={handleAccountSettings}
              onAbout={handleAbout}
              onHelp={handleHelp}
              onFeedback={handleFeedback}
              onLogout={handleLogout}
            />

            <div style={{ position: "relative", display: "inline-block" }}>
              <Image
                src="/images/twain-logo.png"
                alt="Twain Logo"
                width={120}
                height={120}
                style={{
                  filter: "invert(1) brightness(100%)",
                  marginBottom: "16px",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: "0",
                  right: "-12px",
                  backgroundColor: "#ff4757",
                  color: "white",
                  fontSize: "14px",
                  fontWeight: "bold",
                  padding: "4px 8px",
                  borderRadius: "6px",
                  fontFamily: "'Rubik', sans-serif",
                  border: "1px solid white",
                  zIndex: 10,
                }}
              >
                BETA
              </div>
            </div>
            <Typography
              variant="h4"
              sx={{
                fontFamily: "'Rubik', sans-serif",
                fontWeight: 600,
                marginBottom: 1,
              }}
            >
              Manage Book
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontFamily: "'Rubik', sans-serif",
                fontWeight: 300,
                fontSize: "14px",
                textAlign: "center",
                maxWidth: "600px",
              }}
            >
              Edit your book details, cover image and manage settings
            </Typography>
          </header>

          {/* Navigation Bar */}
          <div className="bg-white border-b border-gray-200 px-8 py-4">
            <div className="w-[90%] md:w-[80%] mx-auto flex items-center">
              <IconButton
                onClick={handleBackToBookshelf}
                sx={{
                  mr: 2,
                  color: "rgb(19, 135, 194)",
                  "&:hover": {
                    backgroundColor: "rgba(19, 135, 194, 0.1)",
                  },
                }}
              >
                <ArrowBackIcon />
              </IconButton>
            </div>
          </div>

          {/* Main content area - Book Management Form */}
          <main className="flex-1 bg-gray-100 p-4 lg:p-8">
            <div className="w-[95%] lg:w-[60%] mx-auto">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="space-y-6">
                  {/* Book Cover and Title Edit */}
                  <div className="flex flex-col lg:flex-row gap-8 items-start lg:items-start">
                    {/* Book Card with Upload Icon */}
                    <div className="flex flex-col items-center w-full lg:w-auto">
                      {/* Mobile: Simple button when no cover */}
                      {!selectedBook?.coverImage && (
                        <Button
                          variant="contained"
                          startIcon={<CloudUploadOutlinedIcon />}
                          onClick={handleCoverUpload}
                          sx={{
                            backgroundColor: "rgb(100, 114, 127)",
                            "&:hover": {
                              backgroundColor: "rgb(80, 94, 107)",
                            },
                            width: "100%",
                            maxWidth: "300px",
                            marginBottom: "16px",
                            display: { xs: "flex", lg: "none" },
                          }}
                        >
                          Upload Cover Image
                        </Button>
                      )}

                      {/* Desktop: Show book card preview OR Mobile: Show only when cover exists */}
                      <div
                        className={`bg-white shadow-sm flex flex-col rounded-r-md cursor-pointer relative overflow-hidden w-full lg:w-[176px] ${
                          !selectedBook?.coverImage ? "hidden lg:flex" : ""
                        }`}
                        style={{
                          aspectRatio: "176/268",
                          borderLeft: "8px solid rgb(100, 114, 127)",
                          maxWidth: "100%",
                          height: "auto",
                        }}
                        onClick={handleCoverUpload}
                      >
                        {selectedBook?.coverImage ? (
                          <div className="w-full h-full relative">
                            <Image
                              src={selectedBook.coverImage}
                              alt="Book cover preview"
                              fill
                              style={{ objectFit: "cover" }}
                              className="rounded-r-sm"
                            />
                            {/* Upload overlay on hover */}
                            <div className="absolute inset-0 bg-black bg-opacity-20 flex flex-col items-center justify-center opacity-0 hover:opacity-60 transition-opacity duration-200 rounded-r-sm">
                              <CloudUploadOutlinedIcon
                                sx={{
                                  fontSize: 48,
                                  color: "white",
                                }}
                              />
                              <span className="text-sm text-white mt-2">
                                Change Cover
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex-1 flex flex-col items-center justify-center">
                            <CloudUploadOutlinedIcon
                              sx={{
                                fontSize: 64,
                                color: "rgb(156, 163, 175)",
                              }}
                            />
                            <span className="text-sm text-gray-600 mt-2">
                              Upload Cover
                            </span>
                            {/* Info icon with tooltip */}
                            <Tooltip
                              title="For the best results, your book cover image should have a dimension ratio of 1:1.6, and measure at least 2500px on the longest side."
                              placement="top"
                              arrow
                            >
                              <InfoOutlinedIcon
                                sx={{
                                  fontSize: 16,
                                  color: "rgb(156, 163, 175)",
                                  marginTop: "4px",
                                }}
                              />
                            </Tooltip>
                          </div>
                        )}
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          accept="image/*"
                          style={{ display: "none" }}
                        />
                      </div>

                      {/* Remove button - only show when cover exists */}
                      {selectedBook?.coverImage && (
                        <button
                          onClick={handleRemoveCover}
                          className="mt-2 text-gray-400 hover:text-gray-600 transition-colors duration-200 flex items-center justify-center cursor-pointer"
                          title="Remove cover image"
                        >
                          <DeleteOutlinedIcon sx={{ fontSize: 14 }} />
                          <span className="text-xs ml-1">Remove Cover</span>
                        </button>
                      )}
                    </div>
                    {/* Title TextField */}
                    <div className="flex-1">
                      <TextField
                        fullWidth
                        label="Book Title"
                        value={managedBookTitle}
                        onChange={(e) => setManagedBookTitle(e.target.value)}
                        variant="outlined"
                        sx={{ mb: 2 }}
                      />
                      <TextField
                        fullWidth
                        label="Sub Title (optional)"
                        value={managedBookSubtitle}
                        onChange={(e) => setManagedBookSubtitle(e.target.value)}
                        variant="outlined"
                        sx={{ mb: 2 }}
                      />
                      <TextField
                        fullWidth
                        label="Author Name or Pen Name"
                        value={managedBookAuthor}
                        onChange={(e) => setManagedBookAuthor(e.target.value)}
                        variant="outlined"
                        sx={{ mb: 2 }}
                      />
                      <div className="flex gap-4">
                        <FormControl sx={{ flex: 1 }}>
                          <InputLabel>Edition</InputLabel>
                          <Select
                            value={managedBookEdition}
                            label="Edition"
                            onChange={(e) =>
                              setManagedBookEdition(e.target.value)
                            }
                          >
                            <MenuItem value="First Edition">
                              First Edition
                            </MenuItem>
                            <MenuItem value="Second Edition">
                              Second Edition
                            </MenuItem>
                            <MenuItem value="Third Edition">
                              Third Edition
                            </MenuItem>
                            <MenuItem value="Fourth Edition">
                              Fourth Edition
                            </MenuItem>
                            <MenuItem value="Fifth Edition">
                              Fifth Edition
                            </MenuItem>
                            <MenuItem value="Sixth Edition">
                              Sixth Edition
                            </MenuItem>
                            <MenuItem value="Seventh Edition">
                              Seventh Edition
                            </MenuItem>
                            <MenuItem value="Eighth Edition">
                              Eighth Edition
                            </MenuItem>
                            <MenuItem value="Ninth Edition">
                              Ninth Edition
                            </MenuItem>
                            <MenuItem value="Tenth Edition">
                              Tenth Edition
                            </MenuItem>
                          </Select>
                        </FormControl>
                        <TextField
                          sx={{ flex: 1 }}
                          label="Copyright Year"
                          value={managedBookCopyrightYear}
                          onChange={(e) =>
                            setManagedBookCopyrightYear(e.target.value)
                          }
                          variant="outlined"
                          type="number"
                        />
                      </div>

                      {/* Series Section */}
                      <div className="mt-4">
                        <div className="flex items-center justify-between mb-2">
                          <FormControlLabel
                            control={
                              <Switch
                                checked={managedBookIsSeries}
                                onChange={(e) =>
                                  setManagedBookIsSeries(e.target.checked)
                                }
                                color="primary"
                                disabled={
                                  planType !== "professional" &&
                                  getTotalBooksInSeries(books) >= 3 &&
                                  !managedBookIsSeries
                                }
                              />
                            }
                            label="This book is part of a series"
                            sx={{ mb: 0 }}
                          />
                          {planType !== "professional" &&
                            getTotalBooksInSeries(books) >= 3 &&
                            !managedBookIsSeries && (
                              <ProfessionalFeatureChip
                                label="Upgrade to Professional"
                                size="medium"
                                onClick={handleShowPricing}
                              />
                            )}
                        </div>

                        {managedBookIsSeries && (
                          <div className="space-y-4">
                            {/* Series Name Field */}
                            <div className="flex gap-4">
                              <FormControl sx={{ flex: 2 }}>
                                <InputLabel>Series</InputLabel>
                                <Select
                                  value={
                                    managedBookSeriesName === ""
                                      ? "New Series"
                                      : Array.from(
                                          new Set(
                                            books
                                              .filter(
                                                (book) =>
                                                  book.isSeries &&
                                                  book.seriesName &&
                                                  book.id !== selectedBook?.id
                                              )
                                              .map((book) => book.seriesName)
                                          )
                                        ).includes(managedBookSeriesName)
                                      ? managedBookSeriesName
                                      : "New Series"
                                  }
                                  label="Series"
                                  onChange={(e) => {
                                    if (e.target.value === "New Series") {
                                      setManagedBookSeriesName("");
                                      setManagedBookSeriesNumber(1);
                                    } else {
                                      setManagedBookSeriesName(e.target.value);
                                      // Set book number to next available in this series
                                      const availableNumbers =
                                        getAvailableBookNumbers(
                                          books,
                                          e.target.value,
                                          selectedBook?.id
                                        );
                                      setManagedBookSeriesNumber(
                                        availableNumbers.length > 0
                                          ? availableNumbers[0]
                                          : 1
                                      );
                                    }
                                  }}
                                  disabled={
                                    planType !== "professional" &&
                                    getExistingSeriesCount(books) >= 1
                                  }
                                >
                                  <MenuItem value="New Series">
                                    New Series
                                  </MenuItem>
                                  {/* Get unique series names from existing books */}
                                  {Array.from(
                                    new Set(
                                      books
                                        .filter(
                                          (book) =>
                                            book.isSeries &&
                                            book.seriesName &&
                                            book.id !== selectedBook?.id
                                        )
                                        .map((book) => book.seriesName)
                                    )
                                  ).map((seriesName) => (
                                    <MenuItem
                                      key={seriesName}
                                      value={seriesName}
                                    >
                                      {seriesName}
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>

                              <FormControl sx={{ flex: 1 }}>
                                <InputLabel>Book Number</InputLabel>
                                <Select
                                  value={managedBookSeriesNumber}
                                  label="Book Number"
                                  onChange={(e) =>
                                    setManagedBookSeriesNumber(
                                      Number(e.target.value)
                                    )
                                  }
                                  disabled={
                                    planType !== "professional" &&
                                    getTotalBooksInSeries(books) >= 3 &&
                                    !selectedBook?.isSeries
                                  }
                                >
                                  {getAvailableBookNumbers(
                                    books,
                                    managedBookSeriesName,
                                    selectedBook?.id
                                  ).map((num) => (
                                    <MenuItem key={num} value={num}>
                                      Book {num}
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            </div>

                            {/* New Series Name Field - show when "New Series" is selected */}
                            {(managedBookSeriesName === "" ||
                              !Array.from(
                                new Set(
                                  books
                                    .filter(
                                      (book) =>
                                        book.isSeries &&
                                        book.seriesName &&
                                        book.id !== selectedBook?.id
                                    )
                                    .map((book) => book.seriesName)
                                )
                              ).includes(managedBookSeriesName)) && (
                              <TextField
                                fullWidth
                                label="New Series Name"
                                value={managedBookSeriesName}
                                onChange={(e) =>
                                  setManagedBookSeriesName(e.target.value)
                                }
                                variant="outlined"
                                placeholder="Enter the name of your new series"
                                disabled={
                                  planType !== "professional" &&
                                  getExistingSeriesCount(books) >= 1
                                }
                              />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Dedication Section */}
                  <div className="mt-6">
                    <Typography
                      variant="h6"
                      sx={{
                        fontFamily: "'Rubik', sans-serif",
                        fontWeight: 600,
                        color: "rgb(31, 41, 55)",
                        mb: 2,
                      }}
                    >
                      Dedication
                    </Typography>

                    <div className="relative">
                      <TextField
                        fullWidth
                        multiline
                        rows={6}
                        value={managedBookDescription}
                        onChange={(e) => {
                          const value = e.target.value;
                          // Allow pasting but truncate if it exceeds 4000 characters
                          setManagedBookDescription(value.slice(0, 4000));
                        }}
                        variant="outlined"
                        placeholder="Enter a dedication for your book..."
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            fontFamily: "'Rubik', sans-serif",
                          },
                        }}
                      />

                      {/* Character Counter */}
                      <div className="absolute bottom-3 right-3 text-sm text-gray-500 bg-white px-2 py-1 rounded">
                        <Typography
                          variant="caption"
                          sx={{
                            fontFamily: "'Rubik', sans-serif",
                            color:
                              managedBookDescription.length > 3800
                                ? "rgb(248, 113, 113)"
                                : "rgb(107, 114, 128)",
                          }}
                        >
                          {4000 - managedBookDescription.length} characters
                          remaining
                        </Typography>
                      </div>
                    </div>

                    {/* Genre and Age Group */}
                    <div className="flex gap-4 mt-4">
                      <FormControl sx={{ flex: 2 }}>
                        <InputLabel>Genre</InputLabel>
                        <Select
                          value={managedBookGenre}
                          label="Genre"
                          onChange={(e) => setManagedBookGenre(e.target.value)}
                        >
                          <MenuItem value="Fantasy">Fantasy</MenuItem>
                          <MenuItem value="Science Fiction">
                            Science Fiction
                          </MenuItem>
                          <MenuItem value="Romance">Romance</MenuItem>
                          <MenuItem value="Mystery">Mystery</MenuItem>
                          <MenuItem value="Thriller">Thriller</MenuItem>
                          <MenuItem value="Horror">Horror</MenuItem>
                          <MenuItem value="Historical Fiction">
                            Historical Fiction
                          </MenuItem>
                          <MenuItem value="Contemporary Fiction">
                            Contemporary Fiction
                          </MenuItem>
                          <MenuItem value="Literary Fiction">
                            Literary Fiction
                          </MenuItem>
                          <MenuItem value="Young Adult">Young Adult</MenuItem>
                          <MenuItem value="Children's">
                            Children&apos;s
                          </MenuItem>
                          <MenuItem value="Biography">Biography</MenuItem>
                          <MenuItem value="Memoir">Memoir</MenuItem>
                          <MenuItem value="Self-Help">Self-Help</MenuItem>
                          <MenuItem value="Business">Business</MenuItem>
                          <MenuItem value="Health & Fitness">
                            Health & Fitness
                          </MenuItem>
                          <MenuItem value="Travel">Travel</MenuItem>
                          <MenuItem value="Cooking">Cooking</MenuItem>
                          <MenuItem value="History">History</MenuItem>
                          <MenuItem value="True Crime">True Crime</MenuItem>
                          <MenuItem value="Religion & Spirituality">
                            Religion & Spirituality
                          </MenuItem>
                          <MenuItem value="Poetry">Poetry</MenuItem>
                          <MenuItem value="Drama">Drama</MenuItem>
                          <MenuItem value="Comedy">Comedy</MenuItem>
                          <MenuItem value="Adventure">Adventure</MenuItem>
                          <MenuItem value="Western">Western</MenuItem>
                          <MenuItem value="Dystopian">Dystopian</MenuItem>
                          <MenuItem value="Paranormal">Paranormal</MenuItem>
                          <MenuItem value="Urban Fantasy">
                            Urban Fantasy
                          </MenuItem>
                          <MenuItem value="Crime">Crime</MenuItem>
                        </Select>
                      </FormControl>

                      <FormControl sx={{ flex: 1 }}>
                        <InputLabel>Age Group</InputLabel>
                        <Select
                          value={managedBookAgeGroup}
                          label="Age Group"
                          onChange={(e) =>
                            setManagedBookAgeGroup(
                              e.target.value as "Adult" | "Teen" | "Child"
                            )
                          }
                        >
                          <MenuItem value="Adult">Adult</MenuItem>
                          <MenuItem value="Teen">Teen</MenuItem>
                          <MenuItem value="Child">Child</MenuItem>
                        </Select>
                      </FormControl>
                    </div>
                  </div>

                  {/* Contributors Section */}
                  <div className="mt-6">
                    <div className="mb-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-2">
                        <div className="flex items-center gap-2">
                          <Typography
                            variant="h6"
                            sx={{
                              fontFamily: "'Rubik', sans-serif",
                              fontWeight: 600,
                              color:
                                planType !== "professional"
                                  ? "rgb(156, 163, 175)"
                                  : "rgb(31, 41, 55)",
                            }}
                          >
                            Contributors
                          </Typography>
                          {planType !== "professional" && (
                            <ProfessionalFeatureChip
                              label="Upgrade to Professional"
                              size="medium"
                              onClick={handleShowPricing}
                            />
                          )}
                        </div>
                        <div className="hidden sm:block">
                          <Button
                            onClick={handleAddContributor}
                            variant="outlined"
                            startIcon={<AddIcon />}
                            disabled={
                              managedBookContributors.length >= 10 ||
                              planType !== "professional"
                            }
                            sx={{
                              textTransform: "none",
                              fontFamily: "'Rubik', sans-serif",
                              borderColor: "rgb(19, 135, 194)",
                              color: "rgb(19, 135, 194)",
                              "&:hover": {
                                borderColor: "rgb(15, 108, 155)",
                                backgroundColor: "rgba(19, 135, 194, 0.04)",
                              },
                              "&:disabled": {
                                borderColor: "rgb(209, 213, 219)",
                                color: "rgb(156, 163, 175)",
                              },
                            }}
                          >
                            Add Contributor
                          </Button>
                        </div>
                      </div>
                      <Typography
                        variant="body2"
                        sx={{
                          fontFamily: "'Rubik', sans-serif",
                          color:
                            planType !== "professional"
                              ? "rgb(156, 163, 175)"
                              : "rgb(107, 114, 128)",
                          fontSize: "14px",
                          mb: 2,
                        }}
                      >
                        Add up to 10 contributors. They&apos;ll display in the
                        order you enter below.
                      </Typography>
                      <div className="block sm:hidden">
                        <Button
                          onClick={handleAddContributor}
                          variant="outlined"
                          startIcon={<AddIcon />}
                          disabled={
                            managedBookContributors.length >= 10 ||
                            planType !== "professional"
                          }
                          sx={{
                            textTransform: "none",
                            fontFamily: "'Rubik', sans-serif",
                            borderColor: "rgb(19, 135, 194)",
                            color: "rgb(19, 135, 194)",
                            "&:hover": {
                              borderColor: "rgb(15, 108, 155)",
                              backgroundColor: "rgba(19, 135, 194, 0.04)",
                            },
                            "&:disabled": {
                              borderColor: "rgb(209, 213, 219)",
                              color: "rgb(156, 163, 175)",
                            },
                          }}
                        >
                          Add Contributor
                        </Button>
                      </div>
                    </div>

                    {/* Contributors List */}
                    <div className="space-y-3">
                      {managedBookContributors.map((contributor, index) => (
                        <div
                          key={contributor.id}
                          className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                        >
                          {/* Move Up/Down Buttons */}
                          <div className="flex flex-col">
                            <IconButton
                              size="small"
                              onClick={() => handleMoveContributor(index, "up")}
                              disabled={
                                index === 0 || planType !== "professional"
                              }
                              sx={{
                                padding: "2px",
                                color:
                                  index === 0 || planType !== "professional"
                                    ? "rgb(209, 213, 219)"
                                    : "rgb(107, 114, 128)",
                                "&:hover": {
                                  backgroundColor:
                                    index === 0 || planType !== "professional"
                                      ? "transparent"
                                      : "rgba(107, 114, 128, 0.1)",
                                },
                              }}
                            >
                              <KeyboardArrowUpIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() =>
                                handleMoveContributor(index, "down")
                              }
                              disabled={
                                index === managedBookContributors.length - 1 ||
                                planType !== "professional"
                              }
                              sx={{
                                padding: "2px",
                                color:
                                  index ===
                                    managedBookContributors.length - 1 ||
                                  planType !== "professional"
                                    ? "rgb(209, 213, 219)"
                                    : "rgb(107, 114, 128)",
                                "&:hover": {
                                  backgroundColor:
                                    index ===
                                      managedBookContributors.length - 1 ||
                                    planType !== "professional"
                                      ? "transparent"
                                      : "rgba(107, 114, 128, 0.1)",
                                },
                              }}
                            >
                              <KeyboardArrowDownIcon fontSize="small" />
                            </IconButton>
                          </div>

                          {/* Role Select */}
                          <FormControl sx={{ minWidth: 140 }}>
                            <InputLabel size="small">Role</InputLabel>
                            <Select
                              size="small"
                              value={contributor.role}
                              label="Role"
                              onChange={(e) =>
                                handleUpdateContributor(
                                  contributor.id,
                                  "role",
                                  e.target.value
                                )
                              }
                              disabled={planType !== "professional"}
                            >
                              <MenuItem value="Co-Author">Co-Author</MenuItem>
                              <MenuItem value="Editor">Editor</MenuItem>
                              <MenuItem value="Illustrator">
                                Illustrator
                              </MenuItem>
                              <MenuItem value="Photographer">
                                Photographer
                              </MenuItem>
                              <MenuItem value="Translator">Translator</MenuItem>
                              <MenuItem value="Foreword">Foreword</MenuItem>
                              <MenuItem value="Introduction">
                                Introduction
                              </MenuItem>
                              <MenuItem value="Preface">Preface</MenuItem>
                              <MenuItem value="Agent">Agent</MenuItem>
                              <MenuItem value="Proof Reader">
                                Proof Reader
                              </MenuItem>
                              <MenuItem value="Advisor">Advisor</MenuItem>
                              <MenuItem value="Typesetter">Typesetter</MenuItem>
                            </Select>
                          </FormControl>

                          {/* First Name */}
                          <TextField
                            size="small"
                            label="First Name"
                            value={contributor.firstName}
                            onChange={(e) =>
                              handleUpdateContributor(
                                contributor.id,
                                "firstName",
                                e.target.value
                              )
                            }
                            sx={{ flex: 1 }}
                            disabled={planType !== "professional"}
                          />

                          {/* Last Name */}
                          <TextField
                            size="small"
                            label="Last Name"
                            value={contributor.lastName}
                            onChange={(e) =>
                              handleUpdateContributor(
                                contributor.id,
                                "lastName",
                                e.target.value
                              )
                            }
                            sx={{ flex: 1 }}
                            disabled={planType !== "professional"}
                          />

                          {/* Delete Button */}
                          <IconButton
                            onClick={() =>
                              handleDeleteContributor(contributor.id)
                            }
                            disabled={planType !== "professional"}
                            sx={{
                              color:
                                planType !== "professional"
                                  ? "rgb(209, 213, 219)"
                                  : "rgb(248, 113, 113)",
                              "&:hover": {
                                backgroundColor:
                                  planType !== "professional"
                                    ? "transparent"
                                    : "rgba(248, 113, 113, 0.1)",
                              },
                            }}
                          >
                            <DeleteOutlinedIcon />
                          </IconButton>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Publisher Details */}
                  <div className="mt-8">
                    <div className="flex items-center gap-3 mb-4">
                      <h3
                        className={`text-lg font-semibold ${
                          planType !== "professional"
                            ? "text-gray-400"
                            : "text-gray-800"
                        }`}
                      >
                        Publisher Details
                      </h3>
                      {planType !== "professional" && (
                        <ProfessionalFeatureChip
                          label="Upgrade to Professional"
                          size="medium"
                          onClick={handleShowPricing}
                        />
                      )}
                    </div>

                    {/* Publisher Name */}
                    <div className="mb-4">
                      <TextField
                        fullWidth
                        label="Publisher Name"
                        value={managedBookPublisherName}
                        onChange={(e) =>
                          setManagedBookPublisherName(e.target.value)
                        }
                        variant="outlined"
                        disabled={planType !== "professional"}
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            fontFamily: "'Rubik', sans-serif",
                          },
                          "& .MuiInputLabel-root": {
                            fontFamily: "'Rubik', sans-serif",
                          },
                        }}
                      />
                    </div>

                    {/* ISBN Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <TextField
                        label="ISBN - EPUB"
                        placeholder="000-0-00-000000-0"
                        value={managedBookIsbnEpub}
                        onChange={(e) => setManagedBookIsbnEpub(e.target.value)}
                        variant="outlined"
                        disabled={planType !== "professional"}
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            fontFamily: "'Rubik', sans-serif",
                          },
                          "& .MuiInputLabel-root": {
                            fontFamily: "'Rubik', sans-serif",
                          },
                        }}
                      />
                      <TextField
                        label="AISN - Kindle"
                        placeholder="000-0-00-000000-0"
                        value={managedBookIsbnKindle}
                        onChange={(e) =>
                          setManagedBookIsbnKindle(e.target.value)
                        }
                        variant="outlined"
                        disabled={planType !== "professional"}
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            fontFamily: "'Rubik', sans-serif",
                          },
                          "& .MuiInputLabel-root": {
                            fontFamily: "'Rubik', sans-serif",
                          },
                        }}
                      />
                      <TextField
                        label="ISBN - Paperback"
                        placeholder="000-0-00-000000-0"
                        value={managedBookIsbnPaperback}
                        onChange={(e) =>
                          setManagedBookIsbnPaperback(e.target.value)
                        }
                        variant="outlined"
                        disabled={planType !== "professional"}
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            fontFamily: "'Rubik', sans-serif",
                          },
                          "& .MuiInputLabel-root": {
                            fontFamily: "'Rubik', sans-serif",
                          },
                        }}
                      />
                      <TextField
                        label="ISBN - Hardcover"
                        placeholder="000-0-00-000000-0"
                        value={managedBookIsbnHardcover}
                        onChange={(e) =>
                          setManagedBookIsbnHardcover(e.target.value)
                        }
                        variant="outlined"
                        disabled={planType !== "professional"}
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            fontFamily: "'Rubik', sans-serif",
                          },
                          "& .MuiInputLabel-root": {
                            fontFamily: "'Rubik', sans-serif",
                          },
                        }}
                      />
                      <TextField
                        label="ISBN - PDF"
                        placeholder="000-0-00-000000-0"
                        value={managedBookIsbnPdf}
                        onChange={(e) => setManagedBookIsbnPdf(e.target.value)}
                        variant="outlined"
                        disabled={planType !== "professional"}
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            fontFamily: "'Rubik', sans-serif",
                          },
                          "& .MuiInputLabel-root": {
                            fontFamily: "'Rubik', sans-serif",
                          },
                        }}
                      />
                    </div>
                  </div>

                  {/* Clauses */}
                  <div className="mt-8">
                    <div className="flex items-center gap-3 mb-2">
                      <h3
                        className={`text-lg font-semibold ${
                          planType !== "professional"
                            ? "text-gray-400"
                            : "text-gray-800"
                        }`}
                      >
                        Clauses
                      </h3>
                      {planType !== "professional" && (
                        <ProfessionalFeatureChip
                          label="Upgrade to Professional"
                          size="medium"
                          onClick={handleShowPricing}
                        />
                      )}
                    </div>
                    <p
                      className={`text-sm mb-4 ${
                        planType !== "professional"
                          ? "text-gray-400"
                          : "text-gray-600"
                      }`}
                    >
                      These clauses help protect your rights and your book
                      rights. Check all that apply.
                    </p>

                    <FormGroup>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={managedBookClauseAllRightsReserved}
                            onChange={(e) =>
                              setManagedBookClauseAllRightsReserved(
                                e.target.checked
                              )
                            }
                            disabled={planType !== "professional"}
                            sx={{
                              color: "rgb(19, 135, 194)",
                              "&.Mui-checked": {
                                color: "rgb(19, 135, 194)",
                              },
                              mt: "-8px",
                            }}
                          />
                        }
                        label={
                          <div>
                            <div
                              className={`font-medium mb-1 ${
                                planType !== "professional"
                                  ? "text-gray-400"
                                  : "text-gray-800"
                              }`}
                            >
                              All rights reserved
                            </div>
                            <div
                              className={`text-sm ${
                                planType !== "professional"
                                  ? "text-gray-400"
                                  : "text-gray-600"
                              }`}
                            >
                              All rights reserved. No part of this publication
                              may be reproduced, stored or transmitted in any
                              form or by any means, electronic, mechanical,
                              photocopying, recording, scanning, or otherwise
                              without written permission from the publisher. It
                              is illegal to copy this book, post it to a
                              website, or distribute it by any other means
                              without permission.
                            </div>
                          </div>
                        }
                        sx={{
                          alignItems: "flex-start",
                          mb: 3,
                          "& .MuiFormControlLabel-label": {
                            fontFamily: "'Rubik', sans-serif",
                          },
                        }}
                      />

                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={managedBookClauseFiction}
                            onChange={(e) =>
                              setManagedBookClauseFiction(e.target.checked)
                            }
                            disabled={planType !== "professional"}
                            sx={{
                              color: "rgb(19, 135, 194)",
                              "&.Mui-checked": {
                                color: "rgb(19, 135, 194)",
                              },
                              mt: "-8px",
                            }}
                          />
                        }
                        label={
                          <div>
                            <div
                              className={`font-medium mb-1 ${
                                planType !== "professional"
                                  ? "text-gray-400"
                                  : "text-gray-800"
                              }`}
                            >
                              Fiction
                            </div>
                            <div
                              className={`text-sm ${
                                planType !== "professional"
                                  ? "text-gray-400"
                                  : "text-gray-600"
                              }`}
                            >
                              This novel is entirely a work of fiction. The
                              names, characters and incidents portrayed in it
                              are the work of the author&apos;s imagination. Any
                              resemblance to actual persons, living or dead,
                              events or localities is entirely coincidental.
                            </div>
                          </div>
                        }
                        sx={{
                          alignItems: "flex-start",
                          mb: 3,
                          "& .MuiFormControlLabel-label": {
                            fontFamily: "'Rubik', sans-serif",
                          },
                        }}
                      />

                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={managedBookClauseMoralRights}
                            onChange={(e) =>
                              setManagedBookClauseMoralRights(e.target.checked)
                            }
                            disabled={planType !== "professional"}
                            sx={{
                              color: "rgb(19, 135, 194)",
                              "&.Mui-checked": {
                                color: "rgb(19, 135, 194)",
                              },
                              mt: "-8px",
                            }}
                          />
                        }
                        label={
                          <div>
                            <div
                              className={`font-medium mb-1 ${
                                planType !== "professional"
                                  ? "text-gray-400"
                                  : "text-gray-800"
                              }`}
                            >
                              Moral rights
                            </div>
                            <div
                              className={`text-sm ${
                                planType !== "professional"
                                  ? "text-gray-400"
                                  : "text-gray-600"
                              }`}
                            >
                              {session?.user?.name || "Author"} asserts the
                              moral right to be identified as the author of this
                              work.
                            </div>
                          </div>
                        }
                        sx={{
                          alignItems: "flex-start",
                          mb: 3,
                          "& .MuiFormControlLabel-label": {
                            fontFamily: "'Rubik', sans-serif",
                          },
                        }}
                      />

                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={managedBookClauseCustom}
                            onChange={(e) =>
                              setManagedBookClauseCustom(e.target.checked)
                            }
                            disabled={planType !== "professional"}
                            sx={{
                              color: "rgb(19, 135, 194)",
                              "&.Mui-checked": {
                                color: "rgb(19, 135, 194)",
                              },
                              mt: "-8px",
                            }}
                          />
                        }
                        label={
                          <div>
                            <div
                              className={`font-medium mb-1 cursor-pointer ${
                                planType !== "professional"
                                  ? "text-gray-400"
                                  : "text-gray-800"
                              }`}
                              onClick={() => {
                                if (planType === "professional") {
                                  setManagedBookClauseCustom(
                                    !managedBookClauseCustom
                                  );
                                }
                              }}
                            >
                              Custom
                            </div>
                            <div
                              className={`text-sm ${
                                planType !== "professional"
                                  ? "text-gray-400"
                                  : "text-gray-600"
                              }`}
                            >
                              Add your own custom legal clause or disclaimer
                            </div>
                          </div>
                        }
                        sx={{
                          alignItems: "flex-start",
                          mb: 3,
                          "& .MuiFormControlLabel-label": {
                            fontFamily: "'Rubik', sans-serif",
                          },
                        }}
                      />

                      {/* Custom Clause Textarea - shown when Custom is checked */}
                      {managedBookClauseCustom && (
                        <div className="ml-8 mt-2 mb-3">
                          <TextField
                            fullWidth
                            multiline
                            rows={4}
                            value={managedBookCustomClauseText}
                            onChange={(e) =>
                              setManagedBookCustomClauseText(e.target.value)
                            }
                            variant="outlined"
                            placeholder="Enter your custom legal clause or disclaimer..."
                            disabled={planType !== "professional"}
                            sx={{
                              "& .MuiOutlinedInput-root": {
                                fontFamily: "'Rubik', sans-serif",
                                fontSize: "14px",
                              },
                            }}
                          />
                        </div>
                      )}
                    </FormGroup>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4 pt-6">
                    <Button
                      onClick={handleDeleteBook}
                      variant="contained"
                      startIcon={<DeleteForeverOutlinedIcon />}
                      sx={{
                        flex: 1,
                        textTransform: "none",
                        fontFamily: "'Rubik', sans-serif",
                        py: 1.5,
                        backgroundColor: "white",
                        color: "rgb(254, 226, 226)",
                        border: "1px solid rgb(254, 226, 226)",
                        boxShadow: "none",
                        "&:hover": {
                          backgroundColor: "rgb(248, 113, 113)",
                          color: "white",
                          borderColor: "rgb(239, 68, 68)",
                          boxShadow: "none",
                        },
                      }}
                    >
                      Delete Permanently
                    </Button>
                    <div className="relative flex-1">
                      <Button
                        onClick={
                          planType === "professional"
                            ? handleExportBook
                            : undefined
                        }
                        disabled={planType !== "professional"}
                        variant="outlined"
                        startIcon={<SimCardDownloadOutlinedIcon />}
                        sx={{
                          width: "100%",
                          textTransform: "none",
                          fontFamily: "'Rubik', sans-serif",
                          py: 1.5,
                          borderColor:
                            planType === "professional"
                              ? "rgb(156, 163, 175)"
                              : "rgb(209, 213, 219)",
                          color:
                            planType === "professional"
                              ? "rgb(107, 114, 128)"
                              : "rgb(156, 163, 175)",
                          "&:hover":
                            planType === "professional"
                              ? {
                                  borderColor: "rgb(107, 114, 128)",
                                  backgroundColor: "rgba(107, 114, 128, 0.1)",
                                }
                              : {},
                          "&.Mui-disabled": {
                            borderColor: "rgb(209, 213, 219)",
                            color: "rgb(156, 163, 175)",
                          },
                        }}
                      >
                        Export/Publish Book
                      </Button>
                      {planType !== "professional" && (
                        <div
                          className="absolute right-1"
                          style={{ top: "-12px" }}
                        >
                          <ProfessionalFeatureChip
                            size="small"
                            onClick={handleShowPricing}
                          />
                        </div>
                      )}
                    </div>
                    <Button
                      onClick={handleSaveBook}
                      variant="contained"
                      disabled={
                        !managedBookTitle.trim() || !managedBookAuthor.trim()
                      }
                      sx={{
                        minWidth: "120px",
                        backgroundColor: "rgb(19, 135, 194)",
                        textTransform: "none",
                        fontFamily: "'Rubik', sans-serif",
                        py: 1.5,
                        boxShadow: "none",
                        "&:hover": {
                          backgroundColor: "rgb(15, 108, 155)",
                          boxShadow: "none",
                        },
                        "&:disabled": {
                          boxShadow: "none",
                        },
                      }}
                    >
                      Save
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </main>

          {/* Footer - 100px tall */}
          <TwainFooter />

          {/* Export Modal */}
          <Modal
            open={showExportModal}
            onClose={handleCloseExportModal}
            aria-labelledby="export-modal-title"
          >
            <Box
              sx={{
                position: "absolute",
                top: { xs: 0, sm: "50%" },
                left: { xs: 0, sm: "50%" },
                transform: { xs: "none", sm: "translate(-50%, -50%)" },
                width: { xs: "100vw", sm: 600 },
                maxWidth: { xs: "100vw", sm: "90vw" },
                height: { xs: "100vh", sm: "auto" },
                maxHeight: { xs: "100vh", sm: "90vh" },
                bgcolor: "background.paper",
                borderRadius: { xs: 0, sm: 3 },
                overflow: "hidden",
                boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                display: { xs: "flex", sm: "block" },
                flexDirection: { xs: "column", sm: "row" },
              }}
            >
              {/* Header */}
              <Box
                sx={{
                  backgroundColor: "rgb(38, 52, 63)",
                  color: "white",
                  p: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Typography
                  id="export-modal-title"
                  variant="h6"
                  component="h2"
                  sx={{
                    fontFamily: "'Rubik', sans-serif",
                    fontWeight: 600,
                    margin: 0,
                  }}
                >
                  Export Book
                </Typography>
                <IconButton
                  onClick={handleCloseExportModal}
                  sx={{
                    color: "white",
                    "&:hover": {
                      backgroundColor: "rgba(255, 255, 255, 0.1)",
                    },
                  }}
                >
                  <CloseIcon />
                </IconButton>
              </Box>

              {/* Content */}
              <Box
                sx={{
                  p: { xs: 3, sm: 4 },
                  flex: { xs: 1, sm: "none" },
                  overflowY: "auto",
                }}
              >
                {/* Book Title Section */}
                <Box sx={{ textAlign: "center", mb: 4 }}>
                  <Typography
                    variant="h5"
                    sx={{
                      fontFamily: "'Rubik', sans-serif",
                      fontWeight: 600,
                      color: "rgb(31, 41, 55)",
                      mb: 1,
                    }}
                  >
                    {selectedBook?.title}
                  </Typography>
                  {selectedBook?.subtitle && (
                    <Typography
                      variant="h6"
                      sx={{
                        fontFamily: "'Rubik', sans-serif",
                        fontWeight: 400,
                        color: "rgb(107, 114, 128)",
                        mb: 1,
                      }}
                    >
                      {selectedBook.subtitle}
                    </Typography>
                  )}
                  {selectedBook?.isSeries && selectedBook?.seriesName && (
                    <Typography
                      variant="body1"
                      sx={{
                        fontFamily: "'Rubik', sans-serif",
                        color: "rgb(107, 114, 128)",
                      }}
                    >
                      {selectedBook.seriesName} - Book{" "}
                      {selectedBook.seriesNumber}
                    </Typography>
                  )}
                </Box>

                {/* Export Format Options */}
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                    gap: 3,
                    mb: 4,
                  }}
                >
                  {/* Word Export */}
                  <Box
                    sx={{
                      border: "2px solid rgb(229, 231, 235)",
                      borderRadius: 2,
                      p: 3,
                      textAlign: "center",
                      cursor:
                        planType === "professional" ? "pointer" : "not-allowed",
                      opacity: planType === "professional" ? 1 : 0.5,
                      "&:hover": {
                        borderColor:
                          planType === "professional"
                            ? "rgb(19, 135, 194)"
                            : "rgb(229, 231, 235)",
                        backgroundColor:
                          planType === "professional"
                            ? "rgba(19, 135, 194, 0.02)"
                            : "transparent",
                      },
                      transition: "all 0.2s ease-in-out",
                    }}
                    onClick={() => {
                      if (planType === "professional") {
                        handleExportToWord();
                      }
                    }}
                  >
                    <FileCopyOutlinedIcon
                      sx={{
                        fontSize: 48,
                        color:
                          planType === "professional"
                            ? "rgb(37, 99, 235)"
                            : "rgb(156, 163, 175)",
                        mb: 2,
                      }}
                    />
                    <Typography
                      variant="body1"
                      sx={{
                        fontFamily: "'Rubik', sans-serif",
                        fontWeight: 500,
                        color:
                          planType === "professional"
                            ? "rgb(31, 41, 55)"
                            : "rgb(156, 163, 175)",
                      }}
                    >
                      Format as Word®
                    </Typography>
                    {planType !== "professional" && (
                      <Typography
                        variant="caption"
                        sx={{
                          fontFamily: "'Rubik', sans-serif",
                          color: "rgb(156, 163, 175)",
                          display: "block",
                          mt: 1,
                        }}
                      >
                        (Professional)
                      </Typography>
                    )}
                  </Box>

                  {/* ePub Export */}
                  <Box
                    sx={{
                      border: "2px solid rgb(229, 231, 235)",
                      borderRadius: 2,
                      p: 3,
                      textAlign: "center",
                      cursor:
                        planType === "professional" ? "pointer" : "not-allowed",
                      opacity: planType === "professional" ? 1 : 0.5,
                      "&:hover": {
                        borderColor:
                          planType === "professional"
                            ? "rgb(19, 135, 194)"
                            : "rgb(229, 231, 235)",
                        backgroundColor:
                          planType === "professional"
                            ? "rgba(19, 135, 194, 0.02)"
                            : "transparent",
                      },
                      transition: "all 0.2s ease-in-out",
                    }}
                    onClick={() => {
                      if (planType === "professional") {
                        handleExportToEpub();
                      }
                    }}
                  >
                    <TabletAndroidOutlinedIcon
                      sx={{
                        fontSize: 48,
                        color:
                          planType === "professional"
                            ? "rgb(34, 197, 94)"
                            : "rgb(156, 163, 175)",
                        mb: 2,
                      }}
                    />
                    <Typography
                      variant="body1"
                      sx={{
                        fontFamily: "'Rubik', sans-serif",
                        fontWeight: 500,
                        color:
                          planType === "professional"
                            ? "rgb(31, 41, 55)"
                            : "rgb(156, 163, 175)",
                      }}
                    >
                      Format as ePub
                    </Typography>
                    {planType !== "professional" && (
                      <Typography
                        variant="caption"
                        sx={{
                          fontFamily: "'Rubik', sans-serif",
                          color: "rgb(156, 163, 175)",
                          display: "block",
                          mt: 1,
                        }}
                      >
                        (Professional)
                      </Typography>
                    )}
                  </Box>
                </Box>

                {/* Amazon Kindle Note */}
                <Box sx={{ textAlign: "center" }}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontFamily: "'Rubik', sans-serif",
                      color: "rgb(107, 114, 128)",
                      fontStyle: "italic",
                    }}
                  >
                    ***Amazon Kindle Direct Publishing coming soon
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Modal>

          {/* Delete Confirmation Modal */}
          <TwainDeleteConfirmationModal
            open={showDeleteModal}
            onClose={handleCloseDeleteModal}
            onConfirm={handleConfirmDelete}
            itemToDelete={itemToDelete}
          />

          {/* Pricing Modal - Available for manage book view */}
          <TwainStoryPricingModal
            open={showPricing}
            onClose={handleClosePricing}
            onUpgrade={handleUpgradePlan}
          />
        </div>
      );
    }

    return (
      <div className="min-h-screen flex flex-col">
        {/* Header - 300px tall */}
        <header
          className="h-[300px] flex flex-col justify-center items-center text-white relative"
          style={{
            backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.3)), url(/images/twain5.png)`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        >
          {/* Profile Menu - Top Right */}
          <TwainProfileMenu
            session={session}
            planType={planType}
            onAccountSettings={handleAccountSettings}
            onAbout={handleAbout}
            onHelp={handleHelp}
            onFeedback={handleFeedback}
            onLogout={handleLogout}
            additionalClasses="z-10"
          />

          <div style={{ position: "relative", display: "inline-block" }}>
            <Image
              src="/images/twain-logo.png"
              alt="Twain Logo"
              width={120}
              height={120}
              style={{
                filter: "invert(1) brightness(100%)",
                marginBottom: "16px",
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: "0",
                right: "-12px",
                backgroundColor: "#ff4757",
                color: "white",
                fontSize: "14px",
                fontWeight: "bold",
                padding: "4px 8px",
                borderRadius: "6px",
                fontFamily: "'Rubik', sans-serif",
                border: "1px solid white",
                zIndex: 20,
              }}
            >
              BETA
            </div>
          </div>
          <Typography
            variant="h4"
            sx={{
              fontFamily: "'Rubik', sans-serif",
              fontWeight: 600,
              marginBottom: 1,
              position: "relative",
              zIndex: 10,
            }}
          >
            <span className="block sm:hidden">Welcome Back</span>
            <span className="hidden sm:block">
              Welcome Back, {session?.user?.name?.split(" ")[0] || "Writer"}
            </span>
          </Typography>
          <Typography
            variant="body2"
            sx={{
              fontFamily: "'Rubik', sans-serif",
              fontWeight: 600,
              fontSize: "14px",
              textAlign: "center",
              maxWidth: "600px",
              px: { xs: 3, sm: 0 },
              position: "relative",
              zIndex: 10,
            }}
          >
            This is your bookshelf of books and stories.
          </Typography>
        </header>

        {/* Main content area - flexible height */}
        <main className="flex-1 bg-gray-100 p-4 sm:p-8">
          <div className="w-[95%] sm:w-[90%] md:w-[80%] mx-auto">
            {/* Filter buttons - only show when data is loaded */}
            {isDataLoaded && (
              <div className="flex flex-col sm:flex-row items-center justify-center mb-6 gap-4 w-full">
                <ButtonGroup
                  variant="outlined"
                  aria-label="filter books and stories"
                  sx={{
                    width: { xs: "100%", sm: "auto" },
                    "& .MuiButton-root": {
                      fontFamily: "'Rubik', sans-serif",
                      textTransform: "none",
                      fontSize: { xs: "12px", sm: "14px" },
                      fontWeight: 500,
                      px: { xs: 2, sm: 3 },
                      py: 1,
                      borderColor: "rgb(209, 213, 219)",
                      color: "rgb(107, 114, 128)",
                      flex: { xs: 1, sm: "initial" },
                      whiteSpace: "nowrap",
                      minWidth: 0,
                      "&:hover": {
                        borderColor: "rgb(19, 135, 194)",
                        backgroundColor: "rgba(19, 135, 194, 0.04)",
                      },
                    },
                    "& .MuiButton-root.Mui-selected": {
                      backgroundColor: "rgb(19, 135, 194)",
                      color: "white",
                      borderColor: "rgb(19, 135, 194)",
                      "&:hover": {
                        backgroundColor: "rgb(15, 108, 155)",
                        borderColor: "rgb(15, 108, 155)",
                      },
                    },
                  }}
                >
                  <Button
                    onClick={() => handleFilterChange("all")}
                    className={filter === "all" ? "Mui-selected" : ""}
                  >
                    All ({books.length + quickStories.length})
                  </Button>
                  <Button
                    onClick={() => handleFilterChange("books")}
                    className={filter === "books" ? "Mui-selected" : ""}
                  >
                    Books ({books.length})
                  </Button>
                  <Button
                    onClick={() => handleFilterChange("stories")}
                    className={filter === "stories" ? "Mui-selected" : ""}
                  >
                    Stories ({quickStories.length})
                  </Button>
                </ButtonGroup>

                {/* Series filter dropdown - only show when books filter is selected and there are series */}
                {filter === "books" &&
                  getUniqueSeriesNames(books).length > 0 && (
                    <FormControl
                      sx={{
                        minWidth: { xs: "100%", sm: 200 },
                        width: { xs: "100%", sm: "auto" },
                        "& .MuiOutlinedInput-root": {
                          fontFamily: "'Rubik', sans-serif",
                          fontSize: "14px",
                        },
                        "& .MuiInputLabel-root": {
                          fontFamily: "'Rubik', sans-serif",
                          fontSize: "14px",
                        },
                      }}
                      size="small"
                    >
                      <InputLabel>Filter by Series</InputLabel>
                      <Select
                        value={seriesFilter}
                        label="Filter by Series"
                        onChange={(e) =>
                          handleSeriesFilterChange(e.target.value)
                        }
                      >
                        <MenuItem value="all">All Books & Series</MenuItem>
                        <MenuItem value="no-series">No Series</MenuItem>
                        {getUniqueSeriesNames(books).map((seriesName) => (
                          <MenuItem key={seriesName} value={seriesName}>
                            {seriesName}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
              </div>
            )}

            {/* Books flex container with custom spacing - only show when data is loaded */}
            {isDataLoaded && (
              <div
                style={{
                  display: "grid",
                  width: "100%",
                  rowGap: "1rem",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gridColumnGap: "0.75rem",
                  justifyItems: "center",
                  paddingBottom: "1rem",
                  WebkitTransition: "all .3s ease 0ms",
                  transition: "all .3s ease 0ms",
                }}
                className="sm:!flex sm:flex-wrap sm:justify-start sm:gap-0 sm:!w-full"
                onTouchStart={(e) => {
                  // Close active card overlay when tapping outside cards
                  if (e.target === e.currentTarget) {
                    setActiveCardId(null);
                  }
                }}
              >
                {/* Create/Import book card - first card - only show if there are existing books or stories */}
                {(books.length > 0 || quickStories.length > 0) &&
                  !(filter === "stories" && quickStories.length === 0) &&
                  !(filter === "books" && books.length === 0) && (
                    <div
                      className="hover:shadow-md transition-shadow cursor-pointer flex flex-col rounded-md w-full max-w-[176px] sm:w-[176px] sm:max-w-none relative"
                      style={{
                        aspectRatio: "176/268",
                        backgroundColor: "rgb(227, 230, 230)",
                      }}
                    >
                      <div className="flex-1 flex flex-col justify-center items-center p-2 space-y-2">
                        {/* Create Book Button */}
                        <div className="relative w-full">
                          <button
                            className={`w-full flex flex-col items-center space-y-1 p-2 rounded cursor-pointer ${
                              planType !== "professional" && books.length >= 3
                                ? "opacity-75"
                                : ""
                            }`}
                            onClick={
                              planType !== "professional" && books.length >= 3
                                ? handleShowPricing
                                : handleCreateBookClick
                            }
                            disabled={false}
                          >
                            <AddCircleOutlinedIcon
                              sx={{
                                fontSize: 64,
                                color:
                                  planType !== "professional" &&
                                  books.length >= 3
                                    ? "rgb(156, 163, 175)"
                                    : "rgb(100, 114, 127)",
                                transition: "transform 0.2s ease",
                                "&:hover": {
                                  transform:
                                    planType !== "professional" &&
                                    books.length >= 3
                                      ? "none"
                                      : "scale(1.1)",
                                },
                              }}
                            />
                            <span
                              className={`text-sm font-medium ${
                                planType !== "professional" && books.length >= 3
                                  ? "text-gray-400"
                                  : "text-gray-800"
                              }`}
                            >
                              Create book
                            </span>
                          </button>
                          {planType !== "professional" && books.length >= 3 && (
                            <div className="absolute top-1 right-8">
                              <ProfessionalFeatureChip
                                label="PRO"
                                size="small"
                                onClick={handleShowPricing}
                              />
                            </div>
                          )}
                        </div>

                        {/* Divider Line */}
                        <div className="w-full border-b border-gray-300 my-2"></div>

                        {/* Create Story Button */}
                        <div className="relative w-full">
                          <button
                            className={`w-full flex flex-col items-center space-y-1 p-2 rounded cursor-pointer ${
                              planType !== "professional" &&
                              quickStories.length >= 3
                                ? "opacity-50 cursor-not-allowed"
                                : ""
                            }`}
                            onClick={
                              planType !== "professional" &&
                              quickStories.length >= 3
                                ? undefined
                                : handleCreateStoryClick
                            }
                            disabled={
                              planType !== "professional" &&
                              quickStories.length >= 3
                            }
                          >
                            <AddCircleOutlinedIcon
                              sx={{
                                fontSize: 64,
                                color:
                                  planType !== "professional" &&
                                  quickStories.length >= 3
                                    ? "rgb(156, 163, 175)"
                                    : "rgb(34, 197, 94)",
                                transition: "transform 0.2s ease",
                                "&:hover": {
                                  transform:
                                    planType !== "professional" &&
                                    quickStories.length >= 3
                                      ? "none"
                                      : "scale(1.1)",
                                },
                              }}
                            />
                            <span
                              className={`text-sm font-medium ${
                                planType !== "professional" &&
                                quickStories.length >= 3
                                  ? "text-gray-400"
                                  : "text-gray-800"
                              }`}
                            >
                              Create story
                            </span>
                          </button>
                          {planType !== "professional" &&
                            quickStories.length >= 3 && (
                              <div className="absolute top-1 right-8">
                                <ProfessionalFeatureChip
                                  label="PRO"
                                  size="small"
                                />
                              </div>
                            )}
                        </div>
                      </div>
                    </div>
                  )}

                {/* Book cards */}
                {(filter === "all" || filter === "books") &&
                  filteredBooks.map((bookData: Book) => {
                    const cardId = `book-${bookData.id}`;
                    const isActive = activeCardId === cardId;

                    return (
                      <div
                        key={bookData.id}
                        className="bg-white hover:shadow-md cursor-pointer flex flex-col rounded-r-md relative group w-full max-w-[176px] sm:w-[176px] sm:max-w-none"
                        style={{
                          aspectRatio: "176/268",
                          borderLeft: "8px solid rgb(100, 114, 127)",
                          transition: "transform 0.2s ease",
                          transform: isActive ? "scale(1.05)" : "scale(1)",
                        }}
                        onMouseEnter={(e) => {
                          // Only apply hover effects on non-touch devices
                          if (!("ontouchstart" in window)) {
                            e.currentTarget.style.transform = "scale(1.05)";
                            setActiveCardId(cardId);
                          }
                        }}
                        onMouseLeave={(e) => {
                          // Only apply hover effects on non-touch devices
                          if (!("ontouchstart" in window)) {
                            e.currentTarget.style.transform = "scale(1)";
                            setActiveCardId(null);
                          }
                        }}
                        onTouchStart={() => {
                          // Touch-specific interaction
                          setActiveCardId(cardId);
                        }}
                        onTouchEnd={() => {
                          // Reset after a delay to allow for tap interactions
                          setTimeout(() => setActiveCardId(null), 2000);
                        }}
                      >
                        {/* Hover overlay with icons - covers entire card */}
                        <div
                          className={`absolute inset-0 bg-black bg-opacity-20 flex flex-col transition-opacity duration-200 rounded-r-md z-10 ${
                            isActive
                              ? "opacity-60"
                              : "opacity-0 group-hover:opacity-50"
                          }`}
                        >
                          {bookData.coverImage ? (
                            <>
                              {/* Upper left: Book title, series, and BOOK badge */}
                              <div className="p-3 flex-shrink-0">
                                <Typography
                                  variant="body1"
                                  sx={{
                                    fontFamily: "'Alike', serif",
                                    fontSize: "16px",
                                    fontWeight: "bold",
                                    color: "white",
                                    textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
                                    mb: 0.5,
                                  }}
                                >
                                  {bookData.title}
                                </Typography>
                                {bookData.isSeries && bookData.seriesName && (
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      fontFamily: "'Rubik', sans-serif",
                                      fontSize: "11px",
                                      fontWeight: 500,
                                      color: "rgba(255,255,255,0.95)",
                                      textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
                                      mb: 0.5,
                                    }}
                                  >
                                    {bookData.seriesName} #
                                    {bookData.seriesNumber}
                                  </Typography>
                                )}
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontFamily: "'Rubik', sans-serif",
                                    fontSize: "12px",
                                    fontWeight: 500,
                                    color: "white",
                                    textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
                                  }}
                                >
                                  BOOK
                                </Typography>
                              </div>

                              {/* Center: Action icons */}
                              <div
                                className="flex-1 flex items-center justify-center"
                                style={{ marginTop: "-25px" }}
                              >
                                <div className="flex items-center justify-center space-x-4">
                                  <SettingsOutlinedIcon
                                    onClick={() => handleManageBook(bookData)}
                                    sx={{
                                      fontSize: 32,
                                      color: "white",
                                      cursor: "pointer",
                                      transition: "transform 0.2s ease",
                                      "&:hover": {
                                        transform: "scale(1.1)",
                                      },
                                    }}
                                  />
                                  <DrawOutlinedIcon
                                    onClick={() => handleWriteBook(bookData)}
                                    sx={{
                                      fontSize: 32,
                                      color: "white",
                                      cursor: "pointer",
                                      transition: "transform 0.2s ease",
                                      "&:hover": {
                                        transform: "scale(1.1)",
                                      },
                                    }}
                                  />
                                </div>
                              </div>

                              {/* Bottom: Word count and started date */}
                              <div className="text-center px-3 pb-3">
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontFamily: "'Rubik', sans-serif",
                                    fontSize: "14px",
                                    fontWeight: 400,
                                    color: "white",
                                    textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
                                    mb: 0.5,
                                  }}
                                >
                                  {bookData.wordCount} words
                                </Typography>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontFamily: "'Rubik', sans-serif",
                                    fontSize: "12px",
                                    fontWeight: 300,
                                    color: "rgba(255,255,255,0.9)",
                                    textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
                                  }}
                                >
                                  Started on{" "}
                                  {new Date(
                                    bookData.createdAt
                                  ).toLocaleDateString()}
                                </Typography>
                              </div>
                            </>
                          ) : (
                            // No cover image - only show centered icons
                            <div
                              className="flex items-center justify-center h-full"
                              style={{ paddingTop: "5px" }}
                            >
                              <div className="flex items-center justify-center space-x-4">
                                <SettingsOutlinedIcon
                                  onClick={() => handleManageBook(bookData)}
                                  sx={{
                                    fontSize: 32,
                                    color: "white",
                                    cursor: "pointer",
                                    transition: "transform 0.2s ease",
                                    "&:hover": {
                                      transform: "scale(1.1)",
                                    },
                                  }}
                                />
                                <DrawOutlinedIcon
                                  onClick={() => handleWriteBook(bookData)}
                                  sx={{
                                    fontSize: 32,
                                    color: "white",
                                    cursor: "pointer",
                                    transition: "transform 0.2s ease",
                                    "&:hover": {
                                      transform: "scale(1.1)",
                                    },
                                  }}
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        {bookData.coverImage ? (
                          // Cover image fills entire card - no text overlay
                          <div className="w-full flex-1 relative z-0 overflow-hidden">
                            <Image
                              src={bookData.coverImage}
                              alt={`${bookData.title} cover`}
                              fill
                              style={{ objectFit: "cover" }}
                              className="rounded-r-sm"
                            />
                          </div>
                        ) : (
                          // No cover image - traditional layout
                          <>
                            <div className="w-full h-48 bg-white flex items-start justify-start p-2 relative overflow-hidden">
                              <div className="flex flex-col">
                                <Typography
                                  variant="body1"
                                  sx={{
                                    fontFamily: "'Alike', serif",
                                    fontSize: "18px",
                                    fontWeight: "bold",
                                    color: "text.secondary",
                                  }}
                                >
                                  {bookData.title}
                                </Typography>
                                {bookData.isSeries && bookData.seriesName && (
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      fontFamily: "'Rubik', sans-serif",
                                      fontSize: "11px",
                                      fontWeight: 500,
                                      color: "rgb(75, 85, 99)",
                                      mt: 0.25,
                                    }}
                                  >
                                    {bookData.seriesName} #
                                    {bookData.seriesNumber}
                                  </Typography>
                                )}
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontFamily: "'Rubik', sans-serif",
                                    fontSize: "12px",
                                    fontWeight: 500,
                                    color: "rgb(100, 114, 127)", // Blue-gray text to match book border
                                    mt: 0.5,
                                  }}
                                >
                                  BOOK
                                </Typography>
                              </div>
                            </div>
                            <div className="px-3 pb-3 flex items-end justify-center flex-1">
                              <div className="text-center">
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontFamily: "'Rubik', sans-serif",
                                    fontSize: "14px",
                                    fontWeight: 400,
                                    textAlign: "center",
                                  }}
                                >
                                  {bookData.wordCount} words
                                </Typography>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontFamily: "'Rubik', sans-serif",
                                    fontSize: "12px",
                                    fontWeight: 300,
                                    textAlign: "center",
                                    color: "text.secondary",
                                    mt: 0.5,
                                  }}
                                >
                                  Started on{" "}
                                  {new Date(
                                    bookData.createdAt
                                  ).toLocaleDateString()}
                                </Typography>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}

                {/* Empty state message */}
                {filter === "all" &&
                  books.length === 0 &&
                  quickStories.length === 0 &&
                  isDataLoaded && (
                    <div
                      className="col-span-2 sm:col-span-full flex items-center justify-center w-full"
                      style={{ minHeight: "120px" }}
                    >
                      <div className="p-6 w-full text-center">
                        <Typography
                          variant="body1"
                          sx={{
                            fontFamily: "'Alike', serif",
                            fontSize: "24px",
                            fontWeight: 500,
                            color: "rgb(75, 85, 99)",
                            lineHeight: 1.5,
                            mb: 2,
                          }}
                        >
                          You haven&apos;t written anything,
                          <br /> why not get going my scribe and create a book
                          or story.
                        </Typography>
                        <div className="flex items-center justify-center space-x-4 pt-6">
                          <button
                            onClick={
                              planType !== "professional" && books.length >= 3
                                ? handleShowPricing
                                : handleCreateBookClick
                            }
                            className={`flex items-center space-x-2 text-white px-4 py-2 rounded-md transition-colors duration-200 cursor-pointer ${
                              planType !== "professional" && books.length >= 3
                                ? "opacity-75"
                                : ""
                            }`}
                            style={{ backgroundColor: "rgb(100, 114, 127)" }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor =
                                "rgb(80, 94, 107)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor =
                                "rgb(100, 114, 127)";
                            }}
                          >
                            <AddCircleOutlinedIcon sx={{ fontSize: 18 }} />
                            <span className="font-medium">Create Book</span>
                          </button>
                          {/* <span className="text-blue-400">|</span> */}
                          <button
                            onClick={handleCreateStoryClick}
                            className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors duration-200 cursor-pointer"
                          >
                            <AddCircleOutlinedIcon sx={{ fontSize: 18 }} />
                            <span className="font-medium">Create Story</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                {/* Empty state message */}
                {filter === "books" && books.length === 0 && isDataLoaded && (
                  <div
                    className="col-span-2 sm:col-span-full flex items-center justify-center w-full"
                    style={{ minHeight: "120px" }}
                  >
                    <div className="p-6 w-full text-center">
                      <Typography
                        variant="body1"
                        sx={{
                          fontFamily: "'Alike', serif",
                          fontSize: "24px",
                          fontWeight: 500,
                          color: "rgb(75, 85, 99)",
                          lineHeight: 1.5,
                          mb: 2,
                        }}
                      >
                        You haven&apos;t written anything,
                        <br /> why not get going my scribe and create a book.
                      </Typography>
                      <div className="flex items-center justify-center space-x-4 pt-6">
                        <button
                          onClick={handleCreateBookClick}
                          className="flex items-center space-x-2 text-white px-4 py-2 rounded-md transition-colors duration-200 cursor-pointer"
                          style={{ backgroundColor: "rgb(100, 114, 127)" }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor =
                              "rgb(80, 94, 107)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor =
                              "rgb(100, 114, 127)";
                          }}
                        >
                          <AddCircleOutlinedIcon sx={{ fontSize: 18 }} />
                          <span className="font-medium">Create Book</span>
                        </button>
                        {/* <span className="text-blue-400">|</span> */}
                        <button
                          onClick={handleCreateStoryClick}
                          className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors duration-200 cursor-pointer"
                        >
                          <AddCircleOutlinedIcon sx={{ fontSize: 18 }} />
                          <span className="font-medium">Create Story</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Story cards */}

                {/* Story cards */}
                {(filter === "all" || filter === "stories") &&
                  quickStories.map((storyData: Book) => {
                    const cardId = `story-${storyData.id}`;
                    const isActive = activeCardId === cardId;

                    return (
                      <div
                        key={`story-${storyData.id}`}
                        className="bg-white hover:shadow-md cursor-pointer flex flex-col rounded-r-md relative group w-full max-w-[176px] sm:w-[176px] sm:max-w-none"
                        style={{
                          aspectRatio: "176/268",
                          borderLeft: "8px solid rgb(34, 197, 94)", // Green border
                          transition: "transform 0.2s ease",
                          transform: isActive ? "scale(1.05)" : "scale(1)",
                        }}
                        onMouseEnter={(e) => {
                          // Only apply hover effects on non-touch devices
                          if (!("ontouchstart" in window)) {
                            e.currentTarget.style.transform = "scale(1.05)";
                            setActiveCardId(cardId);
                          }
                        }}
                        onMouseLeave={(e) => {
                          // Only apply hover effects on non-touch devices
                          if (!("ontouchstart" in window)) {
                            e.currentTarget.style.transform = "scale(1)";
                            setActiveCardId(null);
                          }
                        }}
                        onTouchStart={() => {
                          // Touch-specific interaction
                          setActiveCardId(cardId);
                        }}
                        onTouchEnd={() => {
                          // Reset after a delay to allow for tap interactions
                          setTimeout(() => setActiveCardId(null), 2000);
                        }}
                      >
                        {/* Hover overlay with icons - covers entire card */}
                        <div
                          className={`absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center transition-opacity duration-200 rounded-r-md z-10 ${
                            isActive
                              ? "opacity-60"
                              : "opacity-0 group-hover:opacity-50"
                          }`}
                          style={{ paddingTop: "5px" }}
                        >
                          {/* Only show centered icons - no additional text needed */}
                          <div className="flex items-center justify-center space-x-4">
                            <InfoOutlinedIcon
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStoryOptions(storyData);
                              }}
                              sx={{
                                fontSize: 32,
                                color: "white",
                                cursor: "pointer",
                                transition: "transform 0.2s ease",
                                "&:hover": {
                                  transform: "scale(1.1)",
                                  color: "#60a5fa",
                                },
                              }}
                            />
                            <DrawOutlinedIcon
                              onClick={() => {
                                setSelectedBook(storyData);
                                setIsQuickStoryMode(true);
                                // Store book data for the story writer page
                                localStorage.setItem(
                                  "currentSelectedBook",
                                  JSON.stringify(storyData)
                                );
                                localStorage.setItem(
                                  "isQuickStoryMode",
                                  "true"
                                );
                                router.push("/storywriter");
                              }}
                              sx={{
                                fontSize: 32,
                                color: "white",
                                cursor: "pointer",
                                transition: "transform 0.2s ease",
                                "&:hover": {
                                  transform: "scale(1.1)",
                                },
                              }}
                            />
                          </div>
                        </div>

                        {/* No cover image - traditional layout with green accent */}
                        <div className="w-full h-48 bg-white flex items-start justify-start p-2 relative overflow-hidden">
                          <div className="flex flex-col">
                            <Typography
                              variant="body1"
                              sx={{
                                fontFamily: "'Alike', serif",
                                fontSize: "18px",
                                fontWeight: "bold",
                                color: "text.secondary",
                              }}
                            >
                              {storyData.title}
                            </Typography>
                            {storyData.isSeries && storyData.seriesName && (
                              <Typography
                                variant="body2"
                                sx={{
                                  fontFamily: "'Rubik', sans-serif",
                                  fontSize: "11px",
                                  fontWeight: 500,
                                  color: "rgb(75, 85, 99)",
                                  mt: 0.25,
                                }}
                              >
                                {storyData.seriesName} #{storyData.seriesNumber}
                              </Typography>
                            )}
                            <Typography
                              variant="body2"
                              sx={{
                                fontFamily: "'Rubik', sans-serif",
                                fontSize: "12px",
                                fontWeight: 500,
                                color: "rgb(34, 197, 94)", // Green text
                                mt: 0.5,
                              }}
                            >
                              STORY
                            </Typography>
                          </div>
                        </div>
                        <div className="px-3 pb-3 flex items-end justify-center flex-1">
                          <div className="text-center">
                            <Typography
                              variant="body2"
                              sx={{
                                fontFamily: "'Rubik', sans-serif",
                                fontSize: "14px",
                                fontWeight: 400,
                                textAlign: "center",
                              }}
                            >
                              {storyData.wordCount} words
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{
                                fontFamily: "'Rubik', sans-serif",
                                fontSize: "12px",
                                fontWeight: 300,
                                textAlign: "center",
                                color: "text.secondary",
                                mt: 0.5,
                              }}
                            >
                              Started on{" "}
                              {new Date(
                                storyData.createdAt
                              ).toLocaleDateString()}
                            </Typography>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                {/* Empty state for stories */}
                {filter === "stories" &&
                  quickStories.length === 0 &&
                  isDataLoaded && (
                    <div
                      className="col-span-2 sm:col-span-full flex items-center justify-center w-full"
                      style={{ minHeight: "120px" }}
                    >
                      <div className="p-6 w-full text-center">
                        <Typography
                          variant="body1"
                          sx={{
                            fontFamily: "'Alike', serif",
                            fontSize: "24px",
                            fontWeight: 500,
                            color: "rgb(75, 85, 99)",
                            lineHeight: 1.5,
                            mb: 2,
                          }}
                        >
                          You haven&apos;t written anything,
                          <br /> why not get going my scribe and create a story.
                        </Typography>
                        <div className="flex items-center justify-center space-x-4 pt-6">
                          <button
                            onClick={
                              planType !== "professional" && books.length >= 3
                                ? handleShowPricing
                                : handleCreateBookClick
                            }
                            className={`flex items-center space-x-2 text-white px-4 py-2 rounded-md transition-colors duration-200 cursor-pointer ${
                              planType !== "professional" && books.length >= 3
                                ? "opacity-75"
                                : ""
                            }`}
                            style={{ backgroundColor: "rgb(100, 114, 127)" }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor =
                                "rgb(80, 94, 107)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor =
                                "rgb(100, 114, 127)";
                            }}
                          >
                            <AddCircleOutlinedIcon sx={{ fontSize: 18 }} />
                            <span className="font-medium">Create Book</span>
                          </button>
                          {/* <span className="text-blue-400">|</span> */}
                          <button
                            onClick={handleCreateStoryClick}
                            className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors duration-200 cursor-pointer"
                          >
                            <AddCircleOutlinedIcon sx={{ fontSize: 18 }} />
                            <span className="font-medium">Create Story</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
              </div>
            )}

            {/* Limit Warning Message - Combined single box with light blue styling */}
            {isDataLoaded &&
              planType !== "professional" &&
              ((books.length >= 3 &&
                (filter === "all" || filter === "books")) ||
                (quickStories.length >= 3 &&
                  (filter === "all" || filter === "stories"))) && (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg
                          className="h-5 w-5 text-blue-400"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <div className="text-sm text-blue-800">
                          {books.length >= 3 &&
                            (filter === "all" || filter === "books") && (
                              <p>
                                You&apos;ve reached your limit of{" "}
                                <strong>3 books</strong>.
                                <span className="ml-1">
                                  Upgrade to Professional to create unlimited
                                  books.
                                </span>
                              </p>
                            )}
                          {books.length >= 3 &&
                            quickStories.length >= 3 &&
                            filter === "all" && (
                              <div className="my-2 border-t border-blue-200"></div>
                            )}
                          {quickStories.length >= 3 &&
                            (filter === "all" || filter === "stories") && (
                              <p>
                                You&apos;ve reached your limit of{" "}
                                <strong>3 story collections</strong>.
                                <span className="ml-1">
                                  Upgrade to Professional to create unlimited
                                  story collections.
                                </span>
                              </p>
                            )}
                        </div>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <ProfessionalFeatureChip
                        label="Upgrade to Professional"
                        onClick={() => setShowPricing(true)}
                      />
                    </div>
                  </div>
                </div>
              )}
          </div>
        </main>

        {/* Plan Status Notice */}
        <div
          className="hidden w-full text-center py-4 px-8 text-gray-200 text-xs"
          style={{ backgroundColor: "rgb(38, 52, 63)" }}
        >
          <span className="text-green-200">
            You are subscribed to the{" "}
            {planType.charAt(0).toUpperCase() + planType.slice(1)} plan.
          </span>
          <br />
          {planType === "freelance" &&
            "Your content is being stored in local storage and will not be accessible across devices."}
          {!isActivePlan && planType !== "freelance" && "Your plan has expired"}
          {(planType === "freelance" || !isActivePlan) && (
            <>
              <span
                onClick={handleShowPricing}
                className="underline cursor-pointer hover:text-white transition-colors duration-200"
              >
                {planType === "freelance"
                  ? "Upgrade to a paid plan"
                  : "renew your subscription"}
              </span>{" "}
              to store your content in the cloud and access it everywhere.
            </>
          )}
          {isActivePlan && planType === "professional" && (
            <span className="text-green-200">
              Enjoy unlimited cloud storage, ideas, stories, chapters and other
              premium features!
            </span>
          )}
        </div>

        {/* Footer - 100px tall */}
        <TwainFooter />

        {/* Create Book Modal */}
        <Modal
          open={createBookModalOpen}
          onClose={handleCreateBookModalClose}
          aria-labelledby="create-book-modal-title"
        >
          <Box
            sx={{
              position: "absolute",
              top: { xs: 0, sm: "50%" },
              left: { xs: 0, sm: "50%" },
              transform: { xs: "none", sm: "translate(-50%, -50%)" },
              width: { xs: "100%", sm: 450 },
              height: { xs: "100vh", sm: "auto" },
              bgcolor: "background.paper",
              borderRadius: { xs: 0, sm: 3 },
              overflow: "hidden",
              boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
              display: { xs: "flex", sm: "block" },
              flexDirection: { xs: "column", sm: "row" },
            }}
          >
            {/* Header with same background as page header */}
            <Box
              sx={{
                backgroundColor: "rgb(38, 52, 63)",
                color: "white",
                p: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Typography
                id="create-book-modal-title"
                variant="h6"
                component="h2"
                sx={{
                  fontFamily: "'Rubik', sans-serif",
                  fontWeight: 600,
                  margin: 0,
                }}
              >
                Create New Book
              </Typography>
              <IconButton
                onClick={handleCreateBookModalClose}
                sx={{
                  color: "white",
                  "&:hover": {
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                  },
                }}
              >
                <CloseIcon />
              </IconButton>
            </Box>

            {/* Modal content */}
            <Box
              sx={{
                p: { xs: 3, sm: 4 },
                flex: { xs: 1, sm: "none" },
                display: { xs: "flex", sm: "block" },
                flexDirection: { xs: "column", sm: "row" },
                justifyContent: { xs: "center", sm: "flex-start" },
              }}
            >
              <TextField
                fullWidth
                label="Book Title"
                value={bookTitle}
                onChange={(e) => setBookTitle(e.target.value)}
                variant="outlined"
                sx={{ mb: 4 }}
                autoFocus
              />
              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  justifyContent: "space-between",
                }}
              >
                <Button
                  onClick={handleCreateBookModalClose}
                  variant="outlined"
                  sx={{
                    flex: 1,
                    boxShadow: "none",
                    "&:hover": {
                      boxShadow: "none",
                    },
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateBook}
                  variant="contained"
                  disabled={!bookTitle.trim()}
                  sx={{
                    flex: 1,
                    backgroundColor: "rgb(19, 135, 194)",
                    textTransform: "none",
                    fontFamily: "'Rubik', sans-serif",
                    py: 1.5,
                    boxShadow: "none",
                    "&:hover": {
                      backgroundColor: "rgb(15, 108, 155)",
                      boxShadow: "none",
                    },
                    "&:disabled": {
                      boxShadow: "none",
                    },
                  }}
                >
                  Create Book
                </Button>
              </Box>
            </Box>
          </Box>
        </Modal>

        {/* Create Story Modal */}
        <Modal
          open={createStoryModalOpen}
          onClose={handleCreateStoryModalClose}
          aria-labelledby="create-story-modal-title"
        >
          <Box
            sx={{
              position: "absolute",
              top: { xs: 0, sm: "50%" },
              left: { xs: 0, sm: "50%" },
              transform: { xs: "none", sm: "translate(-50%, -50%)" },
              width: { xs: "100%", sm: 450 },
              height: { xs: "100vh", sm: "auto" },
              bgcolor: "background.paper",
              borderRadius: { xs: 0, sm: 3 },
              overflow: "hidden",
              boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
              display: { xs: "flex", sm: "block" },
              flexDirection: { xs: "column", sm: "row" },
            }}
          >
            {/* Header with same background as page header */}
            <Box
              sx={{
                backgroundColor: "rgb(38, 52, 63)",
                color: "white",
                p: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Typography
                id="create-story-modal-title"
                variant="h6"
                component="h2"
                sx={{
                  fontFamily: "'Rubik', sans-serif",
                  fontWeight: 600,
                  margin: 0,
                }}
              >
                Create New Story
              </Typography>
              <IconButton
                onClick={handleCreateStoryModalClose}
                sx={{
                  color: "white",
                  "&:hover": {
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                  },
                }}
              >
                <CloseIcon />
              </IconButton>
            </Box>

            {/* Modal content */}
            <Box
              sx={{
                p: { xs: 3, sm: 4 },
                flex: { xs: 1, sm: "none" },
                display: { xs: "flex", sm: "block" },
                flexDirection: { xs: "column", sm: "row" },
                justifyContent: { xs: "center", sm: "flex-start" },
              }}
            >
              <TextField
                fullWidth
                label="Story Title"
                value={storyTitle}
                onChange={(e) => setStoryTitle(e.target.value)}
                variant="outlined"
                sx={{ mb: 4 }}
                autoFocus
              />
              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  justifyContent: "space-between",
                }}
              >
                <Button
                  onClick={handleCreateStoryModalClose}
                  variant="outlined"
                  sx={{
                    flex: 1,
                    boxShadow: "none",
                    "&:hover": {
                      boxShadow: "none",
                    },
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateStory}
                  variant="contained"
                  disabled={!storyTitle.trim()}
                  sx={{
                    flex: 1,
                    backgroundColor: "rgb(19, 135, 194)",
                    textTransform: "none",
                    fontFamily: "'Rubik', sans-serif",
                    py: 1.5,
                    boxShadow: "none",
                    "&:hover": {
                      backgroundColor: "rgb(15, 108, 155)",
                      boxShadow: "none",
                    },
                    "&:disabled": {
                      boxShadow: "none",
                    },
                  }}
                >
                  Create Story
                </Button>
              </Box>
            </Box>
          </Box>
        </Modal>

        {/* Story Options Modal */}
        <Modal
          open={showStoryOptionsModal}
          onClose={handleCloseStoryOptionsModal}
          aria-labelledby="story-options-modal-title"
        >
          <Box
            sx={{
              position: "absolute",
              top: { xs: 0, sm: "50%" },
              left: { xs: 0, sm: "50%" },
              transform: { xs: "none", sm: "translate(-50%, -50%)" },
              width: { xs: "100%", sm: 500 },
              height: { xs: "100vh", sm: "auto" },
              bgcolor: "background.paper",
              borderRadius: { xs: 0, sm: 3 },
              overflow: "hidden",
              boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
              display: { xs: "flex", sm: "block" },
              flexDirection: { xs: "column", sm: "row" },
            }}
          >
            {/* Header with same background as page header */}
            <Box
              sx={{
                backgroundColor: "rgb(38, 52, 63)",
                color: "white",
                p: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Typography
                id="story-options-modal-title"
                variant="h6"
                component="h2"
                sx={{
                  fontFamily: "'Rubik', sans-serif",
                  fontWeight: 600,
                  margin: 0,
                }}
              >
                Story Options
              </Typography>
              <IconButton
                onClick={handleCloseStoryOptionsModal}
                sx={{
                  color: "white",
                  "&:hover": {
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                  },
                }}
              >
                <CloseIcon />
              </IconButton>
            </Box>

            {/* Modal content */}
            <Box
              sx={{
                p: { xs: 3, sm: 4 },
                flex: { xs: 1, sm: "none" },
                display: { xs: "flex", sm: "block" },
                flexDirection: { xs: "column", sm: "row" },
                justifyContent: { xs: "center", sm: "flex-start" },
              }}
            >
              <TextField
                fullWidth
                label="Story Title"
                value={storyOptionsTitle}
                onChange={(e) => setStoryOptionsTitle(e.target.value)}
                variant="outlined"
                sx={{ mb: 3 }}
                autoFocus
              />

              <FormControl fullWidth sx={{ mb: 4 }}>
                <InputLabel>Move to Book (Optional)</InputLabel>
                <Select
                  value={storyOptionsMoveToBook}
                  label="Move to Book (Optional)"
                  onChange={(e) => setStoryOptionsMoveToBook(e.target.value)}
                >
                  <MenuItem value="">
                    <em>None - Keep as Story</em>
                  </MenuItem>
                  {books.map((book) => (
                    <MenuItem key={book.id} value={book.id.toString()}>
                      {book.title}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  justifyContent: "space-between",
                }}
              >
                <Button
                  onClick={handleDeleteStoryFromModal}
                  variant="outlined"
                  color="error"
                  sx={{
                    flex: 1,
                    boxShadow: "none",
                    "&:hover": {
                      boxShadow: "none",
                    },
                  }}
                >
                  Delete
                </Button>
                <Button
                  onClick={handleUpdateStoryOptions}
                  variant="contained"
                  disabled={!storyOptionsTitle.trim()}
                  sx={{
                    flex: 1,
                    backgroundColor: "rgb(19, 135, 194)",
                    textTransform: "none",
                    fontFamily: "'Rubik', sans-serif",
                    py: 1.5,
                    boxShadow: "none",
                    "&:hover": {
                      backgroundColor: "rgb(15, 108, 155)",
                      boxShadow: "none",
                    },
                    "&:disabled": {
                      boxShadow: "none",
                    },
                  }}
                >
                  Update
                </Button>
              </Box>
            </Box>
          </Box>
        </Modal>

        {/* Notification */}
        {notification && (
          <div
            style={{
              position: "fixed",
              top: "20px",
              right: "20px",
              backgroundColor: "rgb(34, 197, 94)",
              color: "white",
              padding: "12px 20px",
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              zIndex: 9999,
              fontFamily: "'Rubik', sans-serif",
              fontSize: "14px",
              fontWeight: 500,
            }}
          >
            {notification}
          </div>
        )}

        {/* Delete Confirmation Modal - Available for bookshelf view */}
        <TwainDeleteConfirmationModal
          open={showDeleteModal}
          onClose={handleCloseDeleteModal}
          onConfirm={handleConfirmDelete}
          itemToDelete={itemToDelete}
        />

        {/* Pricing Modal - Available for logged-in users */}
        <TwainStoryPricingModal
          open={showPricing}
          onClose={handleClosePricing}
          onUpgrade={handleUpgradePlan}
        />
      </div>
    );
  }

  // User is not logged in - show the login screen
  return (
    <>
      <div
        className="h-screen flex flex-col md:flex-row"
        style={{
          fontFamily: "'Crimson-Text', serif",
          color: "rgb(136, 185, 84)",
        }}
      >
        {/* Mobile: Single container with background image, Desktop: Login Panel (50%) */}
        <div className="w-full md:w-1/2 bg-white flex flex-col relative">
          {/* Mobile background overlay - only visible on mobile */}
          <div
            className="absolute inset-0 md:hidden"
            style={{
              backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.9)), url(${backgroundImage})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          ></div>
          {/* Content layer */}
          <div className="relative z-10 flex flex-col sm:h-full h-screen">
            {/* Icon in top left */}
            <div className="pt-32 pl-16 md:pt-32 md:pl-32">
              <div style={{ position: "relative", display: "inline-block" }}>
                <Image
                  src="/images/twain-logo.png"
                  alt="Twain Logo"
                  width={160}
                  height={160}
                />
                <div
                  style={{
                    position: "absolute",
                    bottom: "-16px",
                    right: "-14px",
                    backgroundColor: "#ff4757",
                    color: "white",
                    fontSize: "16px",
                    fontWeight: "bold",
                    padding: "5px 10px",
                    borderRadius: "7px",
                    fontFamily: "'Rubik', sans-serif",
                    border: "1px solid white",
                    zIndex: 10,
                  }}
                >
                  BETA
                </div>
              </div>
            </div>

            {/* Centered login content */}
            <div className="flex-1 flex flex-col justify-center px-6 md:px-12">
              <div className="space-y-6 pl-4 pr-4 py-8 md:pl-20 md:pr-8 md:py-12 text-center md:text-left">
                <Typography
                  variant="body1"
                  sx={{
                    color: "#1f2937",
                    fontFamily: "'Rubik', sans-serif",
                    fontWeight: 400,
                    letterSpacing: 0,
                    fontStretch: "100%",
                    marginBottom: "8px",
                  }}
                >
                  Welcome Back Writer!
                </Typography>

                <Typography
                  variant="h4"
                  sx={{
                    color: "#1f2937",
                    fontFamily: "'Crimson-Text', serif",
                    fontWeight: 200,
                    letterSpacing: 0,
                    fontStretch: "100%",
                    lineHeight: 1.2,
                    marginBottom: "24px",
                    fontSize: { xs: "1.5rem", md: "2.125rem" },
                  }}
                >
                  Log in to Twain Story Writer
                </Typography>

                <Button
                  variant="contained"
                  onClick={handleSignIn}
                  sx={{
                    backgroundColor: "#4285f4",
                    color: "white",
                    padding: "12px 24px",
                    fontSize: "16px",
                    textTransform: "none",
                    borderRadius: "8px",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    "&:hover": {
                      backgroundColor: "#3367d6",
                    },
                    "&:disabled": {
                      backgroundColor: "#cccccc",
                    },
                  }}
                  startIcon={
                    <svg width="20" height="20" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53L2.18 16.93C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07L2.18 7.07C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                    </svg>
                  }
                >
                  Sign in with Google
                </Button>
              </div>
            </div>

            {/* Request Access and Pricing - bottom aligned on mobile, normal position on desktop */}
            <div className="mt-auto p-4 md:p-6 md:mt-0">
              <div className="flex items-center justify-between">
                <Typography
                  variant="body2"
                  onClick={handleRequestAccess}
                  sx={{
                    color: "rgb(136, 185, 84)",
                    fontFamily: "'Crimson-Text', serif",
                    fontStretch: "100%",
                    letterSpacing: 0,
                    cursor: "pointer",
                    "&:hover": {
                      color: "rgb(100, 140, 60)",
                      textDecoration: "underline",
                    },
                  }}
                >
                  Request Access To Our Beta
                </Typography>
                <Typography
                  variant="body2"
                  onClick={handleShowPricing}
                  sx={{
                    color: "rgb(136, 185, 84)",
                    fontFamily: "'Crimson-Text', serif",
                    fontStretch: "100%",
                    letterSpacing: 0,
                    cursor: "pointer",
                    "&:hover": {
                      color: "rgb(100, 140, 60)",
                      textDecoration: "underline",
                    },
                  }}
                >
                  Pricing
                </Typography>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop: Image Column (hidden on mobile) */}
        <div className="hidden md:flex md:w-1/2 relative overflow-hidden">
          <Image
            src={backgroundImage}
            alt="Twain Story Builder"
            fill
            className="object-cover"
            priority
          />
        </div>
      </div>

      {/* Pricing Modal - Available globally for all views */}
      <TwainStoryPricingModal
        open={showPricing}
        onClose={handleClosePricing}
        onUpgrade={handleUpgradePlan}
      />
    </>
  );
};

// Export utility functions for use by other components
export {
  loadBooksFromStorage,
  saveBooksToStorage,
  updateBookWordCount,
  getBooksStorageKey,
  loadQuickStoriesFromStorage,
  saveQuickStoriesToStorage,
  updateQuickStoryWordCount,
  getQuickStoriesStorageKey,
  TwainFooter,
};
export type { Book };

export default TwainStoryBuilder;
