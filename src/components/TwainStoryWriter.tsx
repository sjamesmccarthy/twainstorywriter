import React, { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import {
  updateBookWordCount,
  updateQuickStoryWordCount,
} from "./TwainStoryBuilder";
import { useUserPreferences } from "../hooks/useUserPreferences";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import mammoth from "mammoth";
import {
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Modal,
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  Tooltip,
  Slider,
  Menu,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddCircleOutlinedIcon from "@mui/icons-material/AddCircleOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import CloseIcon from "@mui/icons-material/Close";
import FaceOutlinedIcon from "@mui/icons-material/FaceOutlined";
import CancelIcon from "@mui/icons-material/Cancel";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import BrowserUpdatedOutlinedIcon from "@mui/icons-material/BrowserUpdatedOutlined";
import PetsIcon from "@mui/icons-material/Pets";
import TransgenderIcon from "@mui/icons-material/Transgender";
import BatchPredictionIcon from "@mui/icons-material/BatchPrediction";
import ListAltIcon from "@mui/icons-material/ListAlt";
import AutoStoriesIcon from "@mui/icons-material/AutoStories";
import FolderCopyIcon from "@mui/icons-material/FolderCopy";
import KeyboardDoubleArrowDownIcon from "@mui/icons-material/KeyboardDoubleArrowDown";
import MenuOpenIcon from "@mui/icons-material/MenuOpen";
import HistoryEduIcon from "@mui/icons-material/HistoryEdu";
import TimerOutlinedIcon from "@mui/icons-material/TimerOutlined";
import DataSaverOnOutlinedIcon from "@mui/icons-material/DataSaverOnOutlined";
import FileUploadOutlinedIcon from "@mui/icons-material/FileUploadOutlined";
import LibraryAddOutlinedIcon from "@mui/icons-material/LibraryAddOutlined";
import MoreHorizOutlinedIcon from "@mui/icons-material/MoreHorizOutlined";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import HistoryEduOutlinedIcon from "@mui/icons-material/HistoryEduOutlined";
import TwainStoryPricingModal, {
  ProfessionalFeatureChip,
} from "./TwainStoryPricingModal";

// Define Quill types
interface QuillInstance {
  root: HTMLElement;
  focus(): void;
  getContents(): unknown;
  setContents(delta: unknown): void;
  on(event: string, handler: (...args: unknown[]) => void): void;
  off(event: string, handler: (...args: unknown[]) => void): void;
}

interface Idea {
  id: string;
  title: string;
  notes: string;
  createdAt: Date;
}

interface Character {
  id: string;
  avatar?: string; // base64 image data
  name: string;
  gender: string;
  backstory: string;
  characterization: string;
  voice: string;
  appearance: string;
  friendsFamily: string;
  favorites: string;
  misc: string;
  createdAt: Date;
}

interface Chapter {
  id: string;
  title: string;
  content: string; // JSON string of Quill delta
  createdAt: Date;
}

interface Story {
  id: string;
  title: string;
  content: string; // JSON string of Quill delta
  createdAt: Date;
}

interface Outline {
  id: string;
  title: string;
  content: string; // JSON string of Quill delta
  createdAt: Date;
}

interface Part {
  id: string;
  title: string;
  chapterIds: string[]; // Array of chapter IDs
  storyIds: string[]; // Array of story IDs
  createdAt: Date;
}

interface RecentActivity {
  id: string; // Unique ID for the log entry, not linked to the actual item
  type:
    | "idea"
    | "character"
    | "story"
    | "chapter"
    | "outline"
    | "part"
    | "notecard";
  title: string; // Title of the item when the action occurred
  action: "created" | "modified" | "deleted";
  timestamp: Date; // When this log entry was created
}

interface NoteCard {
  id: string;
  title: string;
  content: string;
  linkedIdeaIds: string[];
  linkedCharacterIds: string[];
  linkedChapterIds: string[];
  createdAt: Date;
  color?: "yellow" | "red" | "blue" | "green" | "gray";
}

// Type definitions - should match the ones in TwainStoryBuilder
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

// Quill Delta types
interface DeltaOperation {
  insert?: string | object;
  delete?: number;
  retain?: number;
  attributes?: object;
}

interface QuillDelta {
  ops: DeltaOperation[];
}

interface TwainStoryWriterProps {
  book: Book;
  onBackToBookshelf: () => void;
  isQuickStoryMode?: boolean;
  autoStartStory?: boolean;
}

// Storage key helpers
const getStorageKey = (
  type: string,
  bookId: number,
  userEmail?: string,
  isQuickStoryMode?: boolean
): string => {
  const prefix = isQuickStoryMode ? "quickstory" : "book";
  if (!userEmail) return `twain-${prefix}-${type}-${bookId}`;
  return `twain-${prefix}-${type}-${bookId}-${userEmail}`;
};

// Note card color helper
const getNoteCardColorClasses = (
  color: "yellow" | "red" | "blue" | "green" | "gray" = "yellow"
) => {
  const colorMap = {
    yellow: {
      bg: "bg-yellow-50",
      border: "border-yellow-200",
      hover: "hover:bg-yellow-100",
    },
    red: {
      bg: "bg-red-50",
      border: "border-red-200",
      hover: "hover:bg-red-100",
    },
    blue: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      hover: "hover:bg-blue-100",
    },
    green: {
      bg: "bg-green-50",
      border: "border-green-200",
      hover: "hover:bg-green-100",
    },
    gray: {
      bg: "bg-gray-50",
      border: "border-gray-200",
      hover: "hover:bg-gray-100",
    },
  };

  const colors = colorMap[color];
  return `relative w-full aspect-square p-4 rounded-lg border ${colors.bg} ${colors.border} ${colors.hover} cursor-pointer flex flex-col justify-between`;
};

// Storage utilities
const saveToStorage = (
  type: string,
  data: unknown[],
  bookId: number,
  userEmail?: string,
  isQuickStoryMode?: boolean
): void => {
  if (!userEmail) return;
  try {
    const storageKey = getStorageKey(type, bookId, userEmail, isQuickStoryMode);
    localStorage.setItem(storageKey, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving ${type} to localStorage:`, error);
  }
};

// QuickStory utilities
const getQuickStoriesStorageKey = (userEmail: string): string => {
  return `twain-story-builder-quickstories-${userEmail}`;
};

const loadQuickStoriesFromStorage = (userEmail?: string): Book[] => {
  if (!userEmail) return [];
  try {
    const storageKey = getQuickStoriesStorageKey(userEmail);
    const stored = localStorage.getItem(storageKey);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Error loading quick stories from localStorage:", error);
    return [];
  }
};

const loadQuickStoryContent = (
  quickStoryId: number,
  userEmail: string
): Story[] => {
  try {
    const storageKey = `twain-quickstory-stories-${quickStoryId}-${userEmail}`;
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.map((story: Story & { createdAt: string }) => ({
        ...story,
        createdAt: new Date(story.createdAt),
      }));
    }
    return [];
  } catch (error) {
    console.error("Error loading quick story content:", error);
    return [];
  }
};

// Helper function to calculate word count from content
const getItemWordCount = (content: string): number => {
  try {
    const delta = JSON.parse(content);
    return (
      delta.ops?.reduce((acc: number, op: DeltaOperation) => {
        if (typeof op.insert === "string") {
          const words = op.insert
            .trim()
            .split(/\s+/)
            .filter((word) => word.length > 0);
          return acc + words.length;
        }
        return acc;
      }, 0) || 0
    );
  } catch {
    return 0;
  }
};

// Helper function to format timestamp for recent activity
const formatActivityTimestamp = (timestamp: Date): string => {
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  };
  return new Date(timestamp)
    .toLocaleDateString("en-US", options)
    .replace(",", " at");
};

const TwainStoryWriter: React.FC<TwainStoryWriterProps> = ({
  book,
  onBackToBookshelf,
  isQuickStoryMode = false,
  autoStartStory = false,
}) => {
  const { data: session } = useSession();
  const { planType } = useUserPreferences();
  const quillRef = useRef<HTMLDivElement | null>(null);
  const [quillInstance, setQuillInstance] = useState<QuillInstance | null>(
    null
  );
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [isEditingChapter, setIsEditingChapter] = useState(false);
  const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null);
  const [isEditingStory, setIsEditingStory] = useState(false);
  const [currentStory, setCurrentStory] = useState<Story | null>(null);
  const [outlines, setOutlines] = useState<Outline[]>([]);
  const [isEditingOutline, setIsEditingOutline] = useState(false);
  const [currentOutline, setCurrentOutline] = useState<Outline | null>(null);
  const [parts, setParts] = useState<Part[]>([]);
  const [totalWordCount, setTotalWordCount] = useState(0);
  const [currentEditorWordCount, setCurrentEditorWordCount] = useState(0);
  const [createIdeaModalOpen, setCreateIdeaModalOpen] = useState(false);
  const [createCharacterModalOpen, setCreateCharacterModalOpen] =
    useState(false);
  const [createChapterModalOpen, setCreateChapterModalOpen] = useState(false);
  const [createStoryModalOpen, setCreateStoryModalOpen] = useState(false);
  const [createPartModalOpen, setCreatePartModalOpen] = useState(false);
  const [ideaTitle, setIdeaTitle] = useState("");
  const [ideaNotes, setIdeaNotes] = useState("");
  const [chapterTitle, setChapterTitle] = useState("");
  const [storyTitle, setStoryTitle] = useState("");
  const [characterName, setCharacterName] = useState("");
  const [characterGender, setCharacterGender] = useState("");
  const [characterBackstory, setCharacterBackstory] = useState("");
  const [characterCharacterization, setCharacterCharacterization] =
    useState("");
  const [characterVoice, setCharacterVoice] = useState("");
  const [characterAppearance, setCharacterAppearance] = useState("");
  const [characterFriendsFamily, setCharacterFriendsFamily] = useState("");
  const [characterFavorites, setCharacterFavorites] = useState("");
  const [characterMisc, setCharacterMisc] = useState("");
  const [characterAvatar, setCharacterAvatar] = useState<string | null>(null);
  const [partTitle, setPartTitle] = useState("");
  const [selectedChapterIds, setSelectedChapterIds] = useState<string[]>([]);
  const [selectedStoryIds, setSelectedStoryIds] = useState<string[]>([]);
  const [lastSaveTime, setLastSaveTime] = useState<string | null>(null);
  const [editingIdea, setEditingIdea] = useState<Idea | null>(null);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(
    null
  );
  const [editingPart, setEditingPart] = useState<Part | null>(null);
  const [allAccordionsExpanded, setAllAccordionsExpanded] = useState(false);
  const [expandedAccordions, setExpandedAccordions] = useState<Set<string>>(
    new Set()
  ); // Start with all collapsed
  const [sidebarCollapsed, setSidebarCollapsed] = useState(isQuickStoryMode);
  const [sidebarExpandedFromIcon, setSidebarExpandedFromIcon] = useState(false);
  const [userManuallyToggled, setUserManuallyToggled] = useState(false);

  // Check for mobile screen size and quick story mode
  useEffect(() => {
    const checkMobile = () => {
      if (window.innerWidth < 768 || isQuickStoryMode) {
        // Only auto-collapse if user hasn't manually toggled or expanded from icon
        if (!sidebarExpandedFromIcon && !userManuallyToggled) {
          setSidebarCollapsed(true);
        }
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, [isQuickStoryMode, sidebarExpandedFromIcon, userManuallyToggled]);

  // Timer-related state
  const [timerModalOpen, setTimerModalOpen] = useState(false);
  const [selectedTimerMinutes, setSelectedTimerMinutes] = useState(10);
  const [timerActive, setTimerActive] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0); // in seconds
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(
    null
  );

  // Word goal related state
  const [wordGoalModalOpen, setWordGoalModalOpen] = useState(false);
  const [selectedWordGoal, setSelectedWordGoal] = useState(500);
  const [wordGoalActive, setWordGoalActive] = useState(false);
  const [wordGoalStartCount, setWordGoalStartCount] = useState(0);
  const [congratulationsModalOpen, setCongratulationsModalOpen] =
    useState(false);

  // Track modification sessions
  const [lastModificationTrackTime, setLastModificationTrackTime] =
    useState<Date | null>(null);
  const [modificationStartWordCount, setModificationStartWordCount] =
    useState(0);

  // Import file modal state
  const [importFileModalOpen, setImportFileModalOpen] = useState(false);
  const [importTitle, setImportTitle] = useState("");
  const [importType, setImportType] = useState<"story" | "chapter" | "outline">(
    "story"
  );

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [recentActivityRefresh, setRecentActivityRefresh] = useState(0);
  const [recentActivityList, setRecentActivityList] = useState<
    RecentActivity[]
  >([]);

  // Pricing modal state
  const [pricingModalOpen, setPricingModalOpen] = useState(false);

  // Import Story modal state
  const [importStoryModalOpen, setImportStoryModalOpen] = useState(false);
  const [selectedStoryIdsForImport, setSelectedStoryIdsForImport] = useState<
    string[]
  >([]);
  const [availableQuickStoryContent, setAvailableQuickStoryContent] = useState<
    Story[]
  >([]);

  // Overwrite confirmation modal state
  const [overwriteConfirmModalOpen, setOverwriteConfirmModalOpen] =
    useState(false);
  const [conflictingChapters, setConflictingChapters] = useState<
    { story: Story; existingChapter: Chapter }[]
  >([]);
  const [pendingImportStories, setPendingImportStories] = useState<Story[]>([]);

  // Note Cards state
  const [noteCards, setNoteCards] = useState<NoteCard[]>([]);
  const [createNoteCardModalOpen, setCreateNoteCardModalOpen] = useState(false);
  const [noteCardContent, setNoteCardContent] = useState("");
  const [noteCardTitle, setNoteCardTitle] = useState("");
  const [editingNoteCard, setEditingNoteCard] = useState<NoteCard | null>(null);
  const [noteCardId, setNoteCardId] = useState<string | null>(null);
  const [selectedIdeaIds, setSelectedIdeaIds] = useState<string[]>([]);
  const [selectedCharacterIds, setSelectedCharacterIds] = useState<string[]>(
    []
  );
  const [selectedNoteCardChapterIds, setSelectedNoteCardChapterIds] = useState<
    string[]
  >([]);
  const [inlineEditingNoteCardId, setInlineEditingNoteCardId] = useState<
    string | null
  >(null);
  const [inlineEditContent, setInlineEditContent] = useState("");
  const [noteCardMenuAnchorEl, setNoteCardMenuAnchorEl] =
    useState<null | HTMLElement>(null);
  const [selectedNoteCardForMenu, setSelectedNoteCardForMenu] = useState<
    string | null
  >(null);
  const [selectedNoteCardColor, setSelectedNoteCardColor] = useState<
    "yellow" | "red" | "blue" | "green" | "gray"
  >("yellow");

  // Drag and drop state for note cards
  const [draggedNoteCardId, setDraggedNoteCardId] = useState<string | null>(
    null
  );
  const [dragOverNoteCardId, setDragOverNoteCardId] = useState<string | null>(
    null
  );

  const quillInitializedRef = useRef(false);

  // Initialize Quill editor
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      quillRef.current &&
      !quillInitializedRef.current
    ) {
      quillInitializedRef.current = true;

      // Load Quill CSS first
      const linkElement = document.createElement("link");
      linkElement.rel = "stylesheet";
      linkElement.href = "https://cdn.quilljs.com/1.3.6/quill.bubble.css";
      document.head.appendChild(linkElement);

      // Then load Quill
      import("quill")
        .then((Quill) => {
          if (quillRef.current) {
            const quill = new Quill.default(quillRef.current, {
              theme: "bubble",
              placeholder: "Begin Writing Here...",
              modules: {
                toolbar: [
                  [{ header: [1, 2, 3, false] }],
                  ["bold", "italic", "underline", "strike"],
                  [
                    {
                      align: [],
                    },
                  ],
                  [{ indent: "-1" }, { indent: "+1" }],
                  ["blockquote"],
                  ["clean"],
                ],
              },
            });

            // Set custom font for editor content
            quill.root.style.fontFamily = "'Crimson Text', serif";
            quill.root.style.fontSize = "18px";
            quill.root.style.lineHeight = "1.6";

            // Add custom placeholder styling
            const style = document.createElement("style");
            style.textContent = `
              .ql-editor.ql-blank::before {
                font-style: normal !important;
                font-size: 24px !important;
                font-family: 'Crimson Text', serif !important;
                color: rgba(107, 114, 128, 0.6) !important;
              }
            `;
            document.head.appendChild(style);

            setQuillInstance(quill);
          }
        })
        .catch((error) => {
          console.error("Failed to load Quill:", error);
          quillInitializedRef.current = false; // Reset on error
        });
    }
  }, []);

  // Load ideas from localStorage on component mount
  useEffect(() => {
    if (session?.user?.email) {
      const storageKey = getStorageKey(
        "ideas",
        book.id,
        session.user.email,
        isQuickStoryMode
      );
      const storedIdeas = localStorage.getItem(storageKey);
      if (storedIdeas) {
        try {
          const parsedIdeas = JSON.parse(storedIdeas).map(
            (idea: Omit<Idea, "createdAt"> & { createdAt: string }) => ({
              ...idea,
              createdAt: new Date(idea.createdAt),
            })
          );
          setIdeas(parsedIdeas);
        } catch (error) {
          console.error("Failed to parse stored ideas:", error);
        }
      }
    }
  }, [book.id, session?.user?.email, isQuickStoryMode]);

  // Load characters from localStorage on component mount
  useEffect(() => {
    if (session?.user?.email) {
      const storageKey = getStorageKey(
        "characters",
        book.id,
        session.user.email,
        isQuickStoryMode
      );
      const storedCharacters = localStorage.getItem(storageKey);
      if (storedCharacters) {
        try {
          const parsedCharacters = JSON.parse(storedCharacters).map(
            (
              character: Omit<Character, "createdAt"> & { createdAt: string }
            ) => ({
              ...character,
              createdAt: new Date(character.createdAt),
            })
          );
          setCharacters(parsedCharacters);
        } catch (error) {
          console.error("Failed to parse stored characters:", error);
        }
      }
    }
  }, [book.id, session?.user?.email, isQuickStoryMode]);

  // Load chapters from localStorage on component mount
  useEffect(() => {
    if (session?.user?.email) {
      const storageKey = getStorageKey(
        "chapters",
        book.id,
        session.user.email,
        isQuickStoryMode
      );
      const storedChapters = localStorage.getItem(storageKey);
      if (storedChapters) {
        try {
          const parsedChapters = JSON.parse(storedChapters).map(
            (chapter: Omit<Chapter, "createdAt"> & { createdAt: string }) => ({
              ...chapter,
              createdAt: new Date(chapter.createdAt),
            })
          );
          setChapters(parsedChapters);
        } catch (error) {
          console.error("Failed to parse stored chapters:", error);
        }
      }
    }
  }, [book.id, session?.user?.email, isQuickStoryMode]);

  // Load stories from localStorage on component mount
  useEffect(() => {
    if (session?.user?.email) {
      const storageKey = getStorageKey(
        "stories",
        book.id,
        session.user.email,
        isQuickStoryMode
      );
      const storedStories = localStorage.getItem(storageKey);
      if (storedStories) {
        try {
          const parsedStories = JSON.parse(storedStories).map(
            (story: Omit<Story, "createdAt"> & { createdAt: string }) => ({
              ...story,
              createdAt: new Date(story.createdAt),
            })
          );
          setStories(parsedStories);
        } catch (error) {
          console.error("Failed to parse stored stories:", error);
        }
      }
    }
  }, [book.id, session?.user?.email, isQuickStoryMode]);

  // Load outlines from localStorage on component mount
  useEffect(() => {
    if (session?.user?.email) {
      const storageKey = getStorageKey(
        "outlines",
        book.id,
        session.user.email,
        isQuickStoryMode
      );
      const storedOutlines = localStorage.getItem(storageKey);
      if (storedOutlines) {
        try {
          const parsedOutlines = JSON.parse(storedOutlines).map(
            (outline: Omit<Outline, "createdAt"> & { createdAt: string }) => ({
              ...outline,
              createdAt: new Date(outline.createdAt),
            })
          );
          setOutlines(parsedOutlines);
        } catch (error) {
          console.error("Failed to parse stored outlines:", error);
        }
      }
    }
  }, [book.id, session?.user?.email, isQuickStoryMode]);

  // Load parts from localStorage on component mount
  useEffect(() => {
    if (session?.user?.email) {
      const storageKey = getStorageKey(
        "parts",
        book.id,
        session.user.email,
        isQuickStoryMode
      );
      const storedParts = localStorage.getItem(storageKey);
      if (storedParts) {
        try {
          const parsedParts = JSON.parse(storedParts).map(
            (part: Omit<Part, "createdAt"> & { createdAt: string }) => ({
              ...part,
              createdAt: new Date(part.createdAt),
            })
          );
          setParts(parsedParts);
        } catch (error) {
          console.error("Failed to parse stored parts:", error);
        }
      }
    }
  }, [book.id, session?.user?.email, isQuickStoryMode]);

  // Load note cards from localStorage on component mount
  useEffect(() => {
    if (session?.user?.email) {
      const storageKey = getStorageKey(
        "notecards",
        book.id,
        session.user.email,
        isQuickStoryMode
      );
      const storedNoteCards = localStorage.getItem(storageKey);
      if (storedNoteCards) {
        try {
          const parsedNoteCards = JSON.parse(storedNoteCards).map(
            (
              noteCard: Omit<NoteCard, "createdAt"> & { createdAt: string }
            ) => ({
              ...noteCard,
              linkedIdeaIds: noteCard.linkedIdeaIds || [],
              linkedCharacterIds: noteCard.linkedCharacterIds || [],
              linkedChapterIds: noteCard.linkedChapterIds || [],
              createdAt: new Date(noteCard.createdAt),
            })
          );
          setNoteCards(parsedNoteCards);
        } catch (error) {
          console.error("Failed to parse stored note cards:", error);
        }
      }
    }
  }, [book.id, session?.user?.email, isQuickStoryMode]);

  // Load QuickStories for Import Story feature
  useEffect(() => {
    if (session?.user?.email && !isQuickStoryMode) {
      const loadedQuickStories = loadQuickStoriesFromStorage(
        session.user.email
      );

      // Load all story content from QuickStories
      const allQuickStoryContent: Story[] = [];
      loadedQuickStories.forEach((quickStory) => {
        if (session.user?.email) {
          const storyContent = loadQuickStoryContent(
            quickStory.id,
            session.user.email
          );
          storyContent.forEach((story) => {
            // Add quickStory info to story for identification
            allQuickStoryContent.push({
              ...story,
              id: `qs-${quickStory.id}-${story.id}`, // Unique ID combining quickstory ID and story ID
              title: `${quickStory.title}`, // Include quickstory title
            });
          });
        }
      });
      setAvailableQuickStoryContent(allQuickStoryContent);
    }
  }, [session?.user?.email, isQuickStoryMode]);

  // Calculate total word count when chapters, stories, or outlines change
  useEffect(() => {
    const calculateWordCount = () => {
      let total = 0;
      [...chapters, ...stories, ...outlines].forEach((item) => {
        try {
          const delta = JSON.parse(item.content);
          const words = delta.ops.reduce(
            (acc: number, op: { insert?: unknown }) => {
              if (op.insert && typeof op.insert === "string") {
                // Clean the text by trimming and removing extra whitespace
                const cleanText = op.insert.trim();
                if (cleanText.length === 0) {
                  return acc;
                }
                const wordsInOp = cleanText
                  .split(/\s+/)
                  .filter((w: string) => w.length > 0);
                return acc + wordsInOp.length;
              }
              return acc;
            },
            0
          );
          total += words;
        } catch {
          // ignore parsing errors
        }
      });
      setTotalWordCount(total);

      // Update the book's or story's word count in localStorage
      if (session?.user?.email) {
        if (isQuickStoryMode) {
          updateQuickStoryWordCount(book.id, total, session.user.email);
        } else {
          updateBookWordCount(book.id, total, session.user.email);
        }
      }
    };
    calculateWordCount();
  }, [
    chapters,
    stories,
    outlines,
    book.id,
    session?.user?.email,
    isQuickStoryMode,
  ]);

  // Set Quill content when currentChapter, currentStory, or currentOutline changes
  useEffect(() => {
    if (quillInstance && (currentChapter || currentStory || currentOutline)) {
      const item = currentChapter || currentStory || currentOutline;
      if (item) {
        const delta = JSON.parse(item.content);
        quillInstance.setContents(delta);
        quillInstance.focus();
      }
    }
  }, [quillInstance, currentChapter, currentStory, currentOutline]);

  // Auto-start story for quick story mode
  useEffect(() => {
    if (
      autoStartStory &&
      quillInstance &&
      stories.length === 0 &&
      session?.user?.email
    ) {
      // Create a new story automatically
      const newStory: Story = {
        id: Date.now().toString(),
        title: book.title, // Use the book title as the story title
        content: JSON.stringify({}), // Empty delta
        createdAt: new Date(),
      };

      const updatedStories = [newStory];
      setStories(updatedStories);

      // Store in localStorage
      const storageKey = getStorageKey(
        "stories",
        book.id,
        session.user.email,
        isQuickStoryMode
      );
      localStorage.setItem(storageKey, JSON.stringify(updatedStories));

      // Set editing mode immediately
      setCurrentStory(newStory);
      setIsEditingStory(true);

      // Initialize word count tracking for new story
      setModificationStartWordCount(0);

      // Update Quill placeholder
      setTimeout(() => {
        if (quillInstance && quillInstance.root) {
          const placeholderText = `Begin writing "${book.title}"...`;
          quillInstance.root.setAttribute("data-placeholder", placeholderText);
        }
      }, 100);
    }
  }, [
    autoStartStory,
    quillInstance,
    stories.length,
    session?.user?.email,
    book.title,
    book.id,
    isQuickStoryMode,
  ]);

  // Auto-open first story in Quick Story mode
  useEffect(() => {
    if (
      isQuickStoryMode &&
      stories.length > 0 &&
      !isEditingStory &&
      !currentStory
    ) {
      // Automatically open the first story for editing
      const firstStory = stories[0];
      setCurrentStory(firstStory);
      setIsEditingStory(true);

      // Initialize word count tracking
      setModificationStartWordCount(0);
    }
  }, [isQuickStoryMode, stories, isEditingStory, currentStory]);

  // Update recent activity list when refresh counter changes
  useEffect(() => {
    const updateRecentActivity = () => {
      if (!session?.user?.email) {
        setRecentActivityList([]);
        return;
      }

      const storageKey = getStorageKey(
        "recent-activity",
        book.id,
        session.user.email,
        isQuickStoryMode
      );
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as Array<{
            id: string;
            type: string;
            title: string;
            action: string;
            timestamp?: string;
            createdAt?: string;
            lastModified?: string;
          }>;
          // Convert old format to new format or filter out invalid entries
          const activities = parsed
            .filter((item) => item.timestamp || item.createdAt) // Keep only items with timestamp
            .map((item) => ({
              id: item.id,
              type: item.type as RecentActivity["type"],
              title: item.title,
              action: item.action as RecentActivity["action"],
              timestamp: new Date(
                item.timestamp ||
                  item.lastModified ||
                  item.createdAt ||
                  Date.now()
              ),
            }))
            .slice(0, 50); // Limit to 50 most recent
          setRecentActivityList(activities);
        } catch (error) {
          console.error("Failed to parse recent activity:", error);
          setRecentActivityList([]);
        }
      } else {
        setRecentActivityList([]);
      }
    };

    updateRecentActivity();
  }, [session?.user?.email, book.id, isQuickStoryMode, recentActivityRefresh]);

  // Function to get recent activity from localStorage
  const getRecentActivity = useCallback((): RecentActivity[] => {
    if (!session?.user?.email) return [];
    const storageKey = getStorageKey(
      "recent-activity",
      book.id,
      session.user.email,
      isQuickStoryMode
    );
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Array<{
          id: string;
          type: string;
          title: string;
          action: string;
          timestamp?: string;
          createdAt?: string;
          lastModified?: string;
        }>;
        // Convert old format to new format or filter out invalid entries
        return parsed
          .filter((item) => item.timestamp || item.createdAt) // Keep only items with timestamp
          .map((item) => ({
            id: item.id,
            type: item.type as RecentActivity["type"],
            title: item.title,
            action: item.action as RecentActivity["action"],
            timestamp: new Date(
              item.timestamp ||
                item.lastModified ||
                item.createdAt ||
                Date.now()
            ),
          }))
          .slice(0, 50); // Limit to 50 most recent
      } catch (error) {
        console.error("Failed to parse recent activity:", error);
      }
    }
    return [];
  }, [session?.user?.email, book.id, isQuickStoryMode]);

  // Function to add items to recent activity
  const addToRecentActivity = useCallback(
    (
      type: RecentActivity["type"],
      title: string,
      action: "created" | "modified" | "deleted" = "created"
    ) => {
      const recentActivity = getRecentActivity();

      const now = new Date();

      // Check for duplicate entries in the last 2 seconds to prevent spam
      const recentDuplicate = recentActivity.find(
        (activity) =>
          activity.type === type &&
          activity.title === title &&
          activity.action === action &&
          now.getTime() - activity.timestamp.getTime() < 2000 // 2 seconds
      );

      if (recentDuplicate) {
        return; // Don't add duplicate entry
      }

      const newActivity: RecentActivity = {
        id: `${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 12)}_${performance.now()}`, // More unique ID
        type,
        title,
        action,
        timestamp: now,
      };

      // Add to front and limit to 50 items
      const updatedActivity = [newActivity, ...recentActivity].slice(0, 50);

      if (session?.user?.email) {
        const storageKey = getStorageKey(
          "recent-activity",
          book.id,
          session.user.email,
          isQuickStoryMode
        );
        localStorage.setItem(storageKey, JSON.stringify(updatedActivity));

        // Trigger re-render to update the activity display
        setRecentActivityRefresh((prev) => prev + 1);
      }
    },
    [getRecentActivity, session?.user?.email, book.id, isQuickStoryMode]
  );

  // Auto-save function
  const handleAutoSave = useCallback(() => {
    if (
      (isEditingChapter && currentChapter) ||
      (isEditingStory && currentStory) ||
      (isEditingOutline && currentOutline)
    ) {
      const item = currentChapter || currentStory || currentOutline;
      if (item && quillInstance) {
        const delta = quillInstance.getContents();
        const updatedItem = {
          ...item,
          content: JSON.stringify(delta),
        };

        // Calculate current word count for modification tracking
        const currentWordCount =
          (delta as QuillDelta).ops?.reduce(
            (acc: number, op: DeltaOperation) => {
              if (typeof op.insert === "string") {
                const cleanText = op.insert.replace(/\n/g, " ").trim();
                const words = cleanText
                  .split(/\s+/)
                  .filter((word: string) => word.length > 0);
                return acc + words.length;
              }
              return acc;
            },
            0
          ) || 0;

        // Track modification for recent activity (simple debounced logging)
        const modificationTime = new Date();
        if (
          !lastModificationTrackTime ||
          modificationTime.getTime() - lastModificationTrackTime.getTime() >
            5000 // 5 second debounce (reduced from 30 seconds)
        ) {
          const wordCountChange = currentWordCount - modificationStartWordCount;

          // Only track if there's a meaningful word count change
          if (Math.abs(wordCountChange) > 1) {
            // Only log if more than 1 word changed (reduced from 5)
            console.log("Logging modification:", {
              type: currentChapter
                ? "chapter"
                : currentStory
                ? "story"
                : "outline",
              title:
                currentChapter?.title ||
                currentStory?.title ||
                currentOutline?.title,
              wordCountChange,
            });
            // Add to recent activity based on the type of item being edited
            if (currentChapter) {
              addToRecentActivity("chapter", currentChapter.title, "modified");
            } else if (currentStory) {
              addToRecentActivity("story", currentStory.title, "modified");
            } else if (currentOutline) {
              addToRecentActivity("outline", currentOutline.title, "modified");
            }
            setLastModificationTrackTime(modificationTime);
            setModificationStartWordCount(currentWordCount);
          }
        }

        if (currentChapter && session?.user?.email) {
          const updatedChapters = chapters.map((ch) =>
            ch.id === currentChapter.id ? updatedItem : ch
          );
          setChapters(updatedChapters);
          const storageKey = getStorageKey(
            "chapters",
            book.id,
            session.user.email,
            isQuickStoryMode
          );
          localStorage.setItem(storageKey, JSON.stringify(updatedChapters));
        } else if (currentStory && session?.user?.email) {
          const updatedStories = stories.map((st) =>
            st.id === currentStory.id ? updatedItem : st
          );
          setStories(updatedStories);
          const storageKey = getStorageKey(
            "stories",
            book.id,
            session.user.email,
            isQuickStoryMode
          );
          localStorage.setItem(storageKey, JSON.stringify(updatedStories));
        } else if (currentOutline && session?.user?.email) {
          const updatedOutlines = outlines.map((ol) =>
            ol.id === currentOutline.id ? updatedItem : ol
          );
          setOutlines(updatedOutlines);
          const storageKey = getStorageKey(
            "outlines",
            book.id,
            session.user.email,
            isQuickStoryMode
          );
          localStorage.setItem(storageKey, JSON.stringify(updatedOutlines));
        }
        // Update last save time
        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const seconds = now.getSeconds();
        const ampm = hours >= 12 ? "PM" : "AM";
        const displayHours = hours % 12 || 12; // Convert to 12-hour format, 0 becomes 12

        setLastSaveTime(
          `${displayHours}:${minutes.toString().padStart(2, "0")}:${seconds
            .toString()
            .padStart(2, "0")} ${ampm}`
        );
      }
    }
  }, [
    isEditingChapter,
    currentChapter,
    isEditingStory,
    currentStory,
    isEditingOutline,
    currentOutline,
    quillInstance,
    chapters,
    stories,
    outlines,
    book.id,
    session?.user?.email,
    isQuickStoryMode,
    lastModificationTrackTime,
    modificationStartWordCount,
    addToRecentActivity,
  ]);

  // Set up auto-save event listener when editing state changes
  useEffect(() => {
    if (
      quillInstance &&
      (isEditingChapter || isEditingStory || isEditingOutline)
    ) {
      const handleTextChange = () => {
        handleAutoSave();
      };

      quillInstance.on("text-change", handleTextChange);

      return () => {
        quillInstance.off("text-change", handleTextChange);
      };
    }
  }, [
    quillInstance,
    isEditingChapter,
    isEditingStory,
    isEditingOutline,
    handleAutoSave,
  ]);

  // Update current editor word count when content changes or when switching items
  useEffect(() => {
    const updateWordCount = () => {
      if (quillInstance && (currentChapter || currentStory || currentOutline)) {
        try {
          const delta = quillInstance.getContents() as {
            ops: { insert?: unknown }[];
          };
          const allText = delta.ops
            .map((op: { insert?: unknown }) =>
              typeof op.insert === "string" ? op.insert : ""
            )
            .join("")
            .trim();

          const wordCount =
            allText.length === 0
              ? 0
              : allText.split(/\s+/).filter((w: string) => w.length > 0).length;
          setCurrentEditorWordCount(wordCount);
        } catch {
          setCurrentEditorWordCount(0);
        }
      } else {
        setCurrentEditorWordCount(0);
      }
    };

    // Update word count immediately when switching items
    updateWordCount();

    // Set up text-change listener for real-time updates
    if (
      quillInstance &&
      (isEditingChapter || isEditingStory || isEditingOutline)
    ) {
      const handleTextChange = () => {
        updateWordCount();
      };

      quillInstance.on("text-change", handleTextChange);

      return () => {
        quillInstance.off("text-change", handleTextChange);
      };
    }
  }, [
    quillInstance,
    currentChapter,
    currentStory,
    currentOutline,
    isEditingChapter,
    isEditingStory,
    isEditingOutline,
  ]);

  // Initialize word count tracking when editing begins
  useEffect(() => {
    if (
      (isEditingChapter || isEditingStory || isEditingOutline) &&
      quillInstance
    ) {
      const currentItem = currentChapter || currentStory || currentOutline;
      if (currentItem) {
        // Only initialize if we haven't started tracking yet or if we switched to a different item
        const isNewItem = !lastModificationTrackTime;

        if (isNewItem) {
          try {
            const delta = JSON.parse(currentItem.content);
            const currentWordCount =
              (delta as QuillDelta).ops?.reduce(
                (acc: number, op: DeltaOperation) => {
                  if (typeof op.insert === "string") {
                    const cleanText = op.insert.replace(/\n/g, " ").trim();
                    const words = cleanText
                      .split(/\s+/)
                      .filter((word: string) => word.length > 0);
                    return acc + words.length;
                  }
                  return acc;
                },
                0
              ) || 0;

            setModificationStartWordCount(currentWordCount);
            setLastModificationTrackTime(null); // Reset tracking time for new item
          } catch {
            setModificationStartWordCount(0);
          }
        }
      }
    }
  }, [
    isEditingChapter,
    isEditingStory,
    isEditingOutline,
    currentChapter,
    currentStory,
    currentOutline,
    quillInstance,
    lastModificationTrackTime,
  ]);

  // Timer functions
  const handleTimerClick = () => {
    setTimerModalOpen(true);
  };

  const handleTimerModalClose = () => {
    setTimerModalOpen(false);
  };

  const handleStartTimer = () => {
    const totalSeconds = selectedTimerMinutes * 60;
    setTimeRemaining(totalSeconds);
    setTimerActive(true);
    setTimerModalOpen(false);

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setTimerActive(false);
          clearInterval(interval);
          setTimerInterval(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    setTimerInterval(interval);
  };

  const handleStopTimer = () => {
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
    setTimerActive(false);
    setTimeRemaining(0);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    };
  }, [timerInterval]);

  // Word goal functions
  const handleWordGoalClick = () => {
    setWordGoalModalOpen(true);
  };

  const handleWordGoalModalClose = () => {
    setWordGoalModalOpen(false);
  };

  const handleStartWordGoal = () => {
    setWordGoalActive(true);
    setWordGoalStartCount(currentEditorWordCount);
    setWordGoalModalOpen(false);
  };

  const handleStopWordGoal = () => {
    setWordGoalActive(false);
    setWordGoalStartCount(0);
  };

  const handleCongratulationsModalClose = () => {
    setCongratulationsModalOpen(false);
    setWordGoalActive(false);
    setWordGoalStartCount(0);
  };

  // Check if word goal is reached
  useEffect(() => {
    if (wordGoalActive && wordGoalStartCount > 0) {
      const wordsWritten = currentEditorWordCount - wordGoalStartCount;
      if (wordsWritten >= selectedWordGoal) {
        setCongratulationsModalOpen(true);
      }
    }
  }, [
    currentEditorWordCount,
    wordGoalActive,
    wordGoalStartCount,
    selectedWordGoal,
  ]);

  const handleEditIdea = (idea: Idea) => {
    console.log("handleEditIdea called with:", idea);
    setEditingIdea(idea);
    setIdeaTitle(idea.title);
    setIdeaNotes(idea.notes);
    setCreateIdeaModalOpen(true);
    console.log("Idea modal should be opening");
  };

  const handleCreateIdeaClick = () => {
    // Check if freelance user has reached the limit
    if (planType !== "professional" && ideas.length >= 3) {
      setPricingModalOpen(true);
      return;
    }

    setEditingIdea(null);
    setCreateIdeaModalOpen(true);
  };

  const handleCreateIdeaModalClose = () => {
    setCreateIdeaModalOpen(false);
    setIdeaTitle("");
    setIdeaNotes("");
    setEditingIdea(null);
  };

  const handleCreateIdea = () => {
    if (ideaTitle.trim()) {
      if (editingIdea) {
        // Update existing idea
        const updatedIdea: Idea = {
          ...editingIdea,
          title: ideaTitle.trim(),
          notes: ideaNotes.trim(),
        };

        const updatedIdeas = ideas.map((idea) =>
          idea.id === editingIdea.id ? updatedIdea : idea
        );
        setIdeas(updatedIdeas);

        // Store in localStorage
        if (session?.user?.email) {
          const storageKey = getStorageKey(
            "ideas",
            book.id,
            session.user.email,
            isQuickStoryMode
          );
          localStorage.setItem(storageKey, JSON.stringify(updatedIdeas));
        }

        // Add to recent activity for idea modification
        addToRecentActivity("idea", updatedIdea.title, "modified");
      } else {
        // Create new idea
        const newIdea: Idea = {
          id: Date.now().toString(),
          title: ideaTitle.trim(),
          notes: ideaNotes.trim(),
          createdAt: new Date(),
        };

        const updatedIdeas = [...ideas, newIdea];
        setIdeas(updatedIdeas);

        // Store in localStorage
        if (session?.user?.email) {
          const storageKey = getStorageKey(
            "ideas",
            book.id,
            session.user.email,
            isQuickStoryMode
          );
          localStorage.setItem(storageKey, JSON.stringify(updatedIdeas));
        }

        // Add to recent activity
        addToRecentActivity("idea", newIdea.title, "created");
      }

      handleCreateIdeaModalClose();
    }
  };

  const handleEditCharacter = (character: Character) => {
    console.log("handleEditCharacter called with:", character);
    setEditingCharacter(character);
    setCharacterName(character.name);
    setCharacterGender(character.gender);
    setCharacterBackstory(character.backstory);
    setCharacterCharacterization(character.characterization);
    setCharacterVoice(character.voice);
    setCharacterAppearance(character.appearance);
    setCharacterFriendsFamily(character.friendsFamily);
    setCharacterFavorites(character.favorites);
    setCharacterMisc(character.misc);
    setCharacterAvatar(character.avatar || null);
    setCreateCharacterModalOpen(true);
    console.log("Character modal should be opening");
  };

  const handleCreateCharacterClick = () => {
    // Check if freelance user has reached the limit
    if (planType !== "professional" && characters.length >= 3) {
      setPricingModalOpen(true);
      return;
    }

    setEditingCharacter(null);
    setCreateCharacterModalOpen(true);
  };

  const handleCreateCharacterModalClose = () => {
    setCreateCharacterModalOpen(false);
    setCharacterName("");
    setCharacterGender("");
    setCharacterBackstory("");
    setCharacterCharacterization("");
    setCharacterVoice("");
    setCharacterAppearance("");
    setCharacterFriendsFamily("");
    setCharacterFavorites("");
    setCharacterMisc("");
    setCharacterAvatar(null);
    setEditingCharacter(null);
  };

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCharacterAvatar(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateCharacter = () => {
    if (characterName.trim()) {
      if (editingCharacter) {
        // Update existing character
        const updatedCharacter: Character = {
          ...editingCharacter,
          avatar: characterAvatar || undefined,
          name: characterName.trim(),
          gender: characterGender.trim(),
          backstory: characterBackstory.trim(),
          characterization: characterCharacterization.trim(),
          voice: characterVoice.trim(),
          appearance: characterAppearance.trim(),
          friendsFamily: characterFriendsFamily.trim(),
          favorites: characterFavorites.trim(),
          misc: characterMisc.trim(),
        };

        const updatedCharacters = characters.map((character) =>
          character.id === editingCharacter.id ? updatedCharacter : character
        );
        setCharacters(updatedCharacters);

        // Store in localStorage
        if (session?.user?.email) {
          saveToStorage(
            "characters",
            updatedCharacters,
            book.id,
            session.user.email,
            isQuickStoryMode
          );
        }

        // Add to recent activity for character modification
        addToRecentActivity("character", updatedCharacter.name, "modified");
      } else {
        // Create new character
        const newCharacter: Character = {
          id: Date.now().toString(),
          avatar: characterAvatar || undefined,
          name: characterName.trim(),
          gender: characterGender.trim(),
          backstory: characterBackstory.trim(),
          characterization: characterCharacterization.trim(),
          voice: characterVoice.trim(),
          appearance: characterAppearance.trim(),
          friendsFamily: characterFriendsFamily.trim(),
          favorites: characterFavorites.trim(),
          misc: characterMisc.trim(),
          createdAt: new Date(),
        };

        const updatedCharacters = [...characters, newCharacter];
        setCharacters(updatedCharacters);

        // Store in localStorage
        if (session?.user?.email) {
          const storageKey = getStorageKey(
            "characters",
            book.id,
            session.user.email,
            isQuickStoryMode
          );
          localStorage.setItem(storageKey, JSON.stringify(updatedCharacters));
        }

        // Add to recent activity
        addToRecentActivity("character", newCharacter.name, "created");
      }

      handleCreateCharacterModalClose();
    }
  };

  const handleDeleteIdea = (ideaId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent triggering the edit handler

    // Find the idea to get its title for activity tracking
    const ideaToDelete = ideas.find((idea) => idea.id === ideaId);

    // Remove idea from state
    const updatedIdeas = ideas.filter((idea) => idea.id !== ideaId);
    setIdeas(updatedIdeas);

    // Update localStorage
    if (session?.user?.email) {
      const storageKey = getStorageKey(
        "ideas",
        book.id,
        session.user.email,
        isQuickStoryMode
      );
      localStorage.setItem(storageKey, JSON.stringify(updatedIdeas));
    }

    // Add to recent activity if idea was found
    if (ideaToDelete) {
      addToRecentActivity("idea", ideaToDelete.title, "deleted");
    }
  };

  const handleDeleteCharacter = (
    characterId: string,
    event: React.MouseEvent
  ) => {
    event.stopPropagation(); // Prevent triggering the edit handler

    // Find the character to get its name for activity tracking
    const characterToDelete = characters.find(
      (character) => character.id === characterId
    );

    // Remove character from state
    const updatedCharacters = characters.filter(
      (character) => character.id !== characterId
    );
    setCharacters(updatedCharacters);

    // Update localStorage
    if (session?.user?.email) {
      const storageKey = getStorageKey(
        "characters",
        book.id,
        session.user.email,
        isQuickStoryMode
      );
      localStorage.setItem(storageKey, JSON.stringify(updatedCharacters));
    }

    // Add to recent activity if character was found
    if (characterToDelete) {
      addToRecentActivity("character", characterToDelete.name, "deleted");
    }
  };

  const handleCreateChapterModalClose = () => {
    setCreateChapterModalOpen(false);
    setChapterTitle("");
  };

  const handleCreateChapter = () => {
    const chapterNumber = chapters.length + 1;
    const title = chapterTitle.trim() || `Chapter ${chapterNumber}`;
    const defaultDelta = {};

    const newChapter: Chapter = {
      id: Date.now().toString(),
      title: title,
      content: JSON.stringify(defaultDelta),
      createdAt: new Date(),
    };

    const updatedChapters = [...chapters, newChapter];
    setChapters(updatedChapters);

    // Store in localStorage
    if (session?.user?.email) {
      const storageKey = getStorageKey(
        "chapters",
        book.id,
        session.user.email,
        isQuickStoryMode
      );
      localStorage.setItem(storageKey, JSON.stringify(updatedChapters));
    }

    // Add to recent activity
    addToRecentActivity("chapter", newChapter.title, "created");

    // Set editing mode
    setCurrentChapter(newChapter);
    setIsEditingChapter(true);

    // Initialize word count tracking for new chapter
    setModificationStartWordCount(0);

    // Update Quill placeholder after a short delay to ensure Quill is ready
    setTimeout(() => {
      if (quillInstance && quillInstance.root) {
        const placeholderText = "Begin Writing Here...";
        quillInstance.root.setAttribute("data-placeholder", placeholderText);
      }
    }, 100);

    handleCreateChapterModalClose();
  };

  const handleCreateChapterClick = () => {
    setCreateChapterModalOpen(true);
  };

  const handleImportStoryClick = () => {
    // Only allow in book writing mode if there are QuickStories to import
    if (!isQuickStoryMode && availableQuickStoryContent.length > 0) {
      setImportStoryModalOpen(true);
    }
  };

  const handleImportStoryModalClose = () => {
    setImportStoryModalOpen(false);
    setSelectedStoryIdsForImport([]);
  };

  const handleImportStory = () => {
    if (selectedStoryIdsForImport.length > 0) {
      // Get the selected QuickStories
      const selectedQuickStories = availableQuickStoryContent.filter((story) =>
        selectedStoryIdsForImport.includes(story.id)
      );

      // Check for conflicts with existing chapters
      const conflicts: { story: Story; existingChapter: Chapter }[] = [];
      const nonConflictingStories: Story[] = [];

      selectedQuickStories.forEach((story) => {
        const existingChapter = chapters.find(
          (chapter) =>
            chapter.title.toLowerCase().trim() ===
            story.title.toLowerCase().trim()
        );

        if (existingChapter) {
          conflicts.push({ story, existingChapter });
        } else {
          nonConflictingStories.push(story);
        }
      });

      // If there are conflicts, show confirmation modal
      if (conflicts.length > 0) {
        setConflictingChapters(conflicts);
        setPendingImportStories(nonConflictingStories);
        setOverwriteConfirmModalOpen(true);
        return;
      }

      // If no conflicts, proceed with import
      performImport(selectedQuickStories);
    }
  };

  const performImport = (
    storiesToImport: Story[],
    overwriteConflicts: boolean = false
  ) => {
    // Create new chapters from the selected QuickStories
    const newChapters: Chapter[] = [];
    const updatedChapters = [...chapters];

    storiesToImport.forEach((story) => {
      if (overwriteConflicts) {
        // Find and replace existing chapter with same name
        const existingIndex = updatedChapters.findIndex(
          (chapter) =>
            chapter.title.toLowerCase().trim() ===
            story.title.toLowerCase().trim()
        );

        if (existingIndex !== -1) {
          // Overwrite existing chapter
          const updatedChapter: Chapter = {
            ...updatedChapters[existingIndex], // Keep original ID and createdAt
            title: story.title,
            content: story.content,
          };
          updatedChapters[existingIndex] = updatedChapter;
          newChapters.push(updatedChapter);
        } else {
          // Create new chapter
          const newChapter: Chapter = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            title: story.title,
            content: story.content,
            createdAt: new Date(),
          };
          updatedChapters.push(newChapter);
          newChapters.push(newChapter);
        }
      } else {
        // Create new chapter
        const newChapter: Chapter = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          title: story.title,
          content: story.content,
          createdAt: new Date(),
        };
        updatedChapters.push(newChapter);
        newChapters.push(newChapter);
      }
    });

    // Update chapters
    setChapters(updatedChapters);

    // Store in localStorage
    if (session?.user?.email) {
      const storageKey = getStorageKey(
        "chapters",
        book.id,
        session.user.email,
        isQuickStoryMode
      );
      localStorage.setItem(storageKey, JSON.stringify(updatedChapters));
    }

    // Add to recent activity for each imported chapter
    newChapters.forEach((chapter) => {
      const action = overwriteConflicts ? "modified" : "created";
      addToRecentActivity("chapter", chapter.title, action);
    });

    handleImportStoryModalClose();
  };

  const handleStorySelectionForImport = (storyId: string) => {
    setSelectedStoryIdsForImport((prev) => {
      if (prev.includes(storyId)) {
        return prev.filter((id) => id !== storyId);
      } else {
        return [...prev, storyId];
      }
    });
  };

  // Overwrite confirmation handlers
  const handleOverwriteConfirmClose = () => {
    setOverwriteConfirmModalOpen(false);
    setConflictingChapters([]);
    setPendingImportStories([]);
  };

  const handleConfirmOverwrite = () => {
    // Import both conflicting stories (with overwrite) and non-conflicting stories
    const allStoriesToImport = [
      ...conflictingChapters.map((c) => c.story),
      ...pendingImportStories,
    ];
    performImport(allStoriesToImport, true);
    handleOverwriteConfirmClose();
  };

  const handleSkipConflicts = () => {
    // Import only non-conflicting stories
    if (pendingImportStories.length > 0) {
      performImport(pendingImportStories, false);
    }
    handleOverwriteConfirmClose();
  };

  const handleCreateStoryModalClose = () => {
    setCreateStoryModalOpen(false);
    setStoryTitle("");
  };

  const handleCreateStory = () => {
    const storyNumber = stories.length + 1;
    const title = storyTitle.trim() || `Story ${storyNumber}`;
    const defaultDelta = {};

    const newStory: Story = {
      id: Date.now().toString(),
      title: title,
      content: JSON.stringify(defaultDelta),
      createdAt: new Date(),
    };

    const updatedStories = [...stories, newStory];
    setStories(updatedStories);

    // Store in localStorage
    if (session?.user?.email) {
      const storageKey = getStorageKey(
        "stories",
        book.id,
        session.user.email,
        isQuickStoryMode
      );
      localStorage.setItem(storageKey, JSON.stringify(updatedStories));
    }

    // Add to recent activity
    addToRecentActivity("story", newStory.title, "created");

    // Set editing mode
    setCurrentStory(newStory);
    setIsEditingStory(true);

    // Initialize word count tracking for new story
    setModificationStartWordCount(0);

    // Update Quill placeholder after a short delay to ensure Quill is ready
    setTimeout(() => {
      if (quillInstance && quillInstance.root) {
        const placeholderText = "Begin Writing Here...";
        quillInstance.root.setAttribute("data-placeholder", placeholderText);
      }
    }, 100);

    handleCreateStoryModalClose();
  };

  const handleCreateOutlineClick = () => {
    const outlineNumber = outlines.length + 1;
    const defaultDelta = {};
    const newOutline: Outline = {
      id: Date.now().toString(),
      title: `Outline ${outlineNumber}`,
      content: JSON.stringify(defaultDelta),
      createdAt: new Date(),
    };

    const updatedOutlines = [...outlines, newOutline];
    setOutlines(updatedOutlines);

    // Store in localStorage
    if (session?.user?.email) {
      const storageKey = getStorageKey(
        "outlines",
        book.id,
        session.user.email,
        isQuickStoryMode
      );
      localStorage.setItem(storageKey, JSON.stringify(updatedOutlines));
    }

    // Add to recent activity
    addToRecentActivity("outline", newOutline.title, "created");

    // Set editing mode
    setCurrentOutline(newOutline);
    setIsEditingOutline(true);

    // Initialize word count tracking for new outline
    setModificationStartWordCount(0);
  };

  const handleEditPart = (part: Part) => {
    setEditingPart(part);
    setPartTitle(part.title);
    setSelectedChapterIds(part.chapterIds || []);
    setSelectedStoryIds(part.storyIds || []);
    setCreatePartModalOpen(true);
  };

  const handleCreatePartClick = () => {
    setEditingPart(null);
    setCreatePartModalOpen(true);
  };

  const handleCreatePartModalClose = () => {
    setCreatePartModalOpen(false);
    setPartTitle("");
    setSelectedChapterIds([]);
    setSelectedStoryIds([]);
    setEditingPart(null);
  };

  const handleCreatePart = () => {
    if (
      partTitle.trim() &&
      (selectedChapterIds.length > 0 || selectedStoryIds.length > 0)
    ) {
      if (editingPart) {
        // Update existing part
        const updatedPart: Part = {
          ...editingPart,
          title: partTitle.trim(),
          chapterIds: selectedChapterIds,
          storyIds: selectedStoryIds,
        };

        const updatedParts = parts.map((part) =>
          part.id === editingPart.id ? updatedPart : part
        );
        setParts(updatedParts);

        // Store in localStorage
        localStorage.setItem(
          `twain-parts-${book.id}`,
          JSON.stringify(updatedParts)
        );

        // Add to recent activity for part modification
        addToRecentActivity("part", updatedPart.title, "modified");
      } else {
        // Create new part
        const newPart: Part = {
          id: Date.now().toString(),
          title: partTitle.trim(),
          chapterIds: selectedChapterIds,
          storyIds: selectedStoryIds,
          createdAt: new Date(),
        };

        const updatedParts = [...parts, newPart];
        setParts(updatedParts);

        // Store in localStorage
        localStorage.setItem(
          `twain-parts-${book.id}`,
          JSON.stringify(updatedParts)
        );

        // Add to recent activity
        addToRecentActivity("part", newPart.title, "created");
      }

      handleCreatePartModalClose();
    }
  };

  const handleEditChapter = (chapter: Chapter) => {
    setCurrentChapter(chapter);
    setIsEditingChapter(true);
    // Clear story and outline editing state
    setIsEditingStory(false);
    setCurrentStory(null);
    setIsEditingOutline(false);
    setCurrentOutline(null);
    setLastSaveTime(null);

    // Initialize word count tracking for this editing session
    setModificationStartWordCount(0);

    // Update Quill placeholder for existing chapter
    setTimeout(() => {
      if (quillInstance && quillInstance.root) {
        const placeholderText = `Continue writing ${chapter.title}...`;
        quillInstance.root.setAttribute("data-placeholder", placeholderText);
      }
    }, 100);
  };

  const handleDeleteChapter = (chapterId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent triggering the edit handler

    // Find the chapter to get its title for activity tracking
    const chapterToDelete = chapters.find(
      (chapter) => chapter.id === chapterId
    );

    // If currently editing this chapter, exit editing mode
    if (currentChapter && currentChapter.id === chapterId) {
      setIsEditingChapter(false);
      setCurrentChapter(null);
      setLastSaveTime(null);
    }

    // Remove chapter from state
    const updatedChapters = chapters.filter(
      (chapter) => chapter.id !== chapterId
    );
    setChapters(updatedChapters);

    // Update localStorage
    localStorage.setItem(
      `twain-chapters-${book.id}`,
      JSON.stringify(updatedChapters)
    );

    // Remove chapter from any parts that contain it
    const updatedParts = parts
      .map((part) => ({
        ...part,
        chapterIds: (part.chapterIds || []).filter((id) => id !== chapterId),
      }))
      .filter(
        (part) =>
          (part.chapterIds || []).length > 0 || (part.storyIds || []).length > 0
      ); // Remove parts with no chapters or stories

    setParts(updatedParts);
    localStorage.setItem(
      `twain-parts-${book.id}`,
      JSON.stringify(updatedParts)
    );

    // Add to recent activity if chapter was found
    if (chapterToDelete) {
      addToRecentActivity("chapter", chapterToDelete.title, "deleted");
    }
  };

  const handleEditStory = (story: Story) => {
    setCurrentStory(story);
    setIsEditingStory(true);
    // Clear chapter and outline editing state
    setIsEditingChapter(false);
    setCurrentChapter(null);
    setIsEditingOutline(false);
    setCurrentOutline(null);
    setLastSaveTime(null);

    // Initialize word count tracking for this editing session
    setModificationStartWordCount(0);

    // Update Quill placeholder for existing story
    setTimeout(() => {
      if (quillInstance && quillInstance.root) {
        const placeholderText = `Continue writing ${story.title}...`;
        quillInstance.root.setAttribute("data-placeholder", placeholderText);
      }
    }, 100);
  };

  const handleDeleteStory = (storyId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent triggering the edit handler

    // Find the story to get its title for activity tracking
    const storyToDelete = stories.find((story) => story.id === storyId);

    // If currently editing this story, exit editing mode
    if (currentStory && currentStory.id === storyId) {
      setIsEditingStory(false);
      setCurrentStory(null);
      setLastSaveTime(null);
    }

    // Remove story from state
    const updatedStories = stories.filter((story) => story.id !== storyId);
    setStories(updatedStories);

    // Update localStorage
    localStorage.setItem(
      `twain-stories-${book.id}`,
      JSON.stringify(updatedStories)
    );

    // Remove story from any parts that contain it
    const updatedParts = parts
      .map((part) => ({
        ...part,
        storyIds: (part.storyIds || []).filter((id) => id !== storyId),
      }))
      .filter(
        (part) =>
          (part.chapterIds || []).length > 0 || (part.storyIds || []).length > 0
      ); // Remove parts with no chapters or stories

    setParts(updatedParts);
    localStorage.setItem(
      `twain-parts-${book.id}`,
      JSON.stringify(updatedParts)
    );

    // Add to recent activity if story was found
    if (storyToDelete) {
      addToRecentActivity("story", storyToDelete.title, "deleted");
    }
  };

  const handleDownloadStory = async (story: Story, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent triggering the edit handler

    try {
      // Convert Quill delta to plain text
      let storyText = "";
      if (story.content) {
        try {
          const delta = JSON.parse(story.content);
          if (delta && delta.ops) {
            storyText = delta.ops
              .map((op: { insert?: string }) =>
                typeof op.insert === "string" ? op.insert : ""
              )
              .join("");
          }
        } catch {
          // If parsing fails, treat as plain text
          storyText = story.content;
        }
      }

      // Split text into paragraphs
      const paragraphs = storyText
        .split("\n")
        .filter((text) => text.trim() !== "");

      // Create DOCX document
      const doc = new Document({
        sections: [
          {
            properties: {},
            children: [
              // Title
              new Paragraph({
                text: story.title,
                heading: HeadingLevel.TITLE,
                spacing: {
                  after: 400,
                },
              }),
              // Content paragraphs
              ...paragraphs.map(
                (text) =>
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: text.trim(),
                        font: "Times New Roman",
                        size: 24, // 12pt in half-points
                      }),
                    ],
                    spacing: {
                      after: 240, // 12pt spacing
                    },
                  })
              ),
            ],
          },
        ],
      });

      // Generate and download the document
      const buffer = await Packer.toBuffer(doc);
      const blob = new Blob([new Uint8Array(buffer)], {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${story.title
        .replace(/[^a-z0-9\s]/gi, "_")
        .toLowerCase()}.docx`;

      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading story:", error);
    }
  };

  const handleDownloadChapter = async (
    chapter: Chapter,
    event: React.MouseEvent
  ) => {
    event.stopPropagation(); // Prevent triggering the edit handler

    try {
      // Convert Quill delta to plain text
      let chapterText = "";
      if (chapter.content) {
        try {
          const delta = JSON.parse(chapter.content);
          if (delta && delta.ops) {
            chapterText = delta.ops
              .map((op: { insert?: string }) =>
                typeof op.insert === "string" ? op.insert : ""
              )
              .join("");
          }
        } catch {
          // If parsing fails, treat as plain text
          chapterText = chapter.content;
        }
      }

      // Split text into paragraphs
      const paragraphs = chapterText
        .split("\n")
        .filter((text) => text.trim() !== "");

      // Create DOCX document
      const doc = new Document({
        sections: [
          {
            properties: {},
            children: [
              // Title
              new Paragraph({
                text: chapter.title,
                heading: HeadingLevel.TITLE,
                spacing: {
                  after: 400,
                },
              }),
              // Content paragraphs
              ...paragraphs.map(
                (text) =>
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: text.trim(),
                        font: "Times New Roman",
                        size: 24, // 12pt in half-points
                      }),
                    ],
                    spacing: {
                      after: 240, // 12pt spacing
                    },
                  })
              ),
            ],
          },
        ],
      });

      // Generate and download the document
      const buffer = await Packer.toBuffer(doc);
      const blob = new Blob([new Uint8Array(buffer)], {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${chapter.title
        .replace(/[^a-z0-9\s]/gi, "_")
        .toLowerCase()}.docx`;

      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading chapter:", error);
    }
  };

  const handleDownloadOutline = async (
    outline: Outline,
    event: React.MouseEvent
  ) => {
    event.stopPropagation(); // Prevent triggering the edit handler

    try {
      // Convert Quill delta to plain text
      let outlineText = "";
      if (outline.content) {
        try {
          const delta = JSON.parse(outline.content);
          if (delta && delta.ops) {
            outlineText = delta.ops
              .map((op: { insert?: string }) =>
                typeof op.insert === "string" ? op.insert : ""
              )
              .join("");
          }
        } catch {
          // If parsing fails, treat as plain text
          outlineText = outline.content;
        }
      }

      // Split text into paragraphs
      const paragraphs = outlineText
        .split("\n")
        .filter((text) => text.trim() !== "");

      // Create DOCX document
      const doc = new Document({
        sections: [
          {
            properties: {},
            children: [
              // Title
              new Paragraph({
                text: outline.title,
                heading: HeadingLevel.TITLE,
                spacing: {
                  after: 400,
                },
              }),
              // Content paragraphs
              ...paragraphs.map(
                (text) =>
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: text.trim(),
                        font: "Times New Roman",
                        size: 24, // 12pt in half-points
                      }),
                    ],
                    spacing: {
                      after: 240, // 12pt spacing
                    },
                  })
              ),
            ],
          },
        ],
      });

      // Generate and download the document
      const buffer = await Packer.toBuffer(doc);
      const blob = new Blob([new Uint8Array(buffer)], {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${outline.title
        .replace(/[^a-z0-9\s]/gi, "_")
        .toLowerCase()}.docx`;

      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading outline:", error);
    }
  };

  const handleEditOutline = (outline: Outline) => {
    setCurrentOutline(outline);
    setIsEditingOutline(true);
    // Clear chapter and story editing state
    setIsEditingChapter(false);
    setCurrentChapter(null);
    setIsEditingStory(false);
    setCurrentStory(null);
    setLastSaveTime(null);

    // Initialize word count tracking for this editing session
    setModificationStartWordCount(0);
  };

  const handleDeleteOutline = (outlineId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent triggering the edit handler

    // Find the outline to get its title for activity tracking
    const outlineToDelete = outlines.find(
      (outline) => outline.id === outlineId
    );

    // If currently editing this outline, exit editing mode
    if (currentOutline && currentOutline.id === outlineId) {
      setIsEditingOutline(false);
      setCurrentOutline(null);
      setLastSaveTime(null);
    }

    // Remove outline from state
    const updatedOutlines = outlines.filter(
      (outline) => outline.id !== outlineId
    );
    setOutlines(updatedOutlines);

    // Update localStorage
    localStorage.setItem(
      `twain-outlines-${book.id}`,
      JSON.stringify(updatedOutlines)
    );

    // Add to recent activity if outline was found
    if (outlineToDelete) {
      addToRecentActivity("outline", outlineToDelete.title, "deleted");
    }
  };

  const handleDeletePart = (partId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent triggering the edit handler

    // Find the part to get its title for activity tracking
    const partToDelete = parts.find((part) => part.id === partId);

    // Remove part from state
    const updatedParts = parts.filter((part) => part.id !== partId);
    setParts(updatedParts);

    // Update localStorage
    localStorage.setItem(
      `twain-parts-${book.id}`,
      JSON.stringify(updatedParts)
    );

    // Add to recent activity if part was found
    if (partToDelete) {
      addToRecentActivity("part", partToDelete.title, "deleted");
    }
  };

  const handleDeleteActivityEntry = (
    activityId: string,
    event: React.MouseEvent
  ) => {
    event.stopPropagation(); // Prevent triggering the activity click handler

    if (session?.user?.email) {
      const storageKey = getStorageKey(
        "recent-activity",
        book.id,
        session.user.email,
        isQuickStoryMode
      );
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        try {
          const activities = JSON.parse(stored) as RecentActivity[];
          const updatedActivities = activities.filter(
            (activity) => activity.id !== activityId
          );
          localStorage.setItem(storageKey, JSON.stringify(updatedActivities));

          // Trigger re-render to update the activity display
          setRecentActivityRefresh((prev) => prev + 1);
        } catch (error) {
          console.error("Failed to delete activity entry:", error);
        }
      }
    }
  };

  const handleToggleAllAccordions = () => {
    if (allAccordionsExpanded) {
      // Collapse all
      setExpandedAccordions(new Set());
      setAllAccordionsExpanded(false);
    } else {
      // Expand all
      const allSections = new Set([
        "IDEAS",
        "CHARACTERS",
        "OUTLINE",
        "STORIES",
        "CHAPTERS",
        "PARTS",
      ]);
      setExpandedAccordions(allSections);
      setAllAccordionsExpanded(true);
    }
  };

  const handleToggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
    setUserManuallyToggled(true); // Mark that user manually toggled
    setSidebarExpandedFromIcon(false); // Reset expanded from icon state
  };

  // Import file handlers
  const handleImportFileClick = () => {
    setImportFileModalOpen(true);
  };

  const handleImportFileModalClose = () => {
    setImportFileModalOpen(false);
    setImportTitle("");
    setImportType("story");
    setSelectedFile(null);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Auto-fill title from filename (without extension)
      const fileName = file.name.replace(/\.[^/.]+$/, "");
      setImportTitle(fileName);
    }
  };

  // Pricing modal handlers
  const handlePricingModalClose = () => {
    setPricingModalOpen(false);
  };

  const handleUpgrade = (planType: "professional") => {
    // This would typically handle the upgrade process
    // For now, we'll just close the modal
    setPricingModalOpen(false);
    // You could add actual upgrade logic here
    console.log("Upgrade to:", planType);
  };

  // Drag and drop handlers for note cards
  const handleNoteCardDragStart = (e: React.DragEvent, noteCardId: string) => {
    setDraggedNoteCardId(noteCardId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleNoteCardDragOver = (e: React.DragEvent, noteCardId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverNoteCardId(noteCardId);
  };

  const handleNoteCardDragLeave = () => {
    setDragOverNoteCardId(null);
  };

  const handleNoteCardDrop = (e: React.DragEvent, dropTargetId: string) => {
    e.preventDefault();

    if (!draggedNoteCardId || draggedNoteCardId === dropTargetId) {
      setDraggedNoteCardId(null);
      setDragOverNoteCardId(null);
      return;
    }

    // Find the indices of the dragged and target note cards
    const draggedIndex = noteCards.findIndex(
      (nc) => nc.id === draggedNoteCardId
    );
    const targetIndex = noteCards.findIndex((nc) => nc.id === dropTargetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    // Create a new array with reordered note cards
    const updatedNoteCards = [...noteCards];
    const [draggedCard] = updatedNoteCards.splice(draggedIndex, 1);
    updatedNoteCards.splice(targetIndex, 0, draggedCard);

    setNoteCards(updatedNoteCards);

    // Update localStorage
    if (session?.user?.email) {
      const storageKey = getStorageKey(
        "notecards",
        book.id,
        session.user.email,
        isQuickStoryMode
      );
      localStorage.setItem(storageKey, JSON.stringify(updatedNoteCards));
    }

    // Reset drag state
    setDraggedNoteCardId(null);
    setDragOverNoteCardId(null);
  };

  const handleNoteCardDragEnd = () => {
    setDraggedNoteCardId(null);
    setDragOverNoteCardId(null);
  };

  // Note Card handlers
  const handleCreateNoteCardClick = () => {
    // Check if freelance user tries to access note cards (Professional only feature)
    if (planType !== "professional") {
      setPricingModalOpen(true);
      return;
    }

    setEditingNoteCard(null);
    setNoteCardId(Date.now().toString()); // Generate unique ID
    setCreateNoteCardModalOpen(true);
  };

  const handleCreateNoteCardModalClose = () => {
    setCreateNoteCardModalOpen(false);
    setNoteCardContent("");
    setNoteCardTitle("");
    setEditingNoteCard(null);
    setNoteCardId(null);
    setSelectedIdeaIds([]);
    setSelectedCharacterIds([]);
    setSelectedNoteCardChapterIds([]);
    setSelectedNoteCardColor("yellow");
  };

  const handleCreateNoteCard = () => {
    if (noteCardId || editingNoteCard) {
      if (editingNoteCard) {
        // Update existing note card
        const updatedNoteCard: NoteCard = {
          ...editingNoteCard,
          title: noteCardTitle?.trim() || "", // Use provided title or empty string
          content: noteCardContent.trim(),
          linkedIdeaIds: selectedIdeaIds,
          linkedCharacterIds: selectedCharacterIds,
          linkedChapterIds: selectedNoteCardChapterIds,
          color: selectedNoteCardColor,
        };

        const updatedNoteCards = noteCards.map((noteCard) =>
          noteCard.id === editingNoteCard.id ? updatedNoteCard : noteCard
        );
        setNoteCards(updatedNoteCards);

        // Store in localStorage
        if (session?.user?.email) {
          const storageKey = getStorageKey(
            "notecards",
            book.id,
            session.user.email,
            isQuickStoryMode
          );
          localStorage.setItem(storageKey, JSON.stringify(updatedNoteCards));
        }

        // Add to recent activity for note card modification
        addToRecentActivity(
          "notecard",
          updatedNoteCard.title || "Untitled",
          "modified"
        );
      } else if (noteCardId) {
        // Create new note card (only if noteCardId exists)
        const newNoteCard: NoteCard = {
          id: noteCardId, // Use the pre-generated ID
          title: noteCardTitle?.trim() || "", // Use empty string if no title provided
          content: noteCardContent.trim(),
          linkedIdeaIds: selectedIdeaIds,
          linkedCharacterIds: selectedCharacterIds,
          linkedChapterIds: selectedNoteCardChapterIds,
          createdAt: new Date(),
          color: selectedNoteCardColor,
        };

        const updatedNoteCards = [...noteCards, newNoteCard];
        setNoteCards(updatedNoteCards);

        // Store in localStorage
        if (session?.user?.email) {
          const storageKey = getStorageKey(
            "notecards",
            book.id,
            session.user.email,
            isQuickStoryMode
          );
          localStorage.setItem(storageKey, JSON.stringify(updatedNoteCards));
        }

        // Add to recent activity
        addToRecentActivity(
          "notecard",
          newNoteCard.title || "Untitled",
          "created"
        );
      }

      handleCreateNoteCardModalClose();
    }
  };

  const handleEditNoteCard = (noteCard: NoteCard) => {
    setEditingNoteCard(noteCard);
    setNoteCardContent(noteCard.content);
    setNoteCardTitle(noteCard.title);
    setNoteCardId(noteCard.id); // Set the existing ID for editing
    setSelectedIdeaIds(noteCard.linkedIdeaIds || []);
    setSelectedCharacterIds(noteCard.linkedCharacterIds || []);
    setSelectedNoteCardChapterIds(noteCard.linkedChapterIds || []);
    setSelectedNoteCardColor(noteCard.color || "yellow");
    setCreateNoteCardModalOpen(true);
  };

  // Note Card Menu Handlers
  const handleNoteCardMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    noteCardId: string
  ) => {
    event.stopPropagation();
    setNoteCardMenuAnchorEl(event.currentTarget);
    setSelectedNoteCardForMenu(noteCardId);
  };

  const handleNoteCardMenuClose = () => {
    setNoteCardMenuAnchorEl(null);
    setSelectedNoteCardForMenu(null);
  };

  const handleNoteCardMenuIncludeIdea = () => {
    if (selectedNoteCardForMenu) {
      // Find the note card and set it for editing to include ideas
      const noteCard = noteCards.find(
        (nc) => nc.id === selectedNoteCardForMenu
      );
      if (noteCard) {
        setEditingNoteCard(noteCard);
        setNoteCardContent(noteCard.content);
        setNoteCardTitle(noteCard.title);
        setSelectedIdeaIds(noteCard.linkedIdeaIds || []);
        setSelectedCharacterIds(noteCard.linkedCharacterIds || []);
        setSelectedNoteCardChapterIds(noteCard.linkedChapterIds || []);
        setSelectedNoteCardColor(noteCard.color || "yellow");
        setCreateNoteCardModalOpen(true);
      }
    }
    handleNoteCardMenuClose();
  };

  const handleNoteCardMenuIncludeCharacter = () => {
    if (selectedNoteCardForMenu) {
      // Find the note card and set it for editing to include characters
      const noteCard = noteCards.find(
        (nc) => nc.id === selectedNoteCardForMenu
      );
      if (noteCard) {
        setEditingNoteCard(noteCard);
        setNoteCardContent(noteCard.content);
        setNoteCardTitle(noteCard.title);
        setSelectedIdeaIds(noteCard.linkedIdeaIds || []);
        setSelectedCharacterIds(noteCard.linkedCharacterIds || []);
        setSelectedNoteCardChapterIds(noteCard.linkedChapterIds || []);
        setSelectedNoteCardColor(noteCard.color || "yellow");
        setCreateNoteCardModalOpen(true);
      }
    }
    handleNoteCardMenuClose();
  };

  const handleNoteCardMenuIncludeChapter = () => {
    if (selectedNoteCardForMenu) {
      // Find the note card and set it for editing to include chapters
      const noteCard = noteCards.find(
        (nc) => nc.id === selectedNoteCardForMenu
      );
      if (noteCard) {
        setEditingNoteCard(noteCard);
        setNoteCardContent(noteCard.content);
        setNoteCardTitle(noteCard.title);
        setSelectedIdeaIds(noteCard.linkedIdeaIds || []);
        setSelectedCharacterIds(noteCard.linkedCharacterIds || []);
        setSelectedNoteCardChapterIds(noteCard.linkedChapterIds || []);
        setSelectedNoteCardColor(noteCard.color || "yellow");
        setCreateNoteCardModalOpen(true);
      }
    }
    handleNoteCardMenuClose();
  };

  const handleNoteCardMenuDelete = () => {
    if (selectedNoteCardForMenu) {
      handleDeleteNoteCard(selectedNoteCardForMenu);
    }
    handleNoteCardMenuClose();
  };

  const handleNoteCardColorChange = (
    color: "yellow" | "red" | "blue" | "green" | "gray"
  ) => {
    if (selectedNoteCardForMenu) {
      const updatedNoteCards = noteCards.map((noteCard) =>
        noteCard.id === selectedNoteCardForMenu
          ? { ...noteCard, color }
          : noteCard
      );
      setNoteCards(updatedNoteCards);

      // Update localStorage
      if (session?.user?.email) {
        const storageKey = getStorageKey(
          "notecards",
          book.id,
          session.user.email,
          isQuickStoryMode
        );
        localStorage.setItem(storageKey, JSON.stringify(updatedNoteCards));
      }

      // Add to recent activity
      const noteCard = noteCards.find(
        (nc) => nc.id === selectedNoteCardForMenu
      );
      addToRecentActivity(
        "notecard",
        noteCard?.title || "Untitled",
        "modified"
      );
    }
    handleNoteCardMenuClose();
  };

  const handleDeleteNoteCard = (
    noteCardId: string,
    event?: React.MouseEvent
  ) => {
    event?.stopPropagation(); // Prevent triggering the edit handler

    // Find the note card to get its title for activity tracking
    const noteCardToDelete = noteCards.find(
      (noteCard) => noteCard.id === noteCardId
    );

    // Remove note card from state
    const updatedNoteCards = noteCards.filter(
      (noteCard) => noteCard.id !== noteCardId
    );
    setNoteCards(updatedNoteCards);

    // Update localStorage
    if (session?.user?.email) {
      const storageKey = getStorageKey(
        "notecards",
        book.id,
        session.user.email,
        isQuickStoryMode
      );
      localStorage.setItem(storageKey, JSON.stringify(updatedNoteCards));
    }

    // Add to recent activity if note card was found
    if (noteCardToDelete) {
      addToRecentActivity(
        "notecard",
        noteCardToDelete.title || "Untitled",
        "deleted"
      );
    }
  };

  const handleRemoveIdeaFromNoteCard = (
    noteCardId: string,
    ideaId: string,
    event: React.MouseEvent
  ) => {
    event.stopPropagation();

    const updatedNoteCards = noteCards.map((noteCard) =>
      noteCard.id === noteCardId
        ? {
            ...noteCard,
            linkedIdeaIds: noteCard.linkedIdeaIds.filter((id) => id !== ideaId),
          }
        : noteCard
    );
    setNoteCards(updatedNoteCards);

    // Update localStorage
    if (session?.user?.email) {
      const storageKey = getStorageKey(
        "notecards",
        book.id,
        session.user.email,
        isQuickStoryMode
      );
      localStorage.setItem(storageKey, JSON.stringify(updatedNoteCards));
    }
  };

  const handleRemoveCharacterFromNoteCard = (
    noteCardId: string,
    characterId: string,
    event: React.MouseEvent
  ) => {
    event.stopPropagation();

    const updatedNoteCards = noteCards.map((noteCard) =>
      noteCard.id === noteCardId
        ? {
            ...noteCard,
            linkedCharacterIds: noteCard.linkedCharacterIds.filter(
              (id) => id !== characterId
            ),
          }
        : noteCard
    );
    setNoteCards(updatedNoteCards);

    // Update localStorage
    if (session?.user?.email) {
      const storageKey = getStorageKey(
        "notecards",
        book.id,
        session.user.email,
        isQuickStoryMode
      );
      localStorage.setItem(storageKey, JSON.stringify(updatedNoteCards));
    }
  };

  const handleRemoveChapterFromNoteCard = (
    noteCardId: string,
    chapterId: string,
    event: React.MouseEvent
  ) => {
    event.stopPropagation();

    const updatedNoteCards = noteCards.map((noteCard) =>
      noteCard.id === noteCardId
        ? {
            ...noteCard,
            linkedChapterIds: noteCard.linkedChapterIds.filter(
              (id) => id !== chapterId
            ),
          }
        : noteCard
    );
    setNoteCards(updatedNoteCards);

    // Update localStorage
    if (session?.user?.email) {
      const storageKey = getStorageKey(
        "notecards",
        book.id,
        session.user.email,
        isQuickStoryMode
      );
      localStorage.setItem(storageKey, JSON.stringify(updatedNoteCards));
    }
  };

  const handleInlineEditStart = (
    noteCard: NoteCard,
    event: React.MouseEvent
  ) => {
    event.stopPropagation(); // Prevent triggering the card click
    setInlineEditingNoteCardId(noteCard.id);
    setInlineEditContent(noteCard.content);
  };

  const handleInlineEditSave = (noteCardId: string) => {
    const updatedNoteCards = noteCards.map((noteCard) =>
      noteCard.id === noteCardId
        ? { ...noteCard, content: inlineEditContent.trim() }
        : noteCard
    );
    setNoteCards(updatedNoteCards);

    // Update localStorage
    if (session?.user?.email) {
      const storageKey = getStorageKey(
        "notecards",
        book.id,
        session.user.email,
        isQuickStoryMode
      );
      localStorage.setItem(storageKey, JSON.stringify(updatedNoteCards));
    }

    // Add to recent activity
    const noteCard = noteCards.find((nc) => nc.id === inlineEditingNoteCardId);
    addToRecentActivity("notecard", noteCard?.title || "Untitled", "modified");

    // Exit editing mode
    setInlineEditingNoteCardId(null);
    setInlineEditContent("");
  };

  const handleInlineEditCancel = () => {
    setInlineEditingNoteCardId(null);
    setInlineEditContent("");
  };

  const handleInlineEditKeyDown = (
    event: React.KeyboardEvent,
    noteCardId: string
  ) => {
    if (event.key === "Enter" && event.ctrlKey) {
      handleInlineEditSave(noteCardId);
    } else if (event.key === "Escape") {
      handleInlineEditCancel();
    }
  };

  const handleImportFile = async () => {
    if (!selectedFile || !importTitle.trim()) return;

    try {
      let content = "";

      if (selectedFile.type === "text/plain") {
        // Handle text files
        content = await selectedFile.text();
      } else if (selectedFile.name.endsWith(".docx")) {
        // Handle DOCX files using mammoth.js
        try {
          const arrayBuffer = await selectedFile.arrayBuffer();
          const result = await mammoth.extractRawText({ arrayBuffer });
          content = result.value;

          if (!content || content.trim().length === 0) {
            throw new Error("No text content found in DOCX file");
          }

          // Log any messages from mammoth (warnings, etc.)
          if (result.messages && result.messages.length > 0) {
            console.log("Mammoth messages:", result.messages);
          }
        } catch (error) {
          console.error("DOCX parsing error:", error);
          alert(
            "Could not extract text from DOCX file. The file may be corrupted or password-protected. Please try saving it as a new DOCX file or convert to .txt format."
          );
          return;
        }
      } else {
        alert("Please select a .txt or .docx file");
        return;
      }

      // Convert plain text to Quill delta format
      const delta = {
        ops: [
          {
            insert: content + "\n",
          },
        ],
      };

      const newItem = {
        id: Date.now().toString(),
        title: importTitle.trim(),
        content: JSON.stringify(delta),
        createdAt: new Date(),
      };

      // Add to appropriate storage based on type
      if (importType === "story") {
        const updatedStories = [...stories, newItem as Story];
        setStories(updatedStories);
        if (session?.user?.email) {
          const storageKey = getStorageKey(
            "stories",
            book.id,
            session.user.email,
            isQuickStoryMode
          );
          localStorage.setItem(storageKey, JSON.stringify(updatedStories));
        }
        addToRecentActivity("story", newItem.title, "created");
      } else if (importType === "chapter") {
        const updatedChapters = [...chapters, newItem as Chapter];
        setChapters(updatedChapters);
        if (session?.user?.email) {
          const storageKey = getStorageKey(
            "chapters",
            book.id,
            session.user.email,
            isQuickStoryMode
          );
          localStorage.setItem(storageKey, JSON.stringify(updatedChapters));
        }
        addToRecentActivity("chapter", newItem.title, "created");
      } else if (importType === "outline") {
        const updatedOutlines = [...outlines, newItem as Outline];
        setOutlines(updatedOutlines);
        if (session?.user?.email) {
          const storageKey = getStorageKey(
            "outlines",
            book.id,
            session.user.email,
            isQuickStoryMode
          );
          localStorage.setItem(storageKey, JSON.stringify(updatedOutlines));
        }
        addToRecentActivity("outline", newItem.title, "created");
      }

      handleImportFileModalClose();
    } catch (error) {
      console.error("Error importing file:", error);
      alert("Error importing file. Please try again.");
    }
  };

  const getDaysSinceBookCreation = () => {
    if (!book?.createdAt) return 0;
    const createdDate = new Date(book.createdAt);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - createdDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getCharacterStyling = (gender: string) => {
    switch (gender.toLowerCase()) {
      case "male":
        return {
          backgroundColor: "rgba(59, 130, 246, 0.1)", // Light blue
          icon: (
            <FaceOutlinedIcon
              sx={{ fontSize: 40, color: "rgb(59, 130, 246)" }}
            />
          ),
        };
      case "female":
        return {
          backgroundColor: "rgba(236, 72, 153, 0.1)", // Light pink
          icon: (
            <FaceOutlinedIcon
              sx={{ fontSize: 40, color: "rgb(236, 72, 153)" }}
            />
          ),
        };
      case "animal":
        return {
          backgroundColor: "rgba(133, 77, 14, 0.1)", // Light brown
          icon: <PetsIcon sx={{ fontSize: 40, color: "rgb(133, 77, 14)" }} />,
        };
      case "other":
        return {
          backgroundColor: "rgba(107, 114, 128, 0.1)", // Light gray
          icon: (
            <TransgenderIcon
              sx={{ fontSize: 40, color: "rgb(107, 114, 128)" }}
            />
          ),
        };
      default:
        return {
          backgroundColor: "rgb(249, 250, 251)", // Default background
          icon: (
            <FaceOutlinedIcon
              sx={{ fontSize: 40, color: "rgb(107, 114, 128)" }}
            />
          ),
        };
    }
  };

  const accordionSections = isQuickStoryMode
    ? []
    : [
        {
          title: "IDEAS",
          content: "Store your creative ideas and inspiration here.",
          icon: (
            <BatchPredictionIcon
              sx={{ fontSize: 24, color: "rgb(107, 114, 128)" }}
            />
          ),
          createHandler: handleCreateIdeaClick,
        },
        {
          title: "CHARACTERS",
          content:
            "Develop your characters, their backgrounds, motivations, and relationships.",
          icon: (
            <FaceOutlinedIcon
              sx={{ fontSize: 24, color: "rgb(107, 114, 128)" }}
            />
          ),
          createHandler: handleCreateCharacterClick,
        },
        {
          title: "OUTLINE",
          content:
            "Structure your story with chapter outlines and plot points.",
          icon: (
            <ListAltIcon sx={{ fontSize: 24, color: "rgb(107, 114, 128)" }} />
          ),
          createHandler: handleCreateOutlineClick,
        },
        // Note: STORIES section is hidden in Book Writing mode (when isQuickStoryMode is false)
        {
          title: "CHAPTERS",
          content: "Create and organize your story chapters...",
          icon: (
            <AutoStoriesIcon
              sx={{ fontSize: 24, color: "rgb(107, 114, 128)" }}
            />
          ),
          createHandler: handleCreateChapterClick,
        },
        {
          title: "PARTS",
          content:
            "Organize your story into parts. Parts are made up of chapters or multiple stories.",
          icon: (
            <FolderCopyIcon
              sx={{ fontSize: 24, color: "rgb(107, 114, 128)" }}
            />
          ),
          createHandler: handleCreatePartClick,
        },
      ];
  return (
    <div className="h-screen flex relative">
      {/* Column 1: Sidebar with Accordions - overlay */}
      <div
        className="bg-gray-50 border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out fixed left-0 top-0 h-screen z-20"
        style={{
          width: sidebarCollapsed
            ? "65px"
            : sidebarExpandedFromIcon
            ? typeof window !== "undefined" && window.innerWidth < 768
              ? "80vw"
              : "30vw"
            : "300px",
        }}
      >
        {/* Header with Back Button */}
        <div className="p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between">
            {!sidebarCollapsed && (
              <IconButton
                onClick={onBackToBookshelf}
                size="small"
                sx={{
                  color: "rgb(19, 135, 194)",
                  "&:hover": {
                    backgroundColor: "rgba(19, 135, 194, 0.1)",
                  },
                }}
              >
                <ArrowBackIcon />
              </IconButton>
            )}
            <div
              className={`flex items-center gap-1 ${
                sidebarCollapsed ? "flex-col" : ""
              }`}
            >
              {!sidebarCollapsed && (
                <IconButton
                  onClick={handleToggleAllAccordions}
                  size="small"
                  sx={{
                    color: "rgb(107, 114, 128)",
                    "&:hover": {
                      backgroundColor: "rgba(107, 114, 128, 0.1)",
                    },
                    transform: allAccordionsExpanded
                      ? "rotate(180deg)"
                      : "rotate(0deg)",
                    transition: "transform 0.2s ease-in-out",
                  }}
                  title={
                    allAccordionsExpanded
                      ? "Collapse All Sections"
                      : "Expand All Sections"
                  }
                >
                  <KeyboardDoubleArrowDownIcon />
                </IconButton>
              )}
              <IconButton
                onClick={handleToggleSidebar}
                size="small"
                sx={{
                  color: "rgb(107, 114, 128)",
                  "&:hover": {
                    backgroundColor: "rgba(107, 114, 128, 0.1)",
                  },
                  transform: sidebarCollapsed
                    ? "rotate(180deg)"
                    : "rotate(0deg)",
                  transition: "transform 0.2s ease-in-out",
                }}
                title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              >
                <MenuOpenIcon />
              </IconButton>
            </div>
          </div>
        </div>

        {/* Accordion Sections - Full View */}
        {!sidebarCollapsed && (
          <div className="flex flex-col flex-1 min-h-0">
            <div className="flex-1 overflow-y-auto p-1">
              {accordionSections.map((section) => (
                <Accordion
                  key={section.title}
                  disableGutters
                  elevation={0}
                  expanded={expandedAccordions.has(section.title)}
                  onChange={(_, isExpanded) => {
                    const newExpanded = new Set(expandedAccordions);
                    if (isExpanded) {
                      newExpanded.add(section.title);
                    } else {
                      newExpanded.delete(section.title);
                    }
                    setExpandedAccordions(newExpanded);
                    setAllAccordionsExpanded(
                      newExpanded.size === accordionSections.length
                    );
                  }}
                  sx={{
                    "&:before": {
                      display: "none",
                    },
                    borderBottom: "1px solid rgb(229, 231, 235)",
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    sx={{
                      backgroundColor: "transparent",
                      minHeight: "56px",
                      "&.Mui-expanded": {
                        minHeight: "56px",
                      },
                      "& .MuiAccordionSummary-content": {
                        margin: "12px 0",
                        "&.Mui-expanded": {
                          margin: "12px 0",
                        },
                      },
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <IconButton
                        component="span"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (
                            section.title === "IDEAS" &&
                            planType !== "professional" &&
                            ideas.length >= 3
                          ) {
                            setPricingModalOpen(true);
                          } else if (
                            section.title === "CHARACTERS" &&
                            planType !== "professional" &&
                            characters.length >= 3
                          ) {
                            setPricingModalOpen(true);
                          } else if (
                            section.title === "PARTS" &&
                            planType !== "professional"
                          ) {
                            setPricingModalOpen(true);
                          } else if (
                            section.title === "OUTLINE" &&
                            planType !== "professional" &&
                            outlines.length >= 1
                          ) {
                            setPricingModalOpen(true);
                          } else if (
                            section.title === "STORIES" &&
                            planType !== "professional" &&
                            stories.length >= 3
                          ) {
                            setPricingModalOpen(true);
                          } else if (
                            section.title === "CHAPTERS" &&
                            planType !== "professional" &&
                            chapters.length >= 3
                          ) {
                            setPricingModalOpen(true);
                          } else {
                            section.createHandler();
                          }
                        }}
                        sx={{
                          color: "rgb(19, 135, 194)",
                          padding: "2px",
                          "&:hover": {
                            backgroundColor: "rgba(19, 135, 194, 0.1)",
                          },
                        }}
                      >
                        <AddCircleOutlinedIcon sx={{ fontSize: "18px" }} />
                      </IconButton>
                      <Typography
                        sx={{
                          fontFamily: "'Rubik', sans-serif",
                          fontWeight: 500,
                          fontSize: "18px",
                          color: "#1f2937",
                          letterSpacing: "0.5px",
                        }}
                      >
                        {section.title}
                        {(() => {
                          let count = 0;
                          switch (section.title) {
                            case "IDEAS":
                              count = ideas.length;
                              break;
                            case "CHARACTERS":
                              count = characters.length;
                              break;
                            case "OUTLINE":
                              count = outlines.length;
                              break;
                            case "STORIES":
                              count = stories.length;
                              break;
                            case "CHAPTERS":
                              count = chapters.length;
                              break;
                            case "PARTS":
                              count = parts.length;
                              break;
                            default:
                              count = 0;
                          }
                          return count > 0 ? ` / ${count}` : "";
                        })()}
                      </Typography>
                    </div>
                  </AccordionSummary>
                  <AccordionDetails
                    sx={{
                      padding: "16px 24px",
                      backgroundColor: "rgb(249, 250, 251)",
                    }}
                  >
                    {section.title === "IDEAS" && ideas.length > 0 ? (
                      <div className="space-y-3">
                        {ideas.map((idea) => (
                          <div
                            key={idea.id}
                            className="flex items-start gap-3 p-3 bg-white rounded-md border border-gray-200 cursor-pointer hover:bg-gray-50"
                            onClick={() => handleEditIdea(idea)}
                          >
                            <BatchPredictionIcon
                              sx={{
                                fontSize: 40,
                                color: "rgb(107, 114, 128)",
                              }}
                            />
                            <div className="flex-1">
                              <Typography
                                variant="body2"
                                sx={{
                                  fontFamily: "'Rubik', sans-serif",
                                  fontWeight: 500,
                                  fontSize: "14px",
                                  color: "#1f2937",
                                  lineHeight: 1.4,
                                }}
                              >
                                {idea.title.length > 100
                                  ? `${idea.title.substring(0, 100)}...`
                                  : idea.title}
                              </Typography>
                              <div className="flex items-center justify-between">
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontFamily: "'Rubik', sans-serif",
                                    fontWeight: 400,
                                    fontSize: "12px",
                                    color: "rgb(107, 114, 128)",
                                    lineHeight: 1.4,
                                    marginTop: "4px",
                                  }}
                                >
                                  Created:{" "}
                                  {new Date(
                                    idea.createdAt
                                  ).toLocaleDateString()}
                                </Typography>
                                <IconButton
                                  size="small"
                                  onClick={(e) => handleDeleteIdea(idea.id, e)}
                                  sx={{
                                    color: "rgb(156, 163, 175)",
                                    padding: "2px",
                                    "&:hover": {
                                      color: "rgb(239, 68, 68)",
                                      backgroundColor: "rgba(239, 68, 68, 0.1)",
                                    },
                                  }}
                                >
                                  <DeleteOutlinedIcon
                                    sx={{ fontSize: "14px" }}
                                  />
                                </IconButton>
                              </div>
                            </div>
                          </div>
                        ))}
                        {/* Add Professional Feature Chip when at limit */}
                        {planType !== "professional" && ideas.length >= 3 && (
                          <div className="mt-3 flex justify-center">
                            <ProfessionalFeatureChip
                              onClick={() => setPricingModalOpen(true)}
                              size="small"
                              label="Upgrade for Unlimited Ideas"
                            />
                          </div>
                        )}
                      </div>
                    ) : section.title === "CHARACTERS" &&
                      characters.length > 0 ? (
                      <div className="space-y-3">
                        {characters.map((character) => {
                          const styling = getCharacterStyling(character.gender);
                          return (
                            <div
                              key={character.id}
                              className="flex items-start gap-3 p-3 rounded-md border border-gray-200 cursor-pointer hover:opacity-80"
                              style={{
                                backgroundColor: styling.backgroundColor,
                              }}
                              onClick={() => handleEditCharacter(character)}
                            >
                              {character.avatar ? (
                                <Image
                                  src={character.avatar}
                                  alt="Avatar"
                                  width={40}
                                  height={40}
                                  style={{
                                    borderRadius: "50%",
                                    objectFit: "cover",
                                  }}
                                />
                              ) : (
                                styling.icon
                              )}
                              <div className="flex-1">
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontFamily: "'Rubik', sans-serif",
                                    fontWeight: 500,
                                    fontSize: "14px",
                                    color: "#1f2937",
                                    lineHeight: 1.4,
                                  }}
                                >
                                  {character.name}
                                </Typography>
                                {character.gender && (
                                  <div className="flex items-center justify-between">
                                    <Typography
                                      variant="body2"
                                      sx={{
                                        fontFamily: "'Rubik', sans-serif",
                                        fontWeight: 400,
                                        fontSize: "12px",
                                        color: "rgb(107, 114, 128)",
                                        lineHeight: 1.4,
                                        marginTop: "4px",
                                      }}
                                    >
                                      Gender: {character.gender}
                                    </Typography>
                                    <IconButton
                                      size="small"
                                      onClick={(e) =>
                                        handleDeleteCharacter(character.id, e)
                                      }
                                      sx={{
                                        color: "rgb(156, 163, 175)",
                                        padding: "2px",
                                        "&:hover": {
                                          color: "rgb(239, 68, 68)",
                                          backgroundColor:
                                            "rgba(239, 68, 68, 0.1)",
                                        },
                                      }}
                                    >
                                      <DeleteOutlinedIcon
                                        sx={{ fontSize: "14px" }}
                                      />
                                    </IconButton>
                                  </div>
                                )}
                                {!character.gender && (
                                  <div className="flex items-center justify-end mt-1">
                                    <IconButton
                                      size="small"
                                      onClick={(e) =>
                                        handleDeleteCharacter(character.id, e)
                                      }
                                      sx={{
                                        color: "rgb(156, 163, 175)",
                                        padding: "2px",
                                        "&:hover": {
                                          color: "rgb(239, 68, 68)",
                                          backgroundColor:
                                            "rgba(239, 68, 68, 0.1)",
                                        },
                                      }}
                                    >
                                      <DeleteOutlinedIcon
                                        sx={{ fontSize: "14px" }}
                                      />
                                    </IconButton>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                        {/* Add Professional Feature Chip when at limit */}
                        {planType !== "professional" &&
                          characters.length >= 3 && (
                            <div className="mt-3 flex justify-center">
                              <ProfessionalFeatureChip
                                onClick={() => setPricingModalOpen(true)}
                                size="small"
                                label="Upgrade for Unlimited Characters"
                              />
                            </div>
                          )}
                      </div>
                    ) : section.title === "OUTLINE" && outlines.length > 0 ? (
                      <div className="space-y-3">
                        {outlines.map((outline) => (
                          <div
                            key={outline.id}
                            className="flex items-start gap-3 p-3 bg-white rounded-md border border-gray-200 cursor-pointer hover:bg-gray-50"
                            onClick={() => handleEditOutline(outline)}
                          >
                            <ListAltIcon
                              sx={{
                                fontSize: 40,
                                color: "rgb(107, 114, 128)",
                              }}
                            />
                            <div className="flex-1">
                              <Typography
                                variant="body2"
                                sx={{
                                  fontFamily: "'Rubik', sans-serif",
                                  fontWeight: 500,
                                  fontSize: "14px",
                                  color: "#1f2937",
                                  lineHeight: 1.4,
                                }}
                              >
                                {outline.title}
                              </Typography>
                              <div className="flex items-center justify-between">
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontFamily: "'Rubik', sans-serif",
                                    fontWeight: 400,
                                    fontSize: "12px",
                                    color: "rgb(107, 114, 128)",
                                    lineHeight: 1.4,
                                    marginTop: "4px",
                                  }}
                                >
                                  {getItemWordCount(outline.content)} words
                                </Typography>
                                <div className="flex items-center gap-1">
                                  <IconButton
                                    size="small"
                                    onClick={(e) =>
                                      handleDownloadOutline(outline, e)
                                    }
                                    sx={{
                                      color: "rgb(156, 163, 175)",
                                      padding: "2px",
                                      "&:hover": {
                                        color: "rgb(59, 130, 246)",
                                        backgroundColor:
                                          "rgba(59, 130, 246, 0.1)",
                                      },
                                    }}
                                  >
                                    <BrowserUpdatedOutlinedIcon
                                      sx={{ fontSize: "14px" }}
                                    />
                                  </IconButton>
                                  <IconButton
                                    size="small"
                                    onClick={(e) =>
                                      handleDeleteOutline(outline.id, e)
                                    }
                                    sx={{
                                      color: "rgb(156, 163, 175)",
                                      padding: "2px",
                                      "&:hover": {
                                        color: "rgb(239, 68, 68)",
                                        backgroundColor:
                                          "rgba(239, 68, 68, 0.1)",
                                      },
                                    }}
                                  >
                                    <DeleteOutlinedIcon
                                      sx={{ fontSize: "14px" }}
                                    />
                                  </IconButton>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                        {/* Add Professional Feature Chip when at limit */}
                        {planType !== "professional" &&
                          outlines.length >= 1 && (
                            <div className="mt-3 flex justify-center">
                              <ProfessionalFeatureChip
                                onClick={() => setPricingModalOpen(true)}
                                size="small"
                                label="Upgrade for Unlimited Outlines"
                              />
                            </div>
                          )}
                      </div>
                    ) : section.title === "STORIES" && stories.length > 0 ? (
                      <div className="space-y-3">
                        {stories.map((story) => (
                          <div
                            key={story.id}
                            className="flex items-start gap-3 p-3 bg-white rounded-md border border-gray-200 cursor-pointer hover:bg-gray-50"
                            onClick={() => handleEditStory(story)}
                          >
                            <HistoryEduIcon
                              sx={{
                                fontSize: 40,
                                color: "rgb(107, 114, 128)",
                              }}
                            />
                            <div className="flex-1">
                              <Typography
                                variant="body2"
                                sx={{
                                  fontFamily: "'Rubik', sans-serif",
                                  fontWeight: 500,
                                  fontSize: "14px",
                                  color: "#1f2937",
                                  lineHeight: 1.4,
                                }}
                              >
                                {story.title}
                              </Typography>
                              <div className="flex items-center justify-between">
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontFamily: "'Rubik', sans-serif",
                                    fontWeight: 400,
                                    fontSize: "12px",
                                    color: "rgb(107, 114, 128)",
                                    lineHeight: 1.4,
                                    marginTop: "4px",
                                  }}
                                >
                                  {getItemWordCount(story.content)} words
                                </Typography>
                                <div className="flex items-center gap-1">
                                  <IconButton
                                    size="small"
                                    onClick={(e) =>
                                      handleDownloadStory(story, e)
                                    }
                                    sx={{
                                      color: "rgb(156, 163, 175)",
                                      padding: "2px",
                                      "&:hover": {
                                        color: "rgb(59, 130, 246)",
                                        backgroundColor:
                                          "rgba(59, 130, 246, 0.1)",
                                      },
                                    }}
                                  >
                                    <BrowserUpdatedOutlinedIcon
                                      sx={{ fontSize: 16 }}
                                    />
                                  </IconButton>
                                  <IconButton
                                    size="small"
                                    onClick={(e) =>
                                      handleDeleteStory(story.id, e)
                                    }
                                    sx={{
                                      color: "rgb(156, 163, 175)",
                                      padding: "2px",
                                      "&:hover": {
                                        color: "rgb(239, 68, 68)",
                                        backgroundColor:
                                          "rgba(239, 68, 68, 0.1)",
                                      },
                                    }}
                                  >
                                    <DeleteOutlinedIcon sx={{ fontSize: 16 }} />
                                  </IconButton>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                        {/* Add Professional Feature Chip when at limit */}
                        {planType !== "professional" && stories.length >= 3 && (
                          <div className="mt-3 flex justify-center">
                            <ProfessionalFeatureChip
                              onClick={() => setPricingModalOpen(true)}
                              size="small"
                              label="Upgrade for Unlimited Stories"
                            />
                          </div>
                        )}
                      </div>
                    ) : section.title === "CHAPTERS" && chapters.length > 0 ? (
                      <div className="space-y-3">
                        {chapters.map((chapter) => (
                          <div
                            key={chapter.id}
                            className="flex items-start gap-3 p-3 bg-white rounded-md border border-gray-200 cursor-pointer hover:bg-gray-50"
                            onClick={() => handleEditChapter(chapter)}
                          >
                            <AutoStoriesIcon
                              sx={{
                                fontSize: 40,
                                color: "rgb(107, 114, 128)",
                              }}
                            />
                            <div className="flex-1">
                              <Typography
                                variant="body2"
                                sx={{
                                  fontFamily: "'Rubik', sans-serif",
                                  fontWeight: 500,
                                  fontSize: "14px",
                                  color: "#1f2937",
                                  lineHeight: 1.4,
                                }}
                              >
                                {chapter.title}
                              </Typography>
                              <div className="flex items-center justify-between">
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontFamily: "'Rubik', sans-serif",
                                    fontWeight: 400,
                                    fontSize: "12px",
                                    color: "rgb(107, 114, 128)",
                                    lineHeight: 1.4,
                                    marginTop: "4px",
                                  }}
                                >
                                  {getItemWordCount(chapter.content)} words
                                </Typography>
                                <div className="flex items-center gap-1">
                                  <IconButton
                                    size="small"
                                    onClick={(e) =>
                                      handleDownloadChapter(chapter, e)
                                    }
                                    sx={{
                                      color: "rgb(156, 163, 175)",
                                      padding: "2px",
                                      "&:hover": {
                                        color: "rgb(59, 130, 246)",
                                        backgroundColor:
                                          "rgba(59, 130, 246, 0.1)",
                                      },
                                    }}
                                  >
                                    <BrowserUpdatedOutlinedIcon
                                      sx={{ fontSize: "14px" }}
                                    />
                                  </IconButton>
                                  <IconButton
                                    size="small"
                                    onClick={(e) =>
                                      handleDeleteChapter(chapter.id, e)
                                    }
                                    sx={{
                                      color: "rgb(156, 163, 175)",
                                      padding: "2px",
                                      "&:hover": {
                                        color: "rgb(239, 68, 68)",
                                        backgroundColor:
                                          "rgba(239, 68, 68, 0.1)",
                                      },
                                    }}
                                  >
                                    <DeleteOutlinedIcon
                                      sx={{ fontSize: "14px" }}
                                    />
                                  </IconButton>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                        {/* Add Professional Feature Chip when at limit */}
                        {planType !== "professional" &&
                          chapters.length >= 3 && (
                            <div className="mt-3 flex justify-center">
                              <ProfessionalFeatureChip
                                onClick={() => setPricingModalOpen(true)}
                                size="small"
                                label="Upgrade for Unlimited Chapters"
                              />
                            </div>
                          )}

                        {/* Import Story Link - Only show in book writing mode and if there are QuickStories */}
                        {!isQuickStoryMode &&
                          availableQuickStoryContent.length > 0 && (
                            <div className="mt-3 flex justify-center">
                              <div
                                onClick={handleImportStoryClick}
                                className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:text-blue-800 cursor-pointer hover:bg-blue-50 rounded-md transition-colors"
                              >
                                <AutoStoriesIcon sx={{ fontSize: 16 }} />
                                <span className="font-medium">
                                  Import Story
                                </span>
                              </div>
                            </div>
                          )}
                      </div>
                    ) : section.title === "PARTS" && parts.length > 0 ? (
                      <div className="space-y-3">
                        {parts.map((part) => (
                          <div
                            key={part.id}
                            className="flex items-start gap-3 p-3 bg-white rounded-md border border-gray-200 cursor-pointer hover:bg-gray-50"
                            onClick={() => handleEditPart(part)}
                          >
                            <FolderCopyIcon
                              sx={{
                                fontSize: 40,
                                color: "rgb(107, 114, 128)",
                              }}
                            />
                            <div className="flex-1">
                              <Typography
                                variant="body2"
                                sx={{
                                  fontFamily: "'Rubik', sans-serif",
                                  fontWeight: 500,
                                  fontSize: "14px",
                                  color: "#1f2937",
                                  lineHeight: 1.4,
                                }}
                              >
                                {part.title}
                              </Typography>
                              <div className="flex items-center justify-between">
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontFamily: "'Rubik', sans-serif",
                                    fontWeight: 400,
                                    fontSize: "12px",
                                    color: "rgb(107, 114, 128)",
                                    lineHeight: 1.4,
                                    marginTop: "4px",
                                  }}
                                >
                                  Chapters: {(part.chapterIds || []).length},
                                  Stories: {(part.storyIds || []).length}
                                </Typography>
                                <IconButton
                                  size="small"
                                  onClick={(e) => handleDeletePart(part.id, e)}
                                  sx={{
                                    color: "rgb(156, 163, 175)",
                                    padding: "2px",
                                    "&:hover": {
                                      color: "rgb(239, 68, 68)",
                                      backgroundColor: "rgba(239, 68, 68, 0.1)",
                                    },
                                  }}
                                >
                                  <DeleteOutlinedIcon
                                    sx={{ fontSize: "14px" }}
                                  />
                                </IconButton>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-4">
                        {section.title === "IDEAS" ? (
                          <Typography
                            variant="body2"
                            sx={{
                              fontFamily: "'Rubik', sans-serif",
                              fontWeight: 400,
                              fontSize: "13px",
                              color: "rgb(107, 114, 128)",
                              lineHeight: 1.5,
                              textAlign: "center",
                            }}
                          >
                            {planType === "professional"
                              ? `Professional users can create unlimited Ideas. You currently have ${
                                  ideas.length
                                } idea${
                                  ideas.length !== 1 ? "s" : ""
                                }. Store your creative ideas and inspiration here.`
                              : `Freelance users can create 3 Ideas (${ideas.length}/3 used). Store your creative ideas and inspiration here.`}{" "}
                            {planType !== "professional" && (
                              <span
                                onClick={() => setPricingModalOpen(true)}
                                style={{
                                  color: "rgb(19, 135, 194)",
                                  cursor: "pointer",
                                  textDecoration: "underline",
                                }}
                              >
                                Professional plans can create unlimited ideas.
                              </span>
                            )}
                          </Typography>
                        ) : section.title === "CHARACTERS" ? (
                          <Typography
                            variant="body2"
                            sx={{
                              fontFamily: "'Rubik', sans-serif",
                              fontWeight: 400,
                              fontSize: "13px",
                              color: "rgb(107, 114, 128)",
                              lineHeight: 1.5,
                              textAlign: "center",
                            }}
                          >
                            {planType === "professional"
                              ? `Professional users can create unlimited Characters. You currently have ${
                                  characters.length
                                } character${
                                  characters.length !== 1 ? "s" : ""
                                }. Develop your characters, their backgrounds, motivations, and relationships.`
                              : `Freelance users can create 3 Characters (${characters.length}/3 used). Develop your characters, their backgrounds, motivations, and relationships.`}{" "}
                            {planType !== "professional" && (
                              <span
                                onClick={() => setPricingModalOpen(true)}
                                style={{
                                  color: "rgb(19, 135, 194)",
                                  cursor: "pointer",
                                  textDecoration: "underline",
                                }}
                              >
                                Professional plans can create unlimited
                                characters.
                              </span>
                            )}
                          </Typography>
                        ) : section.title === "PARTS" &&
                          planType !== "professional" ? (
                          <>
                            <Typography
                              variant="body2"
                              sx={{
                                fontFamily: "'Rubik', sans-serif",
                                fontWeight: 400,
                                fontSize: "13px",
                                color: "rgb(107, 114, 128)",
                                lineHeight: 1.5,
                                textAlign: "center",
                                mb: 2,
                              }}
                            >
                              Freelances users can not create any Parts.
                              Professional users can create unlimited Parts.
                            </Typography>
                            <ProfessionalFeatureChip
                              label="Upgrade to Professional"
                              onClick={() => setPricingModalOpen(true)}
                              size="small"
                            />
                          </>
                        ) : section.title === "OUTLINE" ? (
                          <Typography
                            variant="body2"
                            sx={{
                              fontFamily: "'Rubik', sans-serif",
                              fontWeight: 400,
                              fontSize: "13px",
                              color: "rgb(107, 114, 128)",
                              lineHeight: 1.5,
                              textAlign: "center",
                            }}
                          >
                            {planType === "professional"
                              ? `Professional users can create unlimited Outlines. You currently have ${
                                  outlines.length
                                } outline${
                                  outlines.length !== 1 ? "s" : ""
                                }. This is where you will quickly describe your chapters. They can be as generic or specific as you wish.`
                              : `Freelance users can create 1 Outline (${outlines.length}/1 used). This is where you will quickly describe your chapters. They can be as generic or specific as you wish.`}{" "}
                            {planType !== "professional" && (
                              <span
                                onClick={() => setPricingModalOpen(true)}
                                style={{
                                  color: "rgb(19, 135, 194)",
                                  cursor: "pointer",
                                  textDecoration: "underline",
                                }}
                              >
                                Professional plans can create unlimited
                                outlines.
                              </span>
                            )}
                          </Typography>
                        ) : section.title === "STORIES" ? (
                          <Typography
                            variant="body2"
                            sx={{
                              fontFamily: "'Rubik', sans-serif",
                              fontWeight: 400,
                              fontSize: "13px",
                              color: "rgb(107, 114, 128)",
                              lineHeight: 1.5,
                              textAlign: "center",
                            }}
                          >
                            {planType === "professional"
                              ? `Professional users can create unlimited Stories. You currently have ${
                                  stories.length
                                } stor${
                                  stories.length !== 1 ? "ies" : "y"
                                }. Write and develop your complete stories here.`
                              : `Freelance users can create 3 Stories (${stories.length}/3 used). Write and develop your complete stories here.`}{" "}
                            {planType !== "professional" && (
                              <span
                                onClick={() => setPricingModalOpen(true)}
                                style={{
                                  color: "rgb(19, 135, 194)",
                                  cursor: "pointer",
                                  textDecoration: "underline",
                                }}
                              >
                                Professional plans can create unlimited stories.
                              </span>
                            )}
                          </Typography>
                        ) : section.title === "CHAPTERS" ? (
                          <>
                            <Typography
                              variant="body2"
                              sx={{
                                fontFamily: "'Rubik', sans-serif",
                                fontWeight: 400,
                                fontSize: "13px",
                                color: "rgb(107, 114, 128)",
                                lineHeight: 1.5,
                                textAlign: "center",
                              }}
                            >
                              {planType === "professional"
                                ? `Professional users can create unlimited Chapters. You currently have ${
                                    chapters.length
                                  } chapter${
                                    chapters.length !== 1 ? "s" : ""
                                  }. Create and organize your story chapters here.`
                                : `Freelance users can create 3 Chapters (${chapters.length}/3 used). Create and organize your story chapters here.`}{" "}
                              {planType !== "professional" && (
                                <span
                                  onClick={() => setPricingModalOpen(true)}
                                  style={{
                                    color: "rgb(19, 135, 194)",
                                    cursor: "pointer",
                                    textDecoration: "underline",
                                  }}
                                >
                                  Professional plans can create unlimited
                                  chapters.
                                </span>
                              )}
                            </Typography>

                            {/* Import Story Link in empty state - Only show in book writing mode and if there are QuickStories */}
                            {!isQuickStoryMode &&
                              availableQuickStoryContent.length > 0 && (
                                <div className="mt-3 flex justify-center">
                                  <div
                                    onClick={handleImportStoryClick}
                                    className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:text-blue-800 cursor-pointer hover:bg-blue-50 rounded-md transition-colors"
                                  >
                                    <AutoStoriesIcon sx={{ fontSize: 16 }} />
                                    <span className="font-medium">
                                      Import Story
                                    </span>
                                  </div>
                                </div>
                              )}
                          </>
                        ) : (
                          <Typography
                            variant="body2"
                            sx={{
                              fontFamily: "'Rubik', sans-serif",
                              fontWeight: 400,
                              fontSize: "13px",
                              color: "rgb(107, 114, 128)",
                              lineHeight: 1.5,
                              textAlign: "center",
                            }}
                          >
                            {section.content}
                          </Typography>
                        )}
                      </div>
                    )}
                  </AccordionDetails>
                </Accordion>
              ))}
            </div>

            {/* Import File Button - Fixed at Bottom */}
            {!isQuickStoryMode && (
              <div className="border-t border-gray-200 p-4">
                <div className="relative">
                  <div
                    className={`flex items-center gap-3 p-3 bg-white rounded-md border border-gray-200 cursor-pointer hover:bg-gray-50 ${
                      planType !== "professional"
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                    onClick={
                      planType === "professional"
                        ? handleImportFileClick
                        : undefined
                    }
                  >
                    <FileUploadOutlinedIcon
                      sx={{
                        fontSize: 24,
                        color:
                          planType === "professional"
                            ? "rgb(19, 135, 194)"
                            : "rgb(156, 163, 175)",
                      }}
                    />
                    <Typography
                      variant="body2"
                      sx={{
                        fontFamily: "'Rubik', sans-serif",
                        fontWeight: 500,
                        fontSize: "14px",
                        color:
                          planType === "professional"
                            ? "#1f2937"
                            : "rgb(156, 163, 175)",
                        lineHeight: 1.4,
                      }}
                    >
                      Import Word® or Text File
                    </Typography>
                  </div>
                  {planType !== "professional" && (
                    <div className="absolute right-2" style={{ top: "-8px" }}>
                      <ProfessionalFeatureChip
                        label="Professional Feature"
                        onClick={() => setPricingModalOpen(true)}
                        size="small"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Collapsed Icon-Only View */}
        {sidebarCollapsed && (
          <div className="flex-1 flex flex-col items-center py-4">
            {/* Back button - show on both mobile and desktop when collapsed */}
            <div className="mb-2">
              <Tooltip
                title="Back to Bookshelf"
                placement="right"
                arrow
                slotProps={{
                  tooltip: {
                    sx: {
                      backgroundColor: "black !important",
                      color: "white !important",
                      fontSize: "16px !important",
                      fontWeight: 200,
                      fontFamily: "'Rubik', sans-serif",
                      padding: "16px !important",
                    },
                  },
                  arrow: {
                    sx: {
                      color: "black !important",
                    },
                  },
                }}
              >
                <IconButton
                  onClick={onBackToBookshelf}
                  size="small"
                  sx={{
                    color: "rgb(19, 135, 194)",
                    "&:hover": {
                      backgroundColor: "rgba(19, 135, 194, 0.1)",
                    },
                  }}
                >
                  <ArrowBackIcon />
                </IconButton>
              </Tooltip>
            </div>

            {accordionSections.map((section) => {
              // Define tooltip text for each section
              const getTooltipText = (title: string) => {
                let count = 0;
                let baseText = "";

                switch (title) {
                  case "IDEAS":
                    count = ideas.length;
                    baseText =
                      "Ideas - Store your creative inspiration and brainstorming notes";
                    break;
                  case "CHARACTERS":
                    count = characters.length;
                    baseText =
                      "Characters - Develop character profiles, backgrounds, and personalities";
                    break;
                  case "OUTLINE":
                    count = outlines.length;
                    baseText =
                      "Outline - Create story structure with chapter outlines and plot points";
                    break;
                  case "STORIES":
                    count = stories.length;
                    baseText =
                      "Stories - Write and develop your complete stories";
                    break;
                  case "CHAPTERS":
                    count = chapters.length;
                    baseText =
                      "Chapters - Create and organize individual story chapters";
                    break;
                  case "PARTS":
                    count = parts.length;
                    baseText =
                      "Parts - Organize your story into larger sections made up of chapters";
                    break;
                  default:
                    return `View ${title.toLowerCase()}`;
                }

                return count > 0 ? `${baseText} (${count})` : baseText;
              };

              return (
                <div key={section.title} className="mb-3">
                  <Tooltip
                    title={getTooltipText(section.title)}
                    placement="right"
                    arrow
                    slotProps={{
                      tooltip: {
                        sx: {
                          backgroundColor: "black !important",
                          color: "white !important",
                          fontSize: "16px !important",
                          fontWeight: 200,
                          fontFamily: "'Rubik', sans-serif",
                          padding: "16px !important",
                          maxWidth: "300px",
                        },
                      },
                      arrow: {
                        sx: {
                          color: "black !important",
                        },
                      },
                    }}
                  >
                    <IconButton
                      onClick={() => {
                        // Expand sidebar to 80% width and expand the clicked accordion
                        setSidebarCollapsed(false);
                        setSidebarExpandedFromIcon(true);
                        const newExpanded = new Set([section.title]);
                        setExpandedAccordions(newExpanded);
                        setAllAccordionsExpanded(false);
                      }}
                      sx={{
                        color: "rgb(107, 114, 128)",
                        padding: "8px",
                        borderRadius: "8px",
                        "&:hover": {
                          backgroundColor: "rgba(107, 114, 128, 0.1)",
                          color: "rgb(19, 135, 194)",
                        },
                      }}
                    >
                      {section.icon}
                    </IconButton>
                  </Tooltip>
                </div>
              );
            })}

            {/* Import File Button - At the bottom */}
            {!isQuickStoryMode && (
              <div className="mt-auto mb-4">
                <Tooltip
                  title="Import File - Upload DOCX or Text files to add to your project"
                  placement="right"
                  arrow
                  slotProps={{
                    tooltip: {
                      sx: {
                        backgroundColor: "black !important",
                        color: "white !important",
                        fontSize: "16px !important",
                        fontWeight: 200,
                        fontFamily: "'Rubik', sans-serif",
                        padding: "16px !important",
                        maxWidth: "300px",
                      },
                    },
                    arrow: {
                      sx: {
                        color: "black !important",
                      },
                    },
                  }}
                >
                  <IconButton
                    onClick={handleImportFileClick}
                    sx={{
                      color: "rgb(107, 114, 128)",
                      padding: "8px",
                      borderRadius: "8px",
                      "&:hover": {
                        backgroundColor: "rgba(107, 114, 128, 0.1)",
                        color: "rgb(19, 135, 194)",
                      },
                    }}
                  >
                    <FileUploadOutlinedIcon sx={{ fontSize: 24 }} />
                  </IconButton>
                </Tooltip>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Column 2: Quill Editor - Full width */}
      <div
        className="w-full flex flex-col transition-all duration-300 ease-in-out"
        style={{
          marginLeft: sidebarCollapsed
            ? "65px"
            : sidebarExpandedFromIcon
            ? typeof window !== "undefined" && window.innerWidth < 768
              ? "80vw"
              : "30vw"
            : "300px",
        }}
      >
        {/* Header with Title */}
        <div
          className="p-4  bg-white flex items-center justify-between"
          style={{ zIndex: 10 }}
        >
          {isEditingChapter || isEditingStory || isEditingOutline ? (
            <>
              <div className="flex items-center gap-3">
                {/* Timer countdown or timer icon */}
                {timerActive ? (
                  <div className="flex items-center gap-2">
                    <div className="text-lg font-bold text-orange-600">
                      {formatTime(timeRemaining)}
                    </div>
                    <IconButton
                      onClick={handleStopTimer}
                      size="small"
                      sx={{
                        color: "rgb(239, 68, 68)",
                        "&:hover": {
                          backgroundColor: "rgba(239, 68, 68, 0.1)",
                        },
                      }}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <IconButton
                      onClick={handleTimerClick}
                      size="small"
                      sx={{
                        color: "rgb(107, 114, 128)",
                        "&:hover": {
                          backgroundColor: "rgba(107, 114, 128, 0.1)",
                        },
                      }}
                    >
                      <TimerOutlinedIcon fontSize="small" />
                    </IconButton>

                    {/* Word Goal Icon */}
                    {wordGoalActive ? (
                      <div className="flex items-center gap-1">
                        <div className="text-sm font-semibold text-green-600">
                          {Math.max(
                            0,
                            currentEditorWordCount - wordGoalStartCount
                          )}{" "}
                          / {selectedWordGoal}
                        </div>
                        <IconButton
                          onClick={handleStopWordGoal}
                          size="small"
                          sx={{
                            color: "rgb(239, 68, 68)",
                            "&:hover": {
                              backgroundColor: "rgba(239, 68, 68, 0.1)",
                            },
                          }}
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </div>
                    ) : (
                      <IconButton
                        onClick={handleWordGoalClick}
                        size="small"
                        sx={{
                          color: "rgb(107, 114, 128)",
                          "&:hover": {
                            backgroundColor: "rgba(107, 114, 128, 0.1)",
                          },
                        }}
                      >
                        <DataSaverOnOutlinedIcon fontSize="small" />
                      </IconButton>
                    )}
                  </div>
                )}

                <Typography
                  variant="body2"
                  sx={{
                    fontFamily: "'Rubik', sans-serif",
                    fontWeight: 400,
                    fontSize: "12px",
                    color: "rgb(107, 114, 128)",
                  }}
                >
                  {currentChapter || currentStory || currentOutline
                    ? `${currentEditorWordCount} Words${
                        lastSaveTime ? ` | Saved at ${lastSaveTime}` : ""
                      }`
                    : lastSaveTime
                    ? `Saved ${lastSaveTime}`
                    : ""}
                </Typography>
              </div>
              <IconButton
                onClick={() => {
                  if (quillInstance && (currentChapter || currentOutline)) {
                    const item = currentChapter || currentOutline;
                    if (item) {
                      const delta = quillInstance.getContents();
                      const updatedItem = {
                        ...item,
                        content: JSON.stringify(delta),
                      };
                      if (currentChapter) {
                        const updatedChapters = chapters.map((ch) =>
                          ch.id === currentChapter.id ? updatedItem : ch
                        );
                        setChapters(updatedChapters);
                        localStorage.setItem(
                          `twain-chapters-${book.id}`,
                          JSON.stringify(updatedChapters)
                        );
                      } else if (currentOutline) {
                        const updatedOutlines = outlines.map((ol) =>
                          ol.id === currentOutline.id ? updatedItem : ol
                        );
                        setOutlines(updatedOutlines);
                        localStorage.setItem(
                          `twain-outlines-${book.id}`,
                          JSON.stringify(updatedOutlines)
                        );
                      }
                    }
                  }
                  setIsEditingChapter(false);
                  setCurrentChapter(null);
                  setIsEditingStory(false);
                  setCurrentStory(null);
                  setIsEditingOutline(false);
                  setCurrentOutline(null);
                  setLastSaveTime(null);
                }}
                sx={{
                  color: "rgb(19, 135, 194)",
                  "&:hover": {
                    backgroundColor: "rgba(19, 135, 194, 0.1)",
                  },
                  display: isQuickStoryMode ? "none" : "inline-flex",
                }}
              >
                <CancelIcon />
              </IconButton>
            </>
          ) : null}
        </div>

        {/* Dashboard Container */}
        <div className="flex-1 relative p-4 bg-white">
          <div
            className={`h-full flex flex-col ${
              isEditingChapter || isEditingStory || isEditingOutline
                ? ""
                : "hidden"
            }`}
          >
            {/* Chapter/Outline Header */}
            {isEditingChapter && currentChapter ? (
              <div className="mb-3 mt-6 text-center">
                <Typography
                  variant="h1"
                  sx={{
                    fontFamily: "'Crimson Text', serif",
                    fontWeight: 700,
                    fontSize: "72px",
                    color: "#1f2937",
                    lineHeight: 1,
                    marginBottom: "0",
                  }}
                >
                  {chapters.findIndex((ch) => ch.id === currentChapter.id) + 1}
                </Typography>
                <Typography
                  variant="h4"
                  sx={{
                    fontFamily: "'Crimson Text', serif",
                    fontWeight: 600,
                    fontSize: "32px",
                    color: "#1f2937",
                    marginBottom: "24px",
                  }}
                >
                  {currentChapter.title}
                </Typography>
              </div>
            ) : isEditingStory && currentStory ? (
              <div className="mb-6 mt-6 text-center">
                <Typography
                  variant="h4"
                  sx={{
                    fontFamily: "'Crimson Text', serif",
                    fontWeight: 600,
                    fontSize: "32px",
                    color: "#1f2937",
                    marginBottom: "24px",
                  }}
                >
                  {currentStory.title}
                </Typography>
              </div>
            ) : isEditingOutline && currentOutline ? (
              <div className="mb-6 mt-6 text-center">
                <Typography
                  variant="h4"
                  sx={{
                    fontFamily: "'Crimson Text', serif",
                    fontWeight: 600,
                    fontSize: "32px",
                    color: "#1f2937",
                    marginBottom: "24px",
                  }}
                >
                  {currentOutline.title}
                </Typography>
              </div>
            ) : null}
            <div ref={quillRef} className="flex-1"></div>
          </div>
          <div
            className={`h-full bg-white rounded-lg p-2 ${
              isEditingChapter || isEditingStory || isEditingOutline
                ? "hidden"
                : ""
            }`}
          >
            {/* Title and Word Count */}
            <div className="text-center mb-8">
              {/* Icon - Book for books, Story for quick stories */}
              <div className="mb-4">
                {isQuickStoryMode ? (
                  <HistoryEduOutlinedIcon
                    sx={{
                      fontSize: 64,
                      color: "rgb(107, 114, 128)",
                    }}
                  />
                ) : (
                  <MenuBookOutlinedIcon
                    sx={{
                      fontSize: 64,
                      color: "rgb(107, 114, 128)",
                    }}
                  />
                )}
              </div>
              <Typography
                variant="h3"
                sx={{
                  fontFamily: "'Crimson Text', serif",
                  fontWeight: 700,
                  fontSize: "36px",
                  color: "#1f2937",
                  marginBottom:
                    book?.isSeries && book?.seriesName ? "4px" : "8px",
                }}
              >
                {book?.title || "Untitled Book"}
              </Typography>
              {!isQuickStoryMode && book?.isSeries && book?.seriesName && (
                <Typography
                  variant="body1"
                  sx={{
                    fontFamily: "'Crimson Text', serif",
                    fontWeight: 500,
                    fontSize: "18px",
                    color: "rgb(75, 85, 99)",
                    marginBottom: "8px",
                  }}
                >
                  {book.seriesName} #{book.seriesNumber}
                </Typography>
              )}
              <Typography
                variant="body1"
                sx={{
                  fontFamily: "'Crimson Text', serif",
                  fontWeight: 600,
                  fontSize: "16px",
                  color: "rgb(107, 114, 128)",
                }}
              >
                A total {totalWordCount.toLocaleString()} words have been
                written and you started this book {getDaysSinceBookCreation()}{" "}
                days ago
              </Typography>
            </div>

            {/* Note Cards */}
            <div className="mb-8 mt-8">
              <div className="mb-4 flex items-center justify-between">
                <Typography
                  variant="h6"
                  sx={{
                    fontFamily: "'Rubik', sans-serif",
                    fontWeight: 600,
                    fontSize: "18px",
                    color: "#1f2937",
                  }}
                >
                  Note & Plot Cards
                </Typography>
                <IconButton
                  onClick={handleCreateNoteCardClick}
                  size="small"
                  disabled={planType !== "professional"}
                  sx={{
                    color:
                      planType !== "professional"
                        ? "rgb(156, 163, 175)"
                        : "rgb(107, 114, 128)",
                    padding: "4px",
                    "&:hover": {
                      color:
                        planType !== "professional"
                          ? "rgb(156, 163, 175)"
                          : "rgb(59, 130, 246)",
                      backgroundColor:
                        planType !== "professional"
                          ? "transparent"
                          : "rgba(59, 130, 246, 0.1)",
                    },
                    "&.Mui-disabled": {
                      color: "rgb(156, 163, 175)",
                    },
                  }}
                >
                  <LibraryAddOutlinedIcon sx={{ fontSize: "20px" }} />
                </IconButton>
              </div>

              {planType !== "professional" ? (
                <div className="text-center w-full">
                  <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                    {/* <div className="flex items-center justify-center mb-3">
                      <LibraryAddOutlinedIcon
                        sx={{
                          fontSize: "48px",
                          color: "#000",
                        }}
                      />
                    </div> */}
                    <Typography
                      variant="body2"
                      sx={{
                        fontFamily: "'Rubik', sans-serif",
                        fontWeight: 400,
                        fontSize: "14px",
                        color: "rgb(107, 114, 128)",
                        mb: 3,
                      }}
                    >
                      Organize your story with visual note cards. Link ideas,
                      characters, and chapters with drag-and-drop functionality.
                      Color-code and reorganize your plot points effortlessly.
                    </Typography>
                    <ProfessionalFeatureChip
                      onClick={() => setPricingModalOpen(true)}
                      size="medium"
                      label="Professional Feature"
                    />
                  </div>
                </div>
              ) : noteCards.length === 0 ? (
                <div className="text-center w-full">
                  <div className="bg-gray-100 p-4 rounded-lg border border-gray-200">
                    <Typography
                      variant="body2"
                      sx={{
                        fontFamily: "'Rubik', sans-serif",
                        fontWeight: 400,
                        fontSize: "14px",
                        color: "rgb(107, 114, 128)",
                      }}
                    >
                      No note cards yet. Create your first note card to get
                      organized!
                    </Typography>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full">
                  {noteCards.map((noteCard: NoteCard) => (
                    <div
                      key={noteCard.id}
                      className={`${getNoteCardColorClasses(noteCard.color)} ${
                        dragOverNoteCardId === noteCard.id
                          ? "ring-2 ring-blue-400 ring-opacity-50"
                          : ""
                      } ${
                        draggedNoteCardId === noteCard.id ? "opacity-50" : ""
                      }`}
                      draggable
                      onDragStart={(e) =>
                        handleNoteCardDragStart(e, noteCard.id)
                      }
                      onDragOver={(e) => handleNoteCardDragOver(e, noteCard.id)}
                      onDragLeave={handleNoteCardDragLeave}
                      onDrop={(e) => handleNoteCardDrop(e, noteCard.id)}
                      onDragEnd={handleNoteCardDragEnd}
                      onClick={(e) => {
                        // Only open modal if not inline editing and not clicking on linked items
                        if (
                          inlineEditingNoteCardId !== noteCard.id &&
                          !(e.target as HTMLElement).closest(
                            "[data-no-card-click]"
                          )
                        ) {
                          handleEditNoteCard(noteCard);
                        }
                      }}
                    >
                      {/* Menu button in upper right */}
                      <div
                        className="absolute top-2 right-2 mt-1 mr-1"
                        data-no-card-click
                      >
                        <IconButton
                          onClick={(e) =>
                            handleNoteCardMenuOpen(e, noteCard.id)
                          }
                          size="small"
                          sx={{
                            color: noteCard.title
                              ? "rgba(255, 255, 255, 0.9)"
                              : "rgba(107, 114, 128, 0.8)",
                            padding: "4px",
                            "&:hover": {
                              color: noteCard.title
                                ? "white"
                                : "rgb(75, 85, 99)",
                              backgroundColor: noteCard.title
                                ? "rgba(0, 0, 0, 0.3)"
                                : "rgba(0, 0, 0, 0.1)",
                            },
                          }}
                        >
                          <MoreHorizOutlinedIcon sx={{ fontSize: "16px" }} />
                        </IconButton>
                      </div>

                      {/* Title section - shown if title exists */}
                      {noteCard.title && (
                        <div
                          className="mb-2 p-2 -mx-2 -mt-2 rounded-lg"
                          style={{
                            backgroundColor:
                              noteCard.color === "yellow"
                                ? "#fbbf24"
                                : noteCard.color === "red"
                                ? "#f87171"
                                : noteCard.color === "blue"
                                ? "#60a5fa"
                                : noteCard.color === "green"
                                ? "#34d399"
                                : "#9ca3af",
                          }}
                        >
                          <Typography
                            variant="subtitle2"
                            sx={{
                              fontFamily: "'Rubik', sans-serif",
                              fontWeight: 600,
                              fontSize: "12px",
                              color: "white",
                              textAlign: "center",
                            }}
                          >
                            {noteCard.title}
                          </Typography>
                        </div>
                      )}

                      <div className="flex-1 overflow-hidden">
                        {inlineEditingNoteCardId === noteCard.id ? (
                          <textarea
                            value={inlineEditContent}
                            onChange={(e) =>
                              setInlineEditContent(e.target.value)
                            }
                            onKeyDown={(e) =>
                              handleInlineEditKeyDown(e, noteCard.id)
                            }
                            onBlur={() => handleInlineEditSave(noteCard.id)}
                            autoFocus
                            className="w-full h-full resize-none border-none outline-none bg-transparent text-gray-600 text-sm leading-relaxed p-0"
                            style={{
                              fontFamily: "'Rubik', sans-serif",
                              fontSize: "14px",
                            }}
                            placeholder="Click to edit content..."
                          />
                        ) : (
                          <div
                            onClick={(e) => handleInlineEditStart(noteCard, e)}
                            className="w-full h-full cursor-text"
                          >
                            <Typography
                              variant="body2"
                              sx={{
                                fontFamily: "'Rubik', sans-serif",
                                fontWeight: 400,
                                fontSize: "14px",
                                color: "rgb(107, 114, 128)",
                                display: "-webkit-box",
                                WebkitLineClamp: 8,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                                wordBreak: "break-word",
                              }}
                            >
                              {noteCard.content || "Click to add content..."}
                            </Typography>
                          </div>
                        )}
                      </div>
                      <div className="mt-2 space-y-1" data-no-card-click>
                        {/* Linked Ideas */}
                        {noteCard.linkedIdeaIds?.map((ideaId) => {
                          const idea = ideas.find((i) => i.id === ideaId);
                          if (!idea) return null;
                          return (
                            <div
                              key={ideaId}
                              className="flex items-center justify-between bg-blue-50 rounded px-2 py-1.5 min-h-[28px]"
                            >
                              <div
                                className="flex items-center gap-1 flex-1 min-w-0 cursor-pointer hover:bg-blue-100 rounded px-1 -mx-1"
                                onClick={() => handleEditIdea(idea)}
                              >
                                <BatchPredictionIcon
                                  sx={{
                                    fontSize: 12,
                                    color: "rgb(59, 130, 246)",
                                  }}
                                />
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontFamily: "'Rubik', sans-serif",
                                    fontSize: "10px",
                                    color: "rgb(59, 130, 246)",
                                    fontWeight: 500,
                                  }}
                                  className="truncate"
                                >
                                  {idea.title}
                                </Typography>
                              </div>
                              <IconButton
                                onClick={(e) =>
                                  handleRemoveIdeaFromNoteCard(
                                    noteCard.id,
                                    ideaId,
                                    e
                                  )
                                }
                                size="small"
                                sx={{
                                  color: "rgb(156, 163, 175)",
                                  padding: "2px",
                                  "&:hover": {
                                    color: "rgb(239, 68, 68)",
                                  },
                                }}
                              >
                                <DeleteOutlinedIcon sx={{ fontSize: "10px" }} />
                              </IconButton>
                            </div>
                          );
                        })}

                        {/* Linked Characters */}
                        {noteCard.linkedCharacterIds?.map((characterId) => {
                          const character = characters.find(
                            (c) => c.id === characterId
                          );
                          if (!character) return null;
                          return (
                            <div
                              key={characterId}
                              className="flex items-center justify-between bg-pink-50 rounded px-2 py-1.5 min-h-[28px]"
                            >
                              <div
                                className="flex items-center gap-1 flex-1 min-w-0 cursor-pointer hover:bg-pink-100 rounded px-1 -mx-1"
                                onClick={() => handleEditCharacter(character)}
                              >
                                <FaceOutlinedIcon
                                  sx={{
                                    fontSize: 12,
                                    color: "rgb(236, 72, 153)",
                                  }}
                                />
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontFamily: "'Rubik', sans-serif",
                                    fontSize: "10px",
                                    color: "rgb(236, 72, 153)",
                                    fontWeight: 500,
                                  }}
                                  className="truncate"
                                >
                                  {character.name}
                                </Typography>
                              </div>
                              <IconButton
                                onClick={(e) =>
                                  handleRemoveCharacterFromNoteCard(
                                    noteCard.id,
                                    characterId,
                                    e
                                  )
                                }
                                size="small"
                                sx={{
                                  color: "rgb(156, 163, 175)",
                                  padding: "2px",
                                  "&:hover": {
                                    color: "rgb(239, 68, 68)",
                                  },
                                }}
                              >
                                <DeleteOutlinedIcon sx={{ fontSize: "10px" }} />
                              </IconButton>
                            </div>
                          );
                        })}

                        {/* Linked Chapters */}
                        {noteCard.linkedChapterIds?.map((chapterId) => {
                          const chapter = chapters.find(
                            (c) => c.id === chapterId
                          );
                          if (!chapter) return null;
                          return (
                            <div
                              key={chapterId}
                              className="flex items-center justify-between bg-purple-50 rounded px-2 py-1.5 min-h-[28px]"
                            >
                              <div
                                className="flex items-center gap-1 flex-1 min-w-0 cursor-pointer hover:bg-purple-100 rounded px-1 -mx-1"
                                onClick={() => handleEditChapter(chapter)}
                              >
                                <MenuBookOutlinedIcon
                                  sx={{
                                    fontSize: 12,
                                    color: "rgb(147, 51, 234)",
                                  }}
                                />
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontFamily: "'Rubik', sans-serif",
                                    fontSize: "10px",
                                    color: "rgb(147, 51, 234)",
                                    fontWeight: 500,
                                  }}
                                  className="truncate"
                                >
                                  {chapter.title}
                                </Typography>
                              </div>
                              <IconButton
                                onClick={(e) =>
                                  handleRemoveChapterFromNoteCard(
                                    noteCard.id,
                                    chapterId,
                                    e
                                  )
                                }
                                size="small"
                                sx={{
                                  color: "rgb(156, 163, 175)",
                                  padding: "2px",
                                  "&:hover": {
                                    color: "rgb(239, 68, 68)",
                                  },
                                }}
                              >
                                <DeleteOutlinedIcon sx={{ fontSize: "10px" }} />
                              </IconButton>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Note Card Menu */}
              <Menu
                anchorEl={noteCardMenuAnchorEl}
                open={Boolean(noteCardMenuAnchorEl)}
                onClose={handleNoteCardMenuClose}
                anchorOrigin={{
                  vertical: "bottom",
                  horizontal: "right",
                }}
                transformOrigin={{
                  vertical: "top",
                  horizontal: "right",
                }}
              >
                {!isQuickStoryMode && (
                  <MenuItem onClick={handleNoteCardMenuIncludeIdea}>
                    <BatchPredictionIcon sx={{ mr: 1, fontSize: 16 }} />
                    Include Idea
                  </MenuItem>
                )}
                {!isQuickStoryMode && (
                  <MenuItem onClick={handleNoteCardMenuIncludeCharacter}>
                    <FaceOutlinedIcon sx={{ mr: 1, fontSize: 16 }} />
                    Include Character
                  </MenuItem>
                )}
                {!isQuickStoryMode && (
                  <MenuItem onClick={handleNoteCardMenuIncludeChapter}>
                    <MenuBookOutlinedIcon sx={{ mr: 1, fontSize: 16 }} />
                    Include Chapter
                  </MenuItem>
                )}
                <MenuItem
                  onClick={handleNoteCardMenuDelete}
                  sx={{ color: "error.main" }}
                >
                  <DeleteOutlinedIcon sx={{ mr: 1, fontSize: 16 }} />
                  Delete Note Card
                </MenuItem>
                {/* Color options */}
                <div
                  style={{
                    padding: "8px 16px",
                    borderTop: "1px solid #e5e7eb",
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: "11px",
                      color: "text.secondary",
                      mb: 1,
                      display: "block",
                    }}
                  >
                    Colors
                  </Typography>
                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      justifyContent: "center",
                    }}
                  >
                    {(["yellow", "red", "blue", "green", "gray"] as const).map(
                      (color) => (
                        <div
                          key={color}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleNoteCardColorChange(color);
                          }}
                          style={{
                            width: "20px",
                            height: "20px",
                            borderRadius: "4px",
                            cursor: "pointer",
                            border: "1px solid #d1d5db",
                            backgroundColor:
                              color === "yellow"
                                ? "#fef3c7"
                                : color === "red"
                                ? "#fecaca"
                                : color === "blue"
                                ? "#bfdbfe"
                                : color === "green"
                                ? "#bbf7d0"
                                : "#f3f4f6",
                            transition: "background-color 0.2s ease-in-out",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor =
                              color === "yellow"
                                ? "#fde68a"
                                : color === "red"
                                ? "#fca5a5"
                                : color === "blue"
                                ? "#93c5fd"
                                : color === "green"
                                ? "#86efac"
                                : "#e5e7eb";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor =
                              color === "yellow"
                                ? "#fef3c7"
                                : color === "red"
                                ? "#fecaca"
                                : color === "blue"
                                ? "#bfdbfe"
                                : color === "green"
                                ? "#bbf7d0"
                                : "#f3f4f6";
                          }}
                        />
                      )
                    )}
                  </div>
                </div>
              </Menu>
            </div>

            {/* Recent Activity */}
            <div className="mb-8 mt-8">
              <div className="mb-4">
                <Typography
                  variant="h6"
                  sx={{
                    fontFamily: "'Rubik', sans-serif",
                    fontWeight: 600,
                    fontSize: "18px",
                    color: "#1f2937",
                  }}
                >
                  Recent Activity
                </Typography>
              </div>
              <div className="space-y-3">
                {recentActivityList
                  .slice(0, 10)
                  .map((activity: RecentActivity) => {
                    // Determine background color based on action
                    const getBackgroundColor = () => {
                      switch (activity.action) {
                        case "created":
                          return "bg-green-50 border-green-200 hover:bg-green-100";
                        case "modified":
                          return "bg-blue-50 border-blue-200 hover:bg-blue-100";
                        case "deleted":
                          return "bg-red-50 border-red-200 hover:bg-red-100";
                        default:
                          return "bg-gray-50 border-gray-200 hover:bg-gray-100";
                      }
                    };

                    // Get action color for the action text
                    const getActionColor = () => {
                      switch (activity.action) {
                        case "created":
                          return "rgb(34, 197, 94)"; // green
                        case "modified":
                          return "rgb(59, 130, 246)"; // blue
                        case "deleted":
                          return "rgb(239, 68, 68)"; // red
                        default:
                          return "rgb(107, 114, 128)"; // gray
                      }
                    };

                    return (
                      <div
                        key={activity.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${getBackgroundColor()}`}
                      >
                        {activity.type === "idea" ? (
                          <BatchPredictionIcon
                            sx={{
                              fontSize: 20,
                              color: "rgb(107, 114, 128)",
                            }}
                          />
                        ) : activity.type === "character" ? (
                          <FaceOutlinedIcon
                            sx={{
                              fontSize: 20,
                              color: "rgb(107, 114, 128)",
                            }}
                          />
                        ) : activity.type === "outline" ? (
                          <ListAltIcon
                            sx={{
                              fontSize: 20,
                              color: "rgb(107, 114, 128)",
                            }}
                          />
                        ) : activity.type === "story" ? (
                          <HistoryEduIcon
                            sx={{
                              fontSize: 20,
                              color: "rgb(107, 114, 128)",
                            }}
                          />
                        ) : activity.type === "chapter" ? (
                          <AutoStoriesIcon
                            sx={{
                              fontSize: 20,
                              color: "rgb(107, 114, 128)",
                            }}
                          />
                        ) : activity.type === "part" ? (
                          <FolderCopyIcon
                            sx={{
                              fontSize: 20,
                              color: "rgb(107, 114, 128)",
                            }}
                          />
                        ) : activity.type === "notecard" ? (
                          <LibraryAddOutlinedIcon
                            sx={{
                              fontSize: 20,
                              color: "rgb(217, 119, 6)", // amber color for note cards
                            }}
                          />
                        ) : (
                          <DescriptionOutlinedIcon
                            sx={{
                              fontSize: 20,
                              color: "rgb(107, 114, 128)",
                            }}
                          />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Typography
                              variant="body2"
                              sx={{
                                fontFamily: "'Rubik', sans-serif",
                                fontWeight: 500,
                                fontSize: "14px",
                                color: getActionColor(),
                                textTransform: "capitalize",
                              }}
                            >
                              {activity.action}
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{
                                fontFamily: "'Rubik', sans-serif",
                                fontWeight: 400,
                                fontSize: "14px",
                                color: "#1f2937",
                              }}
                            >
                              {activity.type === "notecard" && !activity.title
                                ? "Note card"
                                : `${activity.type}: ${activity.title}`}
                            </Typography>
                          </div>
                          <Typography
                            variant="body2"
                            sx={{
                              fontFamily: "'Rubik', sans-serif",
                              fontWeight: 400,
                              fontSize: "12px",
                              color: "rgb(107, 114, 128)",
                              marginTop: "2px",
                            }}
                          >
                            {formatActivityTimestamp(activity.timestamp)}
                          </Typography>
                        </div>
                        <IconButton
                          onClick={(e) =>
                            handleDeleteActivityEntry(activity.id, e)
                          }
                          size="small"
                          sx={{
                            color: "rgb(156, 163, 175)",
                            padding: "4px",
                            "&:hover": {
                              color: "rgb(239, 68, 68)",
                              backgroundColor: "rgba(239, 68, 68, 0.1)",
                            },
                          }}
                        >
                          <DeleteOutlinedIcon sx={{ fontSize: "16px" }} />
                        </IconButton>
                      </div>
                    );
                  })}
                {recentActivityList.length === 0 && (
                  <div className="text-center">
                    <div className="bg-gray-100 p-4 rounded-lg border border-gray-200">
                      <Typography
                        variant="body2"
                        sx={{
                          fontFamily: "'Rubik', sans-serif",
                          fontWeight: 400,
                          fontSize: "14px",
                          color: "rgb(107, 114, 128)",
                        }}
                      >
                        No recent activity. Start by creating your first idea or
                        character!
                      </Typography>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Column 3: Reserved for future features */}
        <div className="w-0">
          {/* This column is ready for future expansion */}
        </div>

        {/* Create Idea Modal */}
        <Modal
          open={createIdeaModalOpen}
          onClose={handleCreateIdeaModalClose}
          aria-labelledby="create-idea-modal-title"
        >
          <Box
            sx={{
              position: "absolute",
              top: { xs: 0, sm: "50%" },
              left: { xs: 0, sm: "50%" },
              transform: { xs: "none", sm: "translate(-50%, -50%)" },
              width: { xs: "100%", sm: "75vw" },
              height: { xs: "100vh", sm: "75vh" },
              bgcolor: "background.paper",
              borderRadius: { xs: 0, sm: 3 },
              overflow: "hidden",
              boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
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
                id="create-idea-modal-title"
                variant="h6"
                component="h2"
                sx={{
                  fontFamily: "'Rubik', sans-serif",
                  fontWeight: 600,
                  margin: 0,
                }}
              >
                {editingIdea ? "Edit Idea" : "Create New Idea"}
              </Typography>
              <IconButton
                onClick={handleCreateIdeaModalClose}
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
                p: 4,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-start",
                height: { xs: "calc(100vh - 80px)", sm: "calc(75vh - 80px)" },
                overflow: "auto",
              }}
            >
              <TextField
                fullWidth
                label="Idea Title"
                value={ideaTitle}
                onChange={(e) => setIdeaTitle(e.target.value)}
                variant="outlined"
                sx={{ mb: 3, maxWidth: { xs: "100%", sm: "none" } }}
                autoFocus
              />
              <TextField
                fullWidth
                label="Notes (optional)"
                value={ideaNotes}
                onChange={(e) => setIdeaNotes(e.target.value)}
                variant="outlined"
                multiline
                sx={{
                  mb: 4,
                  maxWidth: { xs: "100%", sm: "none" },
                  flex: 1,
                  "& .MuiOutlinedInput-root": {
                    height: "100%",
                    alignItems: "stretch",
                  },
                  "& .MuiOutlinedInput-input": {
                    height: "100% !important",
                    overflow: "auto !important",
                  },
                }}
              />
              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  justifyContent: "space-between",
                  width: "100%",
                }}
              >
                <Button
                  onClick={handleCreateIdeaModalClose}
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
                  onClick={handleCreateIdea}
                  variant="contained"
                  disabled={!ideaTitle.trim()}
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
                  {editingIdea ? "Update Idea" : "Create Idea"}
                </Button>
              </Box>
            </Box>
          </Box>
        </Modal>

        {/* Create Character Modal */}
        <Modal
          open={createCharacterModalOpen}
          onClose={handleCreateCharacterModalClose}
          aria-labelledby="create-character-modal-title"
        >
          <Box
            sx={{
              position: "absolute",
              top: { xs: 0, sm: "50%" },
              left: { xs: 0, sm: "50%" },
              transform: { xs: "none", sm: "translate(-50%, -50%)" },
              width: { xs: "100%", sm: "75vw" },
              height: { xs: "100vh", sm: "75vh" },
              bgcolor: "background.paper",
              borderRadius: { xs: 0, sm: 3 },
              overflow: "hidden",
              boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
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
                id="create-character-modal-title"
                variant="h6"
                component="h2"
                sx={{
                  fontFamily: "'Rubik', sans-serif",
                  fontWeight: 600,
                  margin: 0,
                }}
              >
                {editingCharacter ? "Edit Character" : "Create New Character"}
              </Typography>
              <IconButton
                onClick={handleCreateCharacterModalClose}
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
                p: 4,
                display: "flex",
                flexDirection: "column",
                height: { xs: "calc(100vh - 80px)", sm: "calc(75vh - 80px)" },
                overflow: "auto",
              }}
            >
              {/* Avatar Upload and Basic Info Row */}
              <Box
                sx={{
                  display: "flex",
                  gap: 3,
                  mb: 3,
                  alignItems: "flex-start",
                }}
              >
                {/* Avatar Upload */}
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    minWidth: "80px",
                  }}
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    style={{ display: "none" }}
                    id="avatar-upload"
                  />
                  <label htmlFor="avatar-upload">
                    <IconButton component="span">
                      {characterAvatar ? (
                        <Image
                          src={characterAvatar}
                          alt="Character Avatar"
                          width={60}
                          height={60}
                          style={{
                            borderRadius: "50%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <FaceOutlinedIcon sx={{ fontSize: 60 }} />
                      )}
                    </IconButton>
                  </label>
                </Box>

                {/* Name and Gender */}
                <Box
                  sx={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                  }}
                >
                  <TextField
                    fullWidth
                    label="Name"
                    value={characterName}
                    onChange={(e) => setCharacterName(e.target.value)}
                    variant="outlined"
                    autoFocus
                  />
                  <FormControl fullWidth>
                    <InputLabel>Gender</InputLabel>
                    <Select
                      value={characterGender}
                      onChange={(e) => setCharacterGender(e.target.value)}
                      label="Gender"
                    >
                      <MenuItem value="">
                        <em>Select Gender</em>
                      </MenuItem>
                      <MenuItem value="Male">Male</MenuItem>
                      <MenuItem value="Female">Female</MenuItem>
                      <MenuItem value="Animal">Animal</MenuItem>
                      <MenuItem value="Other">Other</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </Box>

              {/* Character Details in 2 columns for larger screens */}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                  gap: 3,
                  flex: 1,
                  mb: 3,
                }}
              >
                <TextField
                  fullWidth
                  label="Backstory"
                  value={characterBackstory}
                  onChange={(e) => setCharacterBackstory(e.target.value)}
                  variant="outlined"
                  multiline
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      height: "100%",
                      alignItems: "stretch",
                    },
                    "& .MuiOutlinedInput-input": {
                      height: "100% !important",
                      overflow: "auto !important",
                    },
                  }}
                />
                <TextField
                  fullWidth
                  label="Characterization (Personality, Traits, motivations, etc)"
                  value={characterCharacterization}
                  onChange={(e) => setCharacterCharacterization(e.target.value)}
                  variant="outlined"
                  multiline
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      height: "100%",
                      alignItems: "stretch",
                    },
                    "& .MuiOutlinedInput-input": {
                      height: "100% !important",
                      overflow: "auto !important",
                    },
                  }}
                />
                <TextField
                  fullWidth
                  label="Voice (Speech, vocab, sense of humor, etc)"
                  value={characterVoice}
                  onChange={(e) => setCharacterVoice(e.target.value)}
                  variant="outlined"
                  multiline
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      height: "100%",
                      alignItems: "stretch",
                    },
                    "& .MuiOutlinedInput-input": {
                      height: "100% !important",
                      overflow: "auto !important",
                    },
                  }}
                />
                <TextField
                  fullWidth
                  label="Appearance (Height, weight, build, hair/eye color, etc)"
                  value={characterAppearance}
                  onChange={(e) => setCharacterAppearance(e.target.value)}
                  variant="outlined"
                  multiline
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      height: "100%",
                      alignItems: "stretch",
                    },
                    "& .MuiOutlinedInput-input": {
                      height: "100% !important",
                      overflow: "auto !important",
                    },
                  }}
                />
                <TextField
                  fullWidth
                  label="Friends & Family (Relation to other characters)"
                  value={characterFriendsFamily}
                  onChange={(e) => setCharacterFriendsFamily(e.target.value)}
                  variant="outlined"
                  multiline
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      height: "100%",
                      alignItems: "stretch",
                    },
                    "& .MuiOutlinedInput-input": {
                      height: "100% !important",
                      overflow: "auto !important",
                    },
                  }}
                />
                <TextField
                  fullWidth
                  label="Favorites (sport, food, animal, music, etc)"
                  value={characterFavorites}
                  onChange={(e) => setCharacterFavorites(e.target.value)}
                  variant="outlined"
                  multiline
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      height: "100%",
                      alignItems: "stretch",
                    },
                    "& .MuiOutlinedInput-input": {
                      height: "100% !important",
                      overflow: "auto !important",
                    },
                  }}
                />
              </Box>

              {/* Misc field spans full width */}
              <TextField
                fullWidth
                label="Misc (title, religion, etc)"
                value={characterMisc}
                onChange={(e) => setCharacterMisc(e.target.value)}
                variant="outlined"
                multiline
                rows={2}
                sx={{ mb: 3 }}
              />
              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  justifyContent: "space-between",
                  width: "100%",
                }}
              >
                <Button
                  onClick={handleCreateCharacterModalClose}
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
                  onClick={handleCreateCharacter}
                  variant="contained"
                  disabled={!characterName.trim()}
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
                  {editingCharacter ? "Update Character" : "Create Character"}
                </Button>
              </Box>
            </Box>
          </Box>
        </Modal>

        {/* Create Chapter Modal */}
        <Modal
          open={createChapterModalOpen}
          onClose={handleCreateChapterModalClose}
          aria-labelledby="create-chapter-modal-title"
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
                id="create-chapter-modal-title"
                variant="h6"
                component="h2"
                sx={{
                  fontFamily: "'Rubik', sans-serif",
                  fontWeight: 600,
                  margin: 0,
                }}
              >
                Create New Chapter
              </Typography>
              <IconButton
                onClick={handleCreateChapterModalClose}
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
                p: 4,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: { xs: "calc(100vh - 80px)", sm: "auto" },
              }}
            >
              <TextField
                fullWidth
                label="Chapter Name (optional)"
                value={chapterTitle}
                onChange={(e) => setChapterTitle(e.target.value)}
                variant="outlined"
                sx={{ mb: 4, maxWidth: { xs: "100%", sm: "none" } }}
                autoFocus
              />
              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  justifyContent: "space-between",
                  width: "100%",
                }}
              >
                <Button
                  onClick={handleCreateChapterModalClose}
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
                  onClick={handleCreateChapter}
                  variant="contained"
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
                  Create Chapter
                </Button>
              </Box>
            </Box>
          </Box>
        </Modal>

        {/* Import Story Modal */}
        <Modal
          open={importStoryModalOpen}
          onClose={handleImportStoryModalClose}
          aria-labelledby="import-story-modal-title"
        >
          <Box
            sx={{
              position: "absolute",
              top: { xs: 0, sm: "50%" },
              left: { xs: 0, sm: "50%" },
              transform: { xs: "none", sm: "translate(-50%, -50%)" },
              width: { xs: "100%", sm: 600 },
              height: { xs: "100vh", sm: "auto" },
              maxHeight: { xs: "100vh", sm: "80vh" },
              bgcolor: "background.paper",
              borderRadius: { xs: 0, sm: 3 },
              overflow: "hidden",
              boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
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
                id="import-story-modal-title"
                variant="h6"
                component="h2"
                sx={{
                  fontFamily: "'Rubik', sans-serif",
                  fontWeight: 600,
                  margin: 0,
                }}
              >
                Import Stories as Chapters
              </Typography>
              <IconButton
                onClick={handleImportStoryModalClose}
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
                p: 4,
                display: "flex",
                flexDirection: "column",
                height: { xs: "calc(100vh - 80px)", sm: "auto" },
                minHeight: { xs: "auto", sm: "400px" },
                maxHeight: { xs: "auto", sm: "calc(80vh - 80px)" },
              }}
            >
              <Typography
                variant="body1"
                sx={{
                  fontFamily: "'Rubik', sans-serif",
                  fontSize: "14px",
                  color: "#6b7280",
                  mb: 3,
                  textAlign: "center",
                }}
              >
                Select one or more QuickStories to import as new chapters. Each
                selected story will become a new chapter.
              </Typography>

              {/* Stories list */}
              <Box
                sx={{
                  flex: 1,
                  overflowY: "auto",
                  mb: 3,
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  p: 2,
                }}
              >
                {availableQuickStoryContent.map((story) => (
                  <Box
                    key={story.id}
                    onClick={() => handleStorySelectionForImport(story.id)}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      p: 2,
                      mb: 1,
                      border: "1px solid #e5e7eb",
                      borderRadius: "6px",
                      cursor: "pointer",
                      backgroundColor: selectedStoryIdsForImport.includes(
                        story.id
                      )
                        ? "rgba(59, 130, 246, 0.1)"
                        : "white",
                      borderColor: selectedStoryIdsForImport.includes(story.id)
                        ? "rgb(59, 130, 246)"
                        : "#e5e7eb",
                      "&:hover": {
                        backgroundColor: selectedStoryIdsForImport.includes(
                          story.id
                        )
                          ? "rgba(59, 130, 246, 0.15)"
                          : "#f9fafb",
                      },
                      "&:last-child": {
                        mb: 0,
                      },
                    }}
                  >
                    <Checkbox
                      checked={selectedStoryIdsForImport.includes(story.id)}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleStorySelectionForImport(story.id);
                      }}
                      sx={{
                        mr: 2,
                        color: "rgb(59, 130, 246)",
                        "&.Mui-checked": {
                          color: "rgb(59, 130, 246)",
                        },
                      }}
                    />
                    <AutoStoriesIcon
                      sx={{
                        fontSize: 24,
                        color: "rgb(107, 114, 128)",
                        mr: 2,
                      }}
                    />
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontFamily: "'Rubik', sans-serif",
                          fontWeight: 500,
                          fontSize: "14px",
                          color: "#1f2937",
                          lineHeight: 1.4,
                        }}
                      >
                        {story.title}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          fontFamily: "'Rubik', sans-serif",
                          fontWeight: 400,
                          fontSize: "12px",
                          color: "rgb(107, 114, 128)",
                          lineHeight: 1.4,
                          mt: 0.5,
                        }}
                      >
                        {getItemWordCount(story.content)} words
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>

              {/* Action buttons */}
              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  justifyContent: "space-between",
                  width: "100%",
                }}
              >
                <Button
                  onClick={handleImportStoryModalClose}
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
                  onClick={handleImportStory}
                  variant="contained"
                  disabled={selectedStoryIdsForImport.length === 0}
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
                      backgroundColor: "rgb(156, 163, 175)",
                      boxShadow: "none",
                    },
                  }}
                >
                  <Box sx={{ display: { xs: "block", sm: "none" } }}>
                    Import
                  </Box>
                  <Box sx={{ display: { xs: "none", sm: "block" } }}>
                    Import{" "}
                    {selectedStoryIdsForImport.length > 0
                      ? `${selectedStoryIdsForImport.length} `
                      : ""}
                    Stories as Chapters
                  </Box>
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
              width: { xs: "100%", sm: 500 },
              height: { xs: "100vh", sm: "auto" },
              bgcolor: "background.paper",
              borderRadius: { xs: 0, sm: 3 },
              overflow: "hidden",
              boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
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
            <Box sx={{ p: 4 }}>
              <TextField
                fullWidth
                label="Story Name (optional)"
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

        {/* Create Part Modal */}
        <Modal
          open={createPartModalOpen}
          onClose={handleCreatePartModalClose}
          aria-labelledby="create-part-modal-title"
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
                id="create-part-modal-title"
                variant="h6"
                component="h2"
                sx={{
                  fontFamily: "'Rubik', sans-serif",
                  fontWeight: 600,
                  margin: 0,
                }}
              >
                {editingPart ? "Edit Part" : "Create New Part"}
              </Typography>
              <IconButton
                onClick={handleCreatePartModalClose}
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
                p: 4,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: { xs: "calc(100vh - 80px)", sm: "auto" },
              }}
            >
              <TextField
                fullWidth
                label="Part Title"
                value={partTitle}
                onChange={(e) => setPartTitle(e.target.value)}
                variant="outlined"
                sx={{ mb: 3, maxWidth: { xs: "100%", sm: "none" } }}
                autoFocus
              />
              <FormControl
                fullWidth
                sx={{ mb: 4, maxWidth: { xs: "100%", sm: "none" } }}
              >
                <InputLabel>Select Chapters</InputLabel>
                <Select
                  multiple
                  value={selectedChapterIds}
                  onChange={(event) => {
                    const value = event.target.value;
                    setSelectedChapterIds(
                      typeof value === "string" ? value.split(",") : value
                    );
                  }}
                  renderValue={(selected) =>
                    chapters
                      .filter((chapter) => selected.includes(chapter.id))
                      .map((chapter) => {
                        const chapterNumber =
                          chapters.findIndex((ch) => ch.id === chapter.id) + 1;
                        return `${chapter.title} (Chapter ${chapterNumber})`;
                      })
                      .join(", ")
                  }
                  label="Select Chapters"
                >
                  {chapters
                    .filter(
                      (chapter) =>
                        !parts.some(
                          (part) =>
                            part.id !== editingPart?.id &&
                            (part.chapterIds || []).includes(chapter.id)
                        )
                    )
                    .map((chapter) => {
                      const chapterNumber =
                        chapters.findIndex((ch) => ch.id === chapter.id) + 1;
                      return (
                        <MenuItem key={chapter.id} value={chapter.id}>
                          <Checkbox
                            checked={selectedChapterIds.includes(chapter.id)}
                          />
                          <ListItemText
                            primary={`${chapter.title} (Chapter ${chapterNumber})`}
                          />
                        </MenuItem>
                      );
                    })}
                </Select>
              </FormControl>
              <FormControl
                fullWidth
                sx={{ mb: 4, maxWidth: { xs: "100%", sm: "none" } }}
              >
                <InputLabel>Select QuickStories</InputLabel>
                <Select
                  multiple
                  value={selectedStoryIds}
                  onChange={(event) => {
                    const value = event.target.value;
                    setSelectedStoryIds(
                      typeof value === "string" ? value.split(",") : value
                    );
                  }}
                  renderValue={(selected) =>
                    availableQuickStoryContent
                      .filter((story) => selected.includes(story.id))
                      .map((story) => story.title)
                      .join(", ")
                  }
                  label="Select QuickStories"
                >
                  {availableQuickStoryContent
                    .filter(
                      (story) =>
                        !parts.some(
                          (part) =>
                            part.id !== editingPart?.id &&
                            (part.storyIds || []).includes(story.id)
                        )
                    )
                    .map((story) => (
                      <MenuItem key={story.id} value={story.id}>
                        <Checkbox
                          checked={selectedStoryIds.includes(story.id)}
                        />
                        <ListItemText primary={story.title} />
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  justifyContent: "space-between",
                  width: "100%",
                }}
              >
                <Button
                  onClick={handleCreatePartModalClose}
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
                  onClick={handleCreatePart}
                  variant="contained"
                  disabled={
                    !partTitle.trim() ||
                    (selectedChapterIds.length === 0 &&
                      selectedStoryIds.length === 0)
                  }
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
                  {editingPart ? "Update Part" : "Create Part"}
                </Button>
              </Box>
            </Box>
          </Box>
        </Modal>

        {/* Timer Modal */}
        <Modal
          open={timerModalOpen}
          onClose={handleTimerModalClose}
          aria-labelledby="timer-modal-title"
        >
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: 400,
              bgcolor: "background.paper",
              borderRadius: 3,
              overflow: "hidden",
              boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
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
                id="timer-modal-title"
                variant="h6"
                component="h2"
                sx={{
                  fontFamily: "'Rubik', sans-serif",
                  fontWeight: 600,
                  margin: 0,
                }}
              >
                Writing Timer
              </Typography>
              <IconButton
                onClick={handleTimerModalClose}
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
            <Box sx={{ p: 4 }}>
              <FormControl fullWidth sx={{ mb: 4 }}>
                <InputLabel>Timer Duration</InputLabel>
                <Select
                  value={selectedTimerMinutes}
                  label="Timer Duration"
                  onChange={(e) =>
                    setSelectedTimerMinutes(Number(e.target.value))
                  }
                >
                  <MenuItem value={10}>10 minutes</MenuItem>
                  <MenuItem value={15}>15 minutes</MenuItem>
                  <MenuItem value={20}>20 minutes</MenuItem>
                  <MenuItem value={30}>30 minutes</MenuItem>
                  <MenuItem value={45}>45 minutes</MenuItem>
                  <MenuItem value={60}>60 minutes</MenuItem>
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
                  onClick={handleTimerModalClose}
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
                  onClick={handleStartTimer}
                  variant="contained"
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
                  }}
                >
                  Start Timer
                </Button>
              </Box>
            </Box>
          </Box>
        </Modal>

        {/* Word Goal Modal */}
        <Modal
          open={wordGoalModalOpen}
          onClose={handleWordGoalModalClose}
          aria-labelledby="word-goal-modal-title"
        >
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: 400,
              bgcolor: "background.paper",
              borderRadius: 3,
              overflow: "hidden",
              boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
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
                id="word-goal-modal-title"
                variant="h6"
                component="h2"
                sx={{
                  fontFamily: "'Rubik', sans-serif",
                  fontWeight: 600,
                  margin: 0,
                }}
              >
                Set Word Goal
              </Typography>
              <IconButton
                onClick={handleWordGoalModalClose}
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
            <Box sx={{ p: 4 }}>
              <Typography
                variant="body2"
                sx={{ mb: 3, color: "rgb(107, 114, 128)" }}
              >
                Choose your word count goal for this writing session:
              </Typography>

              <Box sx={{ px: 2, mb: 4 }}>
                <Slider
                  value={selectedWordGoal}
                  onChange={(_, newValue) =>
                    setSelectedWordGoal(newValue as number)
                  }
                  step={null}
                  marks={[
                    { value: 500, label: "500" },
                    { value: 1000, label: "1000" },
                    { value: 1500, label: "1500" },
                    { value: 2000, label: "2000" },
                  ]}
                  min={500}
                  max={2000}
                  valueLabelDisplay="on"
                  valueLabelFormat={(value) => `${value} words`}
                  sx={{
                    color: "rgb(19, 135, 194)",
                    "& .MuiSlider-valueLabelOpen": {
                      transform: "translateY(-100%) scale(1)",
                    },
                  }}
                />
              </Box>

              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  justifyContent: "space-between",
                }}
              >
                <Button
                  onClick={handleWordGoalModalClose}
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
                  onClick={handleStartWordGoal}
                  variant="contained"
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
                  }}
                >
                  Start Goal
                </Button>
              </Box>
            </Box>
          </Box>
        </Modal>

        {/* Congratulations Modal */}
        <Modal
          open={congratulationsModalOpen}
          onClose={handleCongratulationsModalClose}
          aria-labelledby="congratulations-modal-title"
        >
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: 400,
              bgcolor: "background.paper",
              borderRadius: 3,
              overflow: "hidden",
              boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
            }}
          >
            {/* Header */}
            <Box
              sx={{
                backgroundColor: "rgb(34, 197, 94)",
                color: "white",
                p: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Typography
                id="congratulations-modal-title"
                variant="h6"
                component="h2"
                sx={{
                  fontFamily: "'Rubik', sans-serif",
                  fontWeight: 600,
                  margin: 0,
                }}
              >
                🎉 Congratulations!
              </Typography>
              <IconButton
                onClick={handleCongratulationsModalClose}
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
            <Box sx={{ p: 4, textAlign: "center" }}>
              <Typography
                variant="h5"
                sx={{ mb: 2, fontWeight: "bold", color: "rgb(34, 197, 94)" }}
              >
                Goal Achieved!
              </Typography>
              <Typography
                variant="body1"
                sx={{ mb: 3, color: "rgb(107, 114, 128)" }}
              >
                You&apos;ve successfully written {selectedWordGoal} words in
                this session. Great job!
              </Typography>

              <Button
                onClick={handleCongratulationsModalClose}
                variant="contained"
                sx={{
                  backgroundColor: "rgb(34, 197, 94)",
                  textTransform: "none",
                  fontFamily: "'Rubik', sans-serif",
                  py: 1.5,
                  px: 4,
                  boxShadow: "none",
                  "&:hover": {
                    backgroundColor: "rgb(22, 163, 74)",
                    boxShadow: "none",
                  },
                }}
              >
                Continue Writing
              </Button>
            </Box>
          </Box>
        </Modal>

        {/* Import File Modal */}
        <Modal
          open={importFileModalOpen}
          onClose={handleImportFileModalClose}
          aria-labelledby="import-file-modal-title"
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
            }}
          >
            {/* Modal header */}
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
                id="import-file-modal-title"
                variant="h6"
                sx={{
                  fontFamily: "'Rubik', sans-serif",
                  fontWeight: 500,
                }}
              >
                Import File
              </Typography>
              <IconButton
                onClick={handleImportFileModalClose}
                size="small"
                sx={{ color: "white" }}
              >
                <CloseIcon />
              </IconButton>
            </Box>

            {/* Modal content */}
            <Box sx={{ p: 4 }}>
              {/* Light green outlined container with centered icon and label */}
              <Box
                sx={{
                  border: "2px solid #4ade80",
                  borderRadius: 2,
                  p: 4,
                  mb: 3,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  backgroundColor: "rgba(74, 222, 128, 0.05)",
                }}
              >
                <FileUploadOutlinedIcon
                  sx={{
                    fontSize: 48,
                    color: "#16a34a",
                    mb: 2,
                  }}
                />
                <Typography
                  variant="h6"
                  sx={{
                    fontFamily: "'Rubik', sans-serif",
                    fontWeight: 500,
                    color: "#16a34a",
                    mb: 2,
                  }}
                >
                  Import File (DOCX or Text)
                </Typography>

                {/* Custom styled file input */}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Button
                    component="label"
                    variant="outlined"
                    size="small"
                    sx={{
                      color: "#16a34a",
                      borderColor: "#16a34a",
                      fontSize: "12px",
                      px: 2,
                      py: 1,
                      textTransform: "none",
                      fontFamily: "'Rubik', sans-serif",
                      "&:hover": {
                        borderColor: "#15803d",
                        backgroundColor: "rgba(74, 222, 128, 0.1)",
                      },
                    }}
                  >
                    {selectedFile ? selectedFile.name : "Choose File"}
                    <input
                      type="file"
                      accept=".docx,.txt"
                      onChange={handleFileUpload}
                      style={{ display: "none" }}
                    />
                  </Button>
                </Box>
              </Box>

              <TextField
                fullWidth
                label="Title"
                value={importTitle}
                onChange={(e) => setImportTitle(e.target.value)}
                variant="outlined"
                sx={{ mb: 3 }}
              />

              <FormControl fullWidth sx={{ mb: 4 }}>
                <InputLabel>Add To</InputLabel>
                <Select
                  value={importType}
                  label="Add To"
                  onChange={(e) =>
                    setImportType(
                      e.target.value as "story" | "chapter" | "outline"
                    )
                  }
                >
                  <MenuItem value="story">Story</MenuItem>
                  <MenuItem value="chapter">Chapter</MenuItem>
                  <MenuItem value="outline">Outline</MenuItem>
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
                  onClick={handleImportFileModalClose}
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
                  onClick={handleImportFile}
                  variant="contained"
                  disabled={!selectedFile || !importTitle.trim()}
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
                      backgroundColor: "rgba(19, 135, 194, 0.5)",
                    },
                  }}
                >
                  Import
                </Button>
              </Box>
            </Box>
          </Box>
        </Modal>

        {/* Note Card Modal */}
        <Modal
          open={createNoteCardModalOpen}
          onClose={handleCreateNoteCardModalClose}
          aria-labelledby="create-notecard-modal-title"
        >
          <Box
            sx={{
              position: "absolute",
              top: { xs: 0, sm: "50%" },
              left: { xs: 0, sm: "50%" },
              transform: { xs: "none", sm: "translate(-50%, -50%)" },
              width: { xs: "100%", sm: "75vw" },
              height: { xs: "100vh", sm: "75vh" },
              bgcolor: "background.paper",
              borderRadius: { xs: 0, sm: 3 },
              overflow: "hidden",
              boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
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
                justifyContent: "flex-end",
              }}
            >
              <IconButton
                onClick={handleCreateNoteCardModalClose}
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
                p: 4,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-start",
                height: { xs: "calc(100vh - 80px)", sm: "calc(75vh - 80px)" },
                overflow: "auto",
              }}
            >
              {/* Title and Color Selection Row */}
              <Box
                sx={{
                  mb: 3,
                  width: "100%",
                  display: "flex",
                  gap: 2,
                  alignItems: "flex-end",
                }}
              >
                {/* Title Field */}
                <TextField
                  label="Title (optional)"
                  value={noteCardTitle}
                  onChange={(e) => setNoteCardTitle(e.target.value)}
                  variant="outlined"
                  sx={{
                    flex: 1,
                    maxWidth: { xs: "100%", sm: "none" },
                  }}
                />

                {/* Color Selection */}
                <Box sx={{ display: "flex", gap: 1, pb: 1 }}>
                  {(["yellow", "red", "blue", "green", "gray"] as const).map(
                    (color) => (
                      <Box
                        key={color}
                        onClick={() => setSelectedNoteCardColor(color)}
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: 2,
                          cursor: "pointer",
                          border:
                            selectedNoteCardColor === color
                              ? "3px solid #1976d2"
                              : "2px solid #d1d5db",
                          backgroundColor:
                            color === "yellow"
                              ? "#fef3c7"
                              : color === "red"
                              ? "#fecaca"
                              : color === "blue"
                              ? "#bfdbfe"
                              : color === "green"
                              ? "#bbf7d0"
                              : "#f3f4f6",
                          transition: "all 0.2s ease-in-out",
                          "&:hover": {
                            transform: "scale(1.1)",
                            backgroundColor:
                              color === "yellow"
                                ? "#fde68a"
                                : color === "red"
                                ? "#fca5a5"
                                : color === "blue"
                                ? "#93c5fd"
                                : color === "green"
                                ? "#86efac"
                                : "#e5e7eb",
                          },
                        }}
                      />
                    )
                  )}
                </Box>
              </Box>

              <TextField
                fullWidth
                label="Content"
                value={noteCardContent}
                onChange={(e) => setNoteCardContent(e.target.value)}
                variant="outlined"
                multiline
                sx={{
                  mb: 3,
                  maxWidth: { xs: "100%", sm: "none" },
                  flex: 1,
                  "& .MuiOutlinedInput-root": {
                    height: "100%",
                    alignItems: "stretch",
                  },
                  "& .MuiOutlinedInput-input": {
                    height: "100% !important",
                    overflow: "auto !important",
                  },
                }}
              />

              {/* Ideas Selection - Hidden in Story Writer mode */}
              {!isQuickStoryMode && (
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Select Ideas</InputLabel>
                  <Select
                    multiple
                    value={selectedIdeaIds}
                    onChange={(e) =>
                      setSelectedIdeaIds(
                        typeof e.target.value === "string"
                          ? e.target.value.split(",")
                          : e.target.value
                      )
                    }
                    renderValue={(selected) => (
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                        {selected.map((value) => {
                          const idea = ideas.find((i) => i.id === value);
                          return idea ? (
                            <Box
                              key={value}
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 0.5,
                                backgroundColor: "rgba(59, 130, 246, 0.1)",
                                borderRadius: 1,
                                px: 1,
                                py: 0.5,
                              }}
                            >
                              <BatchPredictionIcon
                                sx={{
                                  fontSize: 12,
                                  color: "rgb(59, 130, 246)",
                                }}
                              />
                              <Typography
                                variant="body2"
                                sx={{
                                  fontSize: "12px",
                                  color: "rgb(59, 130, 246)",
                                }}
                              >
                                {idea.title}
                              </Typography>
                            </Box>
                          ) : null;
                        })}
                      </Box>
                    )}
                  >
                    {ideas.map((idea) => (
                      <MenuItem key={idea.id} value={idea.id}>
                        <Checkbox
                          checked={selectedIdeaIds.indexOf(idea.id) > -1}
                        />
                        <ListItemText primary={idea.title} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              {/* Characters Selection - Hidden in Story Writer mode */}
              {!isQuickStoryMode && (
                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel>Select Characters</InputLabel>
                  <Select
                    multiple
                    value={selectedCharacterIds}
                    onChange={(e) =>
                      setSelectedCharacterIds(
                        typeof e.target.value === "string"
                          ? e.target.value.split(",")
                          : e.target.value
                      )
                    }
                    renderValue={(selected) => (
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                        {selected.map((value) => {
                          const character = characters.find(
                            (c) => c.id === value
                          );
                          return character ? (
                            <Box
                              key={value}
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 0.5,
                                backgroundColor: "rgba(236, 72, 153, 0.1)",
                                borderRadius: 1,
                                px: 1,
                                py: 0.5,
                              }}
                            >
                              <FaceOutlinedIcon
                                sx={{
                                  fontSize: 12,
                                  color: "rgb(236, 72, 153)",
                                }}
                              />
                              <Typography
                                variant="body2"
                                sx={{
                                  fontSize: "12px",
                                  color: "rgb(236, 72, 153)",
                                }}
                              >
                                {character.name}
                              </Typography>
                            </Box>
                          ) : null;
                        })}
                      </Box>
                    )}
                  >
                    {characters.map((character) => (
                      <MenuItem key={character.id} value={character.id}>
                        <Checkbox
                          checked={
                            selectedCharacterIds.indexOf(character.id) > -1
                          }
                        />
                        <ListItemText primary={character.name} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              {/* Chapters Selection - Hidden in Story Writer mode */}
              {!isQuickStoryMode && (
                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel>Select Chapters</InputLabel>
                  <Select
                    multiple
                    value={selectedNoteCardChapterIds}
                    onChange={(e) =>
                      setSelectedNoteCardChapterIds(
                        typeof e.target.value === "string"
                          ? e.target.value.split(",")
                          : e.target.value
                      )
                    }
                    renderValue={(selected) => (
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                        {selected.map((value) => {
                          const chapter = chapters.find((c) => c.id === value);
                          return chapter ? (
                            <Box
                              key={value}
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 0.5,
                                backgroundColor: "rgba(147, 51, 234, 0.1)",
                                borderRadius: 1,
                                px: 1,
                                py: 0.5,
                              }}
                            >
                              <MenuBookOutlinedIcon
                                sx={{
                                  fontSize: 12,
                                  color: "rgb(147, 51, 234)",
                                }}
                              />
                              <Typography
                                variant="body2"
                                sx={{
                                  fontSize: "12px",
                                  color: "rgb(147, 51, 234)",
                                }}
                              >
                                {chapter.title}
                              </Typography>
                            </Box>
                          ) : null;
                        })}
                      </Box>
                    )}
                  >
                    {chapters.map((chapter) => (
                      <MenuItem key={chapter.id} value={chapter.id}>
                        <Checkbox
                          checked={
                            selectedNoteCardChapterIds.indexOf(chapter.id) > -1
                          }
                        />
                        <ListItemText primary={chapter.title} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  justifyContent: "space-between",
                  width: "100%",
                }}
              >
                <Button
                  onClick={handleCreateNoteCardModalClose}
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
                  onClick={handleCreateNoteCard}
                  variant="contained"
                  disabled={!editingNoteCard && !noteCardId}
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
                  {editingNoteCard ? "Update Note Card" : "Create Note Card"}
                </Button>
              </Box>
            </Box>
          </Box>
        </Modal>

        {/* Overwrite Confirmation Modal */}
        <Modal
          open={overwriteConfirmModalOpen}
          onClose={handleOverwriteConfirmClose}
          aria-labelledby="overwrite-confirm-modal-title"
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
            }}
          >
            {/* Header */}
            <Box
              sx={{
                backgroundColor: "rgb(239, 68, 68)",
                color: "white",
                p: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Typography
                id="overwrite-confirm-modal-title"
                variant="h6"
                component="h2"
                sx={{
                  fontFamily: "'Rubik', sans-serif",
                  fontWeight: 600,
                  margin: 0,
                }}
              >
                Chapter Name Conflict
              </Typography>
              <IconButton
                onClick={handleOverwriteConfirmClose}
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
                p: 4,
                display: "flex",
                flexDirection: "column",
                minHeight: { xs: "calc(100vh - 80px)", sm: "auto" },
              }}
            >
              <Typography
                variant="body1"
                sx={{
                  fontFamily: "'Rubik', sans-serif",
                  fontSize: "16px",
                  color: "#374151",
                  mb: 3,
                  lineHeight: 1.6,
                }}
              >
                The following stories have the same names as existing chapters:
              </Typography>

              {/* Conflicting chapters list */}
              <Box sx={{ mb: 3, maxHeight: "200px", overflowY: "auto" }}>
                {conflictingChapters.map((conflict, index) => (
                  <Box
                    key={index}
                    sx={{
                      p: 2,
                      mb: 1,
                      border: "1px solid #fca5a5",
                      borderRadius: "6px",
                      backgroundColor: "#fef2f2",
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        fontFamily: "'Rubik', sans-serif",
                        fontWeight: 500,
                        fontSize: "14px",
                        color: "#dc2626",
                      }}
                    >
                      &ldquo;{conflict.story.title}&rdquo;
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        fontFamily: "'Rubik', sans-serif",
                        fontSize: "12px",
                        color: "#6b7280",
                        mt: 0.5,
                      }}
                    >
                      Will overwrite existing chapter with{" "}
                      {getItemWordCount(conflict.existingChapter.content)} words
                    </Typography>
                  </Box>
                ))}
              </Box>

              <Typography
                variant="body2"
                sx={{
                  fontFamily: "'Rubik', sans-serif",
                  fontSize: "14px",
                  color: "#6b7280",
                  mb: 4,
                  textAlign: "center",
                }}
              >
                What would you like to do?
              </Typography>

              {/* Action buttons */}
              <Box
                sx={{
                  display: "flex",
                  flexDirection: { xs: "column", sm: "row" },
                  gap: 2,
                  justifyContent: "space-between",
                  width: "100%",
                }}
              >
                <Button
                  onClick={handleOverwriteConfirmClose}
                  variant="outlined"
                  sx={{
                    flex: { xs: "none", sm: 1 },
                    boxShadow: "none",
                    "&:hover": {
                      boxShadow: "none",
                    },
                  }}
                >
                  Cancel
                </Button>

                {pendingImportStories.length > 0 && (
                  <Button
                    onClick={handleSkipConflicts}
                    variant="contained"
                    sx={{
                      flex: { xs: "none", sm: 1 },
                      backgroundColor: "rgb(107, 114, 128)",
                      textTransform: "none",
                      fontFamily: "'Rubik', sans-serif",
                      py: 1.5,
                      boxShadow: "none",
                      "&:hover": {
                        backgroundColor: "rgb(75, 85, 99)",
                        boxShadow: "none",
                      },
                    }}
                  >
                    Skip Conflicts
                  </Button>
                )}

                <Button
                  onClick={handleConfirmOverwrite}
                  variant="contained"
                  sx={{
                    flex: { xs: "none", sm: 1 },
                    backgroundColor: "rgb(239, 68, 68)",
                    textTransform: "none",
                    fontFamily: "'Rubik', sans-serif",
                    py: 1.5,
                    boxShadow: "none",
                    "&:hover": {
                      backgroundColor: "rgb(220, 38, 38)",
                      boxShadow: "none",
                    },
                  }}
                >
                  Overwrite Chapters
                </Button>
              </Box>
            </Box>
          </Box>
        </Modal>

        {/* Pricing Modal */}
        <TwainStoryPricingModal
          open={pricingModalOpen}
          onClose={handlePricingModalClose}
          onUpgrade={handleUpgrade}
        />
      </div>
    </div>
  );
};

export default TwainStoryWriter;
