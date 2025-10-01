"use client";

import React, { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Button,
  Typography,
  IconButton,
  TextField,
  Chip,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import CheckIcon from "@mui/icons-material/Check";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import PlaylistAddCheckOutlinedIcon from "@mui/icons-material/PlaylistAddCheckOutlined";
import RotateLeftOutlinedIcon from "@mui/icons-material/RotateLeftOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import TwainPageHeader from "@/components/TwainPageHeader";
import TwainPageFooter from "@/components/TwainPageFooter";
import TwainProfileMenu, { UserAvatar } from "@/components/TwainProfileMenu";
import TwainStoryPricingModal from "@/components/TwainStoryPricingModal";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { twainPricingPlans } from "@/data/twainPricingPlans";

// Type definitions
interface SignupRequest {
  id: string;
  name: string;
  email: string;
  status: "pending" | "approved" | "rejected";
  requested_at: string;
  processed_at?: string | null;
  processed_by?: string | null;
  notes?: string | null;
}

interface FeedbackItem {
  id: string;
  timestamp: string;
  type: "bug" | "unexpected-behavior" | "suggestion" | "other";
  area: string;
  subject: string;
  description: string;
  userEmail: string;
  userName: string;
  status: "open" | "archived";
  archivedAt?: string;
}

interface Book {
  id: number;
  title: string;
  wordCount: number;
}

const AccountSettingsPage: React.FC = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const { preferences, planType, isActivePlan, loginInfo, updatePlan } =
    useUserPreferences();

  // State for account settings
  const [aboutAuthor, setAboutAuthor] = useState("");
  const [showPricing, setShowPricing] = useState(false);

  // Admin states
  const [isCurrentUserAdmin, setIsCurrentUserAdmin] = useState(false);
  const [signupRequests, setSignupRequests] = useState<SignupRequest[]>([]);
  const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminMessage, setAdminMessage] = useState("");
  const [adminError, setAdminError] = useState("");
  const [expandedFeedback, setExpandedFeedback] = useState<string | null>(null);
  const [sortField, setSortField] = useState<
    "type" | "area" | "status" | "timestamp" | null
  >(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Mock book and story data (in a real app, these would come from your data source)
  const [books] = useState<Book[]>([]);
  const [quickStories] = useState<Book[]>([]);

  // Initialize about author from local storage (since it's not in preferences yet)
  useEffect(() => {
    const savedAboutAuthor = localStorage.getItem("aboutAuthor");
    if (savedAboutAuthor) {
      setAboutAuthor(savedAboutAuthor);
    }
  }, []);

  // Check if user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!session?.user?.email) {
        setIsCurrentUserAdmin(false);
        return;
      }

      try {
        const response = await fetch("/api/admin/check");
        const data = await response.json();
        setIsCurrentUserAdmin(data.isAdmin || false);
      } catch (error) {
        console.error("Error checking admin status:", error);
        setIsCurrentUserAdmin(false);
      }
    };

    if (session) {
      checkAdminStatus();
    }
  }, [session]);

  // Load admin data when user is admin
  useEffect(() => {
    if (isCurrentUserAdmin) {
      loadSignupRequests();
      loadFeedback();
    }
  }, [isCurrentUserAdmin]);

  // Profile menu handlers
  const handleBackToBookshelf = () => {
    router.push("/twain-story-builder");
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

  const handleLogout = () => {
    signOut();
  };

  // About author handling
  const handleAboutAuthorChange = (value: string) => {
    // Limit to 350 words
    const words = value
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0);

    if (words.length <= 350) {
      setAboutAuthor(value);
      // Save to localStorage since it's not in preferences yet
      localStorage.setItem("aboutAuthor", value);
    }
  };

  // Plan management
  const handleShowPricing = () => {
    setShowPricing(true);
  };

  const handleClosePricing = () => {
    setShowPricing(false);
  };

  const handleUpgradePlan = (newPlan: "freelance" | "professional") => {
    updatePlan({
      type: newPlan,
      startDate: new Date().toISOString(),
      endDate:
        newPlan === "professional"
          ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
          : undefined,
    });
    setShowPricing(false);
  };

  const handleDowngradeToFreelance = () => {
    updatePlan({
      type: "freelance",
      startDate: new Date().toISOString(),
      endDate: undefined,
    });
  };

  // Admin functions
  const loadSignupRequests = async () => {
    try {
      setAdminLoading(true);
      const response = await fetch("/api/signup-requests");
      if (response.ok) {
        const data = await response.json();
        // Handle different possible response structures
        if (Array.isArray(data)) {
          setSignupRequests(data);
        } else if (data.requests && Array.isArray(data.requests)) {
          setSignupRequests(data.requests);
        } else {
          console.warn("Unexpected signup requests data structure:", data);
          setSignupRequests([]);
        }
      } else {
        setSignupRequests([]);
      }
    } catch (error) {
      console.error("Error loading signup requests:", error);
      setAdminError("Failed to load signup requests");
      setSignupRequests([]);
    } finally {
      setAdminLoading(false);
    }
  };

  const loadFeedback = async () => {
    try {
      setAdminLoading(true);
      const response = await fetch("/api/feedback");
      if (response.ok) {
        const data = await response.json();
        // Handle different possible response structures
        if (Array.isArray(data)) {
          setFeedbackItems(data);
        } else if (data.feedback && Array.isArray(data.feedback)) {
          setFeedbackItems(data.feedback);
        } else {
          console.warn("Unexpected feedback data structure:", data);
          setFeedbackItems([]);
        }
      } else {
        setFeedbackItems([]);
      }
    } catch (error) {
      console.error("Error loading feedback:", error);
      setAdminError("Failed to load feedback");
      setFeedbackItems([]);
    } finally {
      setAdminLoading(false);
    }
  };

  const handleSignupRequestAction = async (
    requestId: string,
    action: "approve" | "reject"
  ) => {
    try {
      setAdminLoading(true);
      const response = await fetch("/api/signup-requests", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: requestId,
          action,
          processedBy: session?.user?.email,
        }),
      });

      if (response.ok) {
        setAdminMessage(`Request ${action}d successfully`);
        loadSignupRequests();
        setTimeout(() => setAdminMessage(""), 3000);
      } else {
        setAdminError(`Failed to ${action} request`);
        setTimeout(() => setAdminError(""), 3000);
      }
    } catch (error) {
      console.error(`Error ${action}ing request:`, error);
      setAdminError(`Failed to ${action} request`);
      setTimeout(() => setAdminError(""), 3000);
    } finally {
      setAdminLoading(false);
    }
  };

  const handleArchiveFeedback = async (feedbackId: string) => {
    try {
      setAdminLoading(true);
      const response = await fetch("/api/feedback", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: feedbackId,
          action: "archive",
        }),
      });

      if (response.ok) {
        setAdminMessage("Feedback archived successfully");
        loadFeedback();
        setTimeout(() => setAdminMessage(""), 3000);
      } else {
        setAdminError("Failed to archive feedback");
        setTimeout(() => setAdminError(""), 3000);
      }
    } catch (error) {
      console.error("Error archiving feedback:", error);
      setAdminError("Failed to archive feedback");
      setTimeout(() => setAdminError(""), 3000);
    } finally {
      setAdminLoading(false);
    }
  };

  const handleInProgressFeedback = async (feedbackId: string) => {
    try {
      setAdminLoading(true);
      const response = await fetch("/api/feedback", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: feedbackId,
          action: "in-progress",
        }),
      });

      if (response.ok) {
        setAdminMessage("Feedback marked as in progress");
        loadFeedback();
        setTimeout(() => setAdminMessage(""), 3000);
      } else {
        setAdminError("Failed to update feedback status");
        setTimeout(() => setAdminError(""), 3000);
      }
    } catch (error) {
      console.error("Error updating feedback status:", error);
      setAdminError("Failed to update feedback status");
      setTimeout(() => setAdminError(""), 3000);
    } finally {
      setAdminLoading(false);
    }
  };

  const handleDeleteFeedback = async (feedbackId: string) => {
    try {
      setAdminLoading(true);
      const response = await fetch("/api/feedback", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: feedbackId,
        }),
      });

      if (response.ok) {
        setAdminMessage("Feedback deleted successfully");
        loadFeedback();
        setTimeout(() => setAdminMessage(""), 3000);
      } else {
        setAdminError("Failed to delete feedback");
        setTimeout(() => setAdminError(""), 3000);
      }
    } catch (error) {
      console.error("Error deleting feedback:", error);
      setAdminError("Failed to delete feedback");
      setTimeout(() => setAdminError(""), 3000);
    } finally {
      setAdminLoading(false);
    }
  };

  const handleFeedbackRowClick = (feedbackId: string) => {
    setExpandedFeedback(expandedFeedback === feedbackId ? null : feedbackId);
  };

  const handleSort = (field: "type" | "area" | "status" | "timestamp") => {
    if (sortField === field) {
      // If clicking the same field, toggle direction
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // If clicking a new field, set it and default to ascending
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortedFeedbackItems = () => {
    const openItems = feedbackItems.filter((item) => item.status === "open");

    if (!sortField) return openItems;

    return [...openItems].sort((a, b) => {
      let aValue: string | Date;
      let bValue: string | Date;

      switch (sortField) {
        case "type":
          aValue = a.type;
          bValue = b.type;
          break;
        case "area":
          aValue = a.area;
          bValue = b.area;
          break;
        case "status":
          aValue = a.status;
          bValue = b.status;
          break;
        case "timestamp":
          aValue = new Date(a.timestamp);
          bValue = new Date(b.timestamp);
          break;
        default:
          return 0;
      }

      if (aValue < bValue) {
        return sortDirection === "asc" ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortDirection === "asc" ? 1 : -1;
      }
      return 0;
    });
  };

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Typography>Please sign in to access account settings.</Typography>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header with Profile Menu */}
      <div className="relative">
        <TwainPageHeader
          title="Account Settings"
          subtitle="Manage your account preferences and settings"
          showBackButton={true}
          onBackClick={handleBackToBookshelf}
        />

        {/* Profile Menu - positioned over the header */}
        <TwainProfileMenu
          session={session}
          planType={planType}
          onAbout={handleAbout}
          onHelp={handleHelp}
          onFeedback={handleFeedback}
          onLogout={handleLogout}
        />
      </div>

      {/* Main Content */}
      <main className="flex-1 bg-gray-100 p-4 lg:p-8">
        <div className="w-[95%] lg:w-[60%] mx-auto">
          <div className="space-y-6">
            {/* User Profile Section */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <Typography
                variant="h6"
                sx={{
                  fontFamily: "'Rubik', sans-serif",
                  fontWeight: 600,
                  marginBottom: 3,
                  color: "rgb(31, 41, 55)",
                }}
              >
                Profile Information
              </Typography>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center gap-2">
                      <UserAvatar session={session} />
                    </div>
                    <div>
                      <Typography
                        variant="body1"
                        sx={{
                          fontFamily: "'Rubik', sans-serif",
                          fontWeight: 500,
                          color: "rgb(31, 41, 55)",
                        }}
                      >
                        {session?.user?.name || "Unknown User"}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          fontFamily: "'Rubik', sans-serif",
                          color: "rgb(107, 114, 128)",
                        }}
                      >
                        {session?.user?.email || "No email provided"}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          fontFamily: "'Rubik', sans-serif",
                          color: "rgb(107, 114, 128)",
                          fontStyle: "italic",
                          display: { xs: "none", sm: "block" },
                        }}
                      >
                        A member since{" "}
                        {new Date(
                          preferences.accountCreatedAt
                        ).toLocaleDateString()}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          fontFamily: "'Rubik', sans-serif",
                          color: "rgb(107, 114, 128)",
                          fontSize: "12px",
                        }}
                      >
                        {loginInfo.loginCount} logins • Last seen{" "}
                        {new Date(loginInfo.lastLogin).toLocaleDateString()}
                      </Typography>
                    </div>
                  </div>
                  {/* Mobile: Icon Button, Desktop: Text Button */}
                  <div className="sm:hidden">
                    <IconButton
                      onClick={handleLogout}
                      size="small"
                      sx={{
                        color: "rgb(107, 114, 128)",
                        "&:hover": {
                          color: "rgb(239, 68, 68)",
                          backgroundColor: "rgba(239, 68, 68, 0.04)",
                        },
                      }}
                    >
                      <LogoutOutlinedIcon />
                    </IconButton>
                  </div>
                  <div className="hidden sm:block">
                    <Button
                      onClick={handleLogout}
                      variant="outlined"
                      size="small"
                      sx={{
                        textTransform: "none",
                        fontFamily: "'Rubik', sans-serif",
                        borderColor: "rgb(209, 213, 219)",
                        color: "rgb(107, 114, 128)",
                        "&:hover": {
                          borderColor: "rgb(239, 68, 68)",
                          color: "rgb(239, 68, 68)",
                          backgroundColor: "rgba(239, 68, 68, 0.04)",
                        },
                      }}
                    >
                      Sign Out
                    </Button>
                  </div>
                </div>
              </div>

              {/* About Author Section */}
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
                  About Author
                </Typography>

                <div className="relative">
                  <TextField
                    fullWidth
                    multiline
                    rows={6}
                    value={aboutAuthor}
                    onChange={(e) => handleAboutAuthorChange(e.target.value)}
                    variant="outlined"
                    placeholder="Write a brief biography or description about yourself as an author..."
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        fontFamily: "'Rubik', sans-serif",
                      },
                    }}
                  />

                  {/* Word Counter */}
                  <div className="absolute bottom-3 right-3 text-sm text-gray-500 bg-white px-2 py-1 rounded">
                    <Typography
                      variant="caption"
                      sx={{
                        fontFamily: "'Rubik', sans-serif",
                        color: (() => {
                          const wordCount = aboutAuthor
                            .trim()
                            .split(/\s+/)
                            .filter((word) => word.length > 0).length;
                          return wordCount > 320
                            ? "rgb(248, 113, 113)"
                            : "rgb(107, 114, 128)";
                        })(),
                      }}
                    >
                      {(() => {
                        const wordCount = aboutAuthor
                          .trim()
                          .split(/\s+/)
                          .filter((word) => word.length > 0).length;
                        return aboutAuthor.trim() === ""
                          ? "350 words remaining"
                          : `${350 - wordCount} words remaining`;
                      })()}
                    </Typography>
                  </div>
                </div>
              </div>
            </div>

            {/* Admin Section - Only show for admin users */}
            {isCurrentUserAdmin && (
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <Typography
                  variant="h6"
                  sx={{
                    fontFamily: "'Rubik', sans-serif",
                    fontWeight: 600,
                    marginBottom: 3,
                    color: "rgb(31, 41, 55)",
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <AdminPanelSettingsIcon sx={{ color: "rgb(19, 135, 194)" }} />
                  Admin Panel
                </Typography>

                {/* Admin Messages */}
                {adminMessage && (
                  <Alert
                    severity="success"
                    sx={{ mb: 2, fontFamily: "'Rubik', sans-serif" }}
                  >
                    {adminMessage}
                  </Alert>
                )}

                {adminError && (
                  <Alert
                    severity="error"
                    sx={{ mb: 2, fontFamily: "'Rubik', sans-serif" }}
                  >
                    {adminError}
                  </Alert>
                )}

                {/* Signup Requests Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Typography
                      variant="body1"
                      sx={{
                        fontFamily: "'Rubik', sans-serif",
                        fontWeight: 500,
                        color: "rgb(31, 41, 55)",
                      }}
                    >
                      Signup Requests (
                      {
                        signupRequests.filter((req) => req.status === "pending")
                          .length
                      }{" "}
                      pending)
                    </Typography>
                    <Button
                      onClick={loadSignupRequests}
                      disabled={adminLoading}
                      size="small"
                      sx={{
                        textTransform: "none",
                        fontFamily: "'Rubik', sans-serif",
                      }}
                    >
                      {adminLoading ? "Loading..." : "Refresh"}
                    </Button>
                  </div>

                  {signupRequests.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Typography
                        variant="body2"
                        sx={{ fontFamily: "'Rubik', sans-serif" }}
                      >
                        No signup requests found
                      </Typography>
                    </div>
                  ) : (
                    <TableContainer
                      component={Paper}
                      elevation={0}
                      sx={{ border: "1px solid rgb(229, 231, 235)" }}
                    >
                      <Table size="small">
                        <TableHead>
                          <TableRow
                            sx={{ backgroundColor: "rgb(249, 250, 251)" }}
                          >
                            <TableCell
                              sx={{
                                fontFamily: "'Rubik', sans-serif",
                                fontWeight: 600,
                              }}
                            >
                              Name
                            </TableCell>
                            <TableCell
                              sx={{
                                fontFamily: "'Rubik', sans-serif",
                                fontWeight: 600,
                              }}
                            >
                              Email
                            </TableCell>
                            <TableCell
                              sx={{
                                fontFamily: "'Rubik', sans-serif",
                                fontWeight: 600,
                              }}
                            >
                              Status
                            </TableCell>
                            <TableCell
                              sx={{
                                fontFamily: "'Rubik', sans-serif",
                                fontWeight: 600,
                              }}
                            >
                              Requested
                            </TableCell>
                            <TableCell
                              sx={{
                                fontFamily: "'Rubik', sans-serif",
                                fontWeight: 600,
                              }}
                            >
                              Actions
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {signupRequests.map((request) => (
                            <TableRow key={request.id}>
                              <TableCell
                                sx={{ fontFamily: "'Rubik', sans-serif" }}
                              >
                                {request.name}
                              </TableCell>
                              <TableCell
                                sx={{ fontFamily: "'Rubik', sans-serif" }}
                              >
                                {request.email}
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={request.status}
                                  size="small"
                                  color={
                                    request.status === "pending"
                                      ? "warning"
                                      : request.status === "approved"
                                      ? "success"
                                      : "error"
                                  }
                                  sx={{ fontFamily: "'Rubik', sans-serif" }}
                                />
                              </TableCell>
                              <TableCell
                                sx={{ fontFamily: "'Rubik', sans-serif" }}
                              >
                                {new Date(
                                  request.requested_at
                                ).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                {request.status === "pending" && (
                                  <div className="flex gap-1">
                                    <IconButton
                                      size="small"
                                      onClick={() =>
                                        handleSignupRequestAction(
                                          request.id,
                                          "approve"
                                        )
                                      }
                                      disabled={adminLoading}
                                      sx={{
                                        color: "rgb(34, 197, 94)",
                                        "&:hover": {
                                          backgroundColor:
                                            "rgba(34, 197, 94, 0.1)",
                                        },
                                      }}
                                    >
                                      <CheckIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton
                                      size="small"
                                      onClick={() =>
                                        handleSignupRequestAction(
                                          request.id,
                                          "reject"
                                        )
                                      }
                                      disabled={adminLoading}
                                      sx={{
                                        color: "rgb(239, 68, 68)",
                                        "&:hover": {
                                          backgroundColor:
                                            "rgba(239, 68, 68, 0.1)",
                                        },
                                      }}
                                    >
                                      <CloseRoundedIcon fontSize="small" />
                                    </IconButton>
                                  </div>
                                )}
                                {request.status !== "pending" && (
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      fontFamily: "'Rubik', sans-serif",
                                      color: "rgb(107, 114, 128)",
                                    }}
                                  >
                                    {request.processed_at &&
                                      `${request.status} on ${new Date(
                                        request.processed_at
                                      ).toLocaleDateString()}`}
                                  </Typography>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </div>

                {/* Feedback Management Section */}
                <div className="space-y-4 mt-8">
                  <div className="flex items-center justify-between">
                    <Typography
                      variant="body1"
                      sx={{
                        fontFamily: "'Rubik', sans-serif",
                        fontWeight: 500,
                        color: "rgb(31, 41, 55)",
                      }}
                    >
                      User Feedback (
                      {
                        feedbackItems.filter((item) => item.status === "open")
                          .length
                      }{" "}
                      open)
                    </Typography>
                    <Button
                      onClick={loadFeedback}
                      disabled={adminLoading}
                      size="small"
                      sx={{
                        textTransform: "none",
                        fontFamily: "'Rubik', sans-serif",
                      }}
                    >
                      {adminLoading ? "Loading..." : "Refresh"}
                    </Button>
                  </div>

                  {feedbackItems.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Typography
                        variant="body2"
                        sx={{ fontFamily: "'Rubik', sans-serif" }}
                      >
                        No feedback found
                      </Typography>
                    </div>
                  ) : (
                    <TableContainer component={Paper} elevation={0}>
                      <Table size="small">
                        <TableHead>
                          <TableRow
                            sx={{ backgroundColor: "rgb(249, 250, 251)" }}
                          >
                            <TableCell
                              onClick={() => handleSort("type")}
                              sx={{
                                fontFamily: "'Rubik', sans-serif",
                                fontWeight: 600,
                                cursor: "pointer",
                                userSelect: "none",
                                "&:hover": {
                                  backgroundColor: "rgba(0, 0, 0, 0.04)",
                                },
                                position: "relative",
                                minWidth: "80px",
                              }}
                            >
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                }}
                              >
                                Type
                                <span
                                  style={{
                                    width: "20px",
                                    height: "20px",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                >
                                  {sortField === "type" &&
                                    (sortDirection === "asc" ? (
                                      <ArrowUpwardIcon fontSize="small" />
                                    ) : (
                                      <ArrowDownwardIcon fontSize="small" />
                                    ))}
                                </span>
                              </span>
                            </TableCell>
                            <TableCell
                              onClick={() => handleSort("area")}
                              sx={{
                                fontFamily: "'Rubik', sans-serif",
                                fontWeight: 600,
                                cursor: "pointer",
                                userSelect: "none",
                                "&:hover": {
                                  backgroundColor: "rgba(0, 0, 0, 0.04)",
                                },
                                position: "relative",
                                minWidth: "80px",
                              }}
                            >
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                }}
                              >
                                Area
                                <span
                                  style={{
                                    width: "20px",
                                    height: "20px",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                >
                                  {sortField === "area" &&
                                    (sortDirection === "asc" ? (
                                      <ArrowUpwardIcon fontSize="small" />
                                    ) : (
                                      <ArrowDownwardIcon fontSize="small" />
                                    ))}
                                </span>
                              </span>
                            </TableCell>
                            <TableCell
                              onClick={() => handleSort("status")}
                              sx={{
                                fontFamily: "'Rubik', sans-serif",
                                fontWeight: 600,
                                cursor: "pointer",
                                userSelect: "none",
                                "&:hover": {
                                  backgroundColor: "rgba(0, 0, 0, 0.04)",
                                },
                                position: "relative",
                                minWidth: "80px",
                              }}
                            >
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                }}
                              >
                                Status
                                <span
                                  style={{
                                    width: "20px",
                                    height: "20px",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                >
                                  {sortField === "status" &&
                                    (sortDirection === "asc" ? (
                                      <ArrowUpwardIcon fontSize="small" />
                                    ) : (
                                      <ArrowDownwardIcon fontSize="small" />
                                    ))}
                                </span>
                              </span>
                            </TableCell>
                            <TableCell
                              onClick={() => handleSort("timestamp")}
                              sx={{
                                fontFamily: "'Rubik', sans-serif",
                                fontWeight: 600,
                                cursor: "pointer",
                                userSelect: "none",
                                "&:hover": {
                                  backgroundColor: "rgba(0, 0, 0, 0.04)",
                                },
                                position: "relative",
                                minWidth: "80px",
                              }}
                            >
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                }}
                              >
                                Date
                                <span
                                  style={{
                                    width: "20px",
                                    height: "20px",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                >
                                  {sortField === "timestamp" &&
                                    (sortDirection === "asc" ? (
                                      <ArrowUpwardIcon fontSize="small" />
                                    ) : (
                                      <ArrowDownwardIcon fontSize="small" />
                                    ))}
                                </span>
                              </span>
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {getSortedFeedbackItems().map((feedback) => (
                            <React.Fragment key={feedback.id}>
                              <TableRow
                                onClick={() =>
                                  handleFeedbackRowClick(feedback.id)
                                }
                                sx={{
                                  cursor: "pointer",
                                  "&:hover": {
                                    backgroundColor: "rgba(0, 0, 0, 0.04)",
                                  },
                                }}
                              >
                                <TableCell
                                  sx={{ fontFamily: "'Rubik', sans-serif" }}
                                >
                                  <Chip
                                    label={feedback.type.replace("-", " ")}
                                    size="small"
                                    color={
                                      feedback.type === "bug"
                                        ? "error"
                                        : feedback.type === "suggestion"
                                        ? "success"
                                        : "default"
                                    }
                                    sx={{
                                      fontFamily: "'Rubik', sans-serif",
                                      textTransform: "capitalize",
                                    }}
                                  />
                                </TableCell>
                                <TableCell
                                  sx={{ fontFamily: "'Rubik', sans-serif" }}
                                >
                                  {feedback.area.replace("-", " ")}
                                </TableCell>
                                <TableCell>
                                  <Chip
                                    label={feedback.status}
                                    size="small"
                                    color={
                                      feedback.status === "open"
                                        ? "primary"
                                        : "default"
                                    }
                                    sx={{ fontFamily: "'Rubik', sans-serif" }}
                                  />
                                </TableCell>
                                <TableCell
                                  sx={{ fontFamily: "'Rubik', sans-serif" }}
                                >
                                  {new Date(
                                    feedback.timestamp
                                  ).toLocaleDateString()}
                                </TableCell>
                              </TableRow>
                              {expandedFeedback === feedback.id && (
                                <TableRow>
                                  <TableCell
                                    colSpan={4}
                                    sx={{
                                      backgroundColor: "rgb(249, 250, 251)",
                                      borderTop: "1px solid rgb(229, 231, 235)",
                                    }}
                                  >
                                    <div className="p-4 space-y-3">
                                      <div>
                                        <Typography
                                          variant="subtitle2"
                                          sx={{
                                            fontFamily: "'Rubik', sans-serif",
                                            fontWeight: 600,
                                            color: "rgb(31, 41, 55)",
                                            mb: 1,
                                          }}
                                        >
                                          User
                                        </Typography>
                                        <Typography
                                          variant="body2"
                                          sx={{
                                            fontFamily: "'Rubik', sans-serif",
                                            color: "rgb(55, 65, 81)",
                                          }}
                                        >
                                          <div className="font-medium">
                                            {feedback.userName}
                                          </div>
                                          <div className="text-sm text-gray-500">
                                            {feedback.userEmail}
                                          </div>
                                        </Typography>
                                      </div>
                                      <div>
                                        <Typography
                                          variant="subtitle2"
                                          sx={{
                                            fontFamily: "'Rubik', sans-serif",
                                            fontWeight: 600,
                                            color: "rgb(31, 41, 55)",
                                            mb: 1,
                                          }}
                                        >
                                          Subject
                                        </Typography>
                                        <Typography
                                          variant="body2"
                                          sx={{
                                            fontFamily: "'Rubik', sans-serif",
                                            color: "rgb(55, 65, 81)",
                                          }}
                                        >
                                          {feedback.subject}
                                        </Typography>
                                      </div>
                                      <div>
                                        <Typography
                                          variant="subtitle2"
                                          sx={{
                                            fontFamily: "'Rubik', sans-serif",
                                            fontWeight: 600,
                                            color: "rgb(31, 41, 55)",
                                            mb: 1,
                                          }}
                                        >
                                          Description
                                        </Typography>
                                        <Typography
                                          variant="body2"
                                          sx={{
                                            fontFamily: "'Rubik', sans-serif",
                                            color: "rgb(55, 65, 81)",
                                            whiteSpace: "pre-wrap",
                                          }}
                                        >
                                          {feedback.description}
                                        </Typography>
                                      </div>
                                      {feedback.status === "open" && (
                                        <div className="flex justify-end items-center gap-2 mt-3">
                                          <Button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleInProgressFeedback(
                                                feedback.id
                                              );
                                            }}
                                            disabled={adminLoading}
                                            size="small"
                                            variant="outlined"
                                            startIcon={
                                              <RotateLeftOutlinedIcon />
                                            }
                                            sx={{
                                              textTransform: "none",
                                              fontFamily: "'Rubik', sans-serif",
                                              color: "rgb(249, 115, 22)",
                                              borderColor: "rgb(249, 115, 22)",
                                              "&:hover": {
                                                borderColor: "rgb(234, 88, 12)",
                                                backgroundColor:
                                                  "rgba(249, 115, 22, 0.1)",
                                              },
                                            }}
                                          >
                                            In Progress
                                          </Button>
                                          <Button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleArchiveFeedback(
                                                feedback.id
                                              );
                                            }}
                                            disabled={adminLoading}
                                            size="small"
                                            variant="outlined"
                                            startIcon={
                                              <PlaylistAddCheckOutlinedIcon />
                                            }
                                            sx={{
                                              textTransform: "none",
                                              fontFamily: "'Rubik', sans-serif",
                                              color: "rgb(34, 197, 94)",
                                              borderColor: "rgb(34, 197, 94)",
                                              "&:hover": {
                                                borderColor: "rgb(22, 163, 74)",
                                                backgroundColor:
                                                  "rgba(34, 197, 94, 0.1)",
                                              },
                                            }}
                                          >
                                            Resolved
                                          </Button>
                                          <IconButton
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleDeleteFeedback(feedback.id);
                                            }}
                                            disabled={adminLoading}
                                            size="small"
                                            sx={{
                                              color: "rgb(239, 68, 68)",
                                              "&:hover": {
                                                backgroundColor:
                                                  "rgba(239, 68, 68, 0.1)",
                                              },
                                            }}
                                          >
                                            <DeleteOutlineOutlinedIcon fontSize="small" />
                                          </IconButton>
                                        </div>
                                      )}
                                      {feedback.status !== "open" &&
                                        feedback.archivedAt && (
                                          <div className="text-right">
                                            <Typography
                                              variant="caption"
                                              sx={{
                                                fontFamily:
                                                  "'Rubik', sans-serif",
                                                color: "rgb(107, 114, 128)",
                                                fontStyle: "italic",
                                              }}
                                            >
                                              Resolved on{" "}
                                              {new Date(
                                                feedback.archivedAt
                                              ).toLocaleDateString()}
                                            </Typography>
                                          </div>
                                        )}
                                    </div>
                                  </TableCell>
                                </TableRow>
                              )}
                            </React.Fragment>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </div>
              </div>
            )}

            {/* Account Statistics */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <Typography
                variant="h6"
                sx={{
                  fontFamily: "'Rubik', sans-serif",
                  fontWeight: 600,
                  marginBottom: 3,
                  color: "rgb(31, 41, 55)",
                }}
              >
                Your Writing Statistics
              </Typography>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex flex-row sm:flex-col items-center sm:text-center justify-between sm:justify-center p-4 bg-gray-50 rounded-lg">
                  <Typography
                    variant="body2"
                    sx={{
                      fontFamily: "'Rubik', sans-serif",
                      color: "rgb(107, 114, 128)",
                      order: { xs: 1, sm: 2 },
                    }}
                  >
                    Books
                  </Typography>
                  <Typography
                    variant="h4"
                    sx={{
                      fontFamily: "'Rubik', sans-serif",
                      fontWeight: 700,
                      color: "rgb(19, 135, 194)",
                      order: { xs: 2, sm: 1 },
                    }}
                  >
                    {books.length}
                  </Typography>
                </div>

                <div className="flex flex-row sm:flex-col items-center sm:text-center justify-between sm:justify-center p-4 bg-gray-50 rounded-lg">
                  <Typography
                    variant="body2"
                    sx={{
                      fontFamily: "'Rubik', sans-serif",
                      color: "rgb(107, 114, 128)",
                      order: { xs: 1, sm: 2 },
                    }}
                  >
                    Stories
                  </Typography>
                  <Typography
                    variant="h4"
                    sx={{
                      fontFamily: "'Rubik', sans-serif",
                      fontWeight: 700,
                      color: "rgb(19, 135, 194)",
                      order: { xs: 2, sm: 1 },
                    }}
                  >
                    {quickStories.length}
                  </Typography>
                </div>

                <div className="flex flex-row sm:flex-col items-center sm:text-center justify-between sm:justify-center p-4 bg-gray-50 rounded-lg">
                  <Typography
                    variant="body2"
                    sx={{
                      fontFamily: "'Rubik', sans-serif",
                      color: "rgb(107, 114, 128)",
                      order: { xs: 1, sm: 2 },
                    }}
                  >
                    Total Words
                  </Typography>
                  <Typography
                    variant="h4"
                    sx={{
                      fontFamily: "'Rubik', sans-serif",
                      fontWeight: 700,
                      color: "rgb(19, 135, 194)",
                      order: { xs: 2, sm: 1 },
                    }}
                  >
                    {books.reduce((total, book) => total + book.wordCount, 0) +
                      quickStories.reduce(
                        (total, story) => total + story.wordCount,
                        0
                      )}
                  </Typography>
                </div>
              </div>
            </div>

            {/* Plan & Features */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <Typography
                variant="h6"
                sx={{
                  fontFamily: "'Rubik', sans-serif",
                  fontWeight: 600,
                  marginBottom: 3,
                  color: "rgb(31, 41, 55)",
                }}
              >
                Current Plan & Features
              </Typography>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <Typography
                      variant="body1"
                      sx={{
                        fontFamily: "'Rubik', sans-serif",
                        fontWeight: 600,
                        color: "rgb(31, 41, 55)",
                      }}
                    >
                      {twainPricingPlans.plans[
                        planType as keyof typeof twainPricingPlans.plans
                      ]?.name ||
                        planType.charAt(0).toUpperCase() +
                          planType.slice(1)}{" "}
                      Plan
                      {planType === "professional" && (
                        <span
                          onClick={handleDowngradeToFreelance}
                          style={{
                            color: "rgb(107, 114, 128)",
                            fontSize: "14px",
                            fontWeight: 400,
                            cursor: "pointer",
                            textDecoration: "underline",
                            marginLeft: "8px",
                          }}
                        >
                          - switch back to Freelance
                        </span>
                      )}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        fontFamily: "'Rubik', sans-serif",
                        color: "rgb(107, 114, 128)",
                      }}
                    >
                      {isActivePlan ? "Active" : "Inactive"} •{" "}
                      {twainPricingPlans.plans[
                        planType as keyof typeof twainPricingPlans.plans
                      ]?.limitations.storage === "cloud"
                        ? "Cloud Storage Enabled"
                        : "Local Storage Only"}
                      {planType === "freelance" && (
                        <>
                          {" "}
                          • ${
                            twainPricingPlans.plans.freelance.price.amount
                          }{" "}
                          {twainPricingPlans.plans.freelance.price.period}
                        </>
                      )}
                      {planType === "professional" && (
                        <>
                          {" "}
                          • ${
                            twainPricingPlans.plans.professional.price.amount
                          }{" "}
                          per{" "}
                          {twainPricingPlans.plans.professional.price.period}
                        </>
                      )}
                    </Typography>
                    {preferences.plan.endDate && (
                      <Typography
                        variant="body2"
                        sx={{
                          fontFamily: "'Rubik', sans-serif",
                          color: "rgb(107, 114, 128)",
                          mt: 0.5,
                        }}
                      >
                        Expires{" "}
                        {new Date(
                          preferences.plan.endDate
                        ).toLocaleDateString()}
                      </Typography>
                    )}
                  </div>
                  {planType === "freelance" && (
                    <Button
                      onClick={handleShowPricing}
                      variant="outlined"
                      size="small"
                      sx={{
                        textTransform: "none",
                        fontFamily: "'Rubik', sans-serif",
                        borderColor: "rgb(19, 135, 194)",
                        color: "rgb(19, 135, 194)",
                        "&:hover": {
                          backgroundColor: "rgba(19, 135, 194, 0.04)",
                        },
                      }}
                    >
                      Upgrade
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  {twainPricingPlans.plans[
                    planType as keyof typeof twainPricingPlans.plans
                  ]?.features.map((feature, index) => (
                    <div key={index} className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      <span
                        className={
                          feature.includes("coming soon")
                            ? "text-gray-400 italic"
                            : "text-gray-700"
                        }
                      >
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Account Actions */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <Typography
                variant="h6"
                sx={{
                  fontFamily: "'Rubik', sans-serif",
                  fontWeight: 600,
                  marginBottom: 3,
                  color: "rgb(31, 41, 55)",
                }}
              >
                Account Actions
              </Typography>

              <div className="flex gap-4">
                <Button
                  variant="outlined"
                  sx={{
                    flex: 1,
                    textTransform: "none",
                    fontFamily: "'Rubik', sans-serif",
                    py: 1.5,
                    borderColor: "rgb(209, 213, 219)",
                    color: "rgb(107, 114, 128)",
                    "&:hover": {
                      borderColor: "rgb(19, 135, 194)",
                      backgroundColor: "rgba(19, 135, 194, 0.04)",
                    },
                  }}
                >
                  Export All Data
                </Button>

                <Button
                  variant="outlined"
                  sx={{
                    flex: 1,
                    textTransform: "none",
                    fontFamily: "'Rubik', sans-serif",
                    py: 1.5,
                    borderColor: "rgb(239, 68, 68)",
                    color: "rgb(239, 68, 68)",
                    "&:hover": {
                      borderColor: "rgb(220, 38, 38)",
                      backgroundColor: "rgba(239, 68, 68, 0.04)",
                    },
                  }}
                >
                  <span className="sm:hidden">Delete Account</span>
                  <span className="hidden sm:inline">
                    Permanently Delete Account
                  </span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <TwainPageFooter />

      {/* Pricing Modal */}
      <TwainStoryPricingModal
        open={showPricing}
        onClose={handleClosePricing}
        onUpgrade={handleUpgradePlan}
      />
    </div>
  );
};

export default AccountSettingsPage;
