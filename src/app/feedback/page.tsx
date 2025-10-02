"use client";

import React, { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Box,
  Paper,
  Alert,
} from "@mui/material";
import TwainPageHeader from "@/components/TwainPageHeader";
import TwainPageFooter from "@/components/TwainPageFooter";
import TwainProfileMenu from "@/components/TwainProfileMenu";
import { useUserPreferences } from "@/hooks/useUserPreferences";

const feedbackTypes = [
  { value: "bug", label: "Bug" },
  { value: "unexpected-behavior", label: "Unexpected Behavior" },
  { value: "suggestion", label: "Suggestion" },
  { value: "other", label: "Other" },
];

const feedbackAreas = [
  { value: "login-process", label: "Login Process" },
  { value: "bookshelf", label: "Bookshelf" },
  { value: "managing-book", label: "Managing a Book" },
  { value: "ideas", label: "Ideas" },
  { value: "characters", label: "Characters" },
  { value: "outline", label: "Outline" },
  { value: "stories", label: "Stories" },
  { value: "chapters", label: "Chapters" },
  { value: "parts", label: "Parts" },
  { value: "note-cards", label: "Note & Plot Cards" },
  { value: "importing-process", label: "Importing Process" },
  { value: "writing-tool", label: "Writing tool (the editor)" },
  { value: "creating-book-process", label: "Creating a Book Process" },
  { value: "exporting-data", label: "Exporting All Data" },
  { value: "account-settings", label: "Account Settings" },
  { value: "help", label: "Help/FAQ" },
  { value: "other", label: "Other" },
];

const FeedbackPage: React.FC = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const { planType } = useUserPreferences();
  const [formData, setFormData] = useState({
    type: "",
    area: "",
    subject: "",
    description: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Profile menu handlers
  const handleAccountSettings = () => {
    router.push("/bookshelf"); // Navigate back to main app for account settings
  };

  const handleAbout = () => {
    router.push("/about");
  };

  const handleHelp = () => {
    router.push("/help");
  };

  const handleLogout = () => {
    signOut();
  };

  console.log(
    "FeedbackPage render - isSubmitted:",
    isSubmitted,
    "isSubmitting:",
    isSubmitting,
    "session:",
    session
  );

  // Use localStorage to persist the submitted state across potential re-renders
  useEffect(() => {
    const savedSubmissionState = localStorage.getItem("feedbackSubmitted");
    if (savedSubmissionState === "true") {
      setIsSubmitted(true);
    }
  }, []);

  useEffect(() => {
    if (isSubmitted) {
      localStorage.setItem("feedbackSubmitted", "true");
    }
  }, [isSubmitted]);

  const handleBackToBookshelf = () => {
    localStorage.removeItem("feedbackSubmitted");
    router.push("/bookshelf");
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.type ||
      !formData.area ||
      !formData.subject ||
      !formData.description
    ) {
      setSubmitMessage({
        type: "error",
        text: "Please fill in all required fields.",
      });
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          userEmail: session?.user?.email,
          userName: session?.user?.name,
        }),
      });

      if (response.ok) {
        console.log(
          "Feedback submitted successfully, setting isSubmitted to true"
        );
        setIsSubmitted(true);
        setSubmitMessage(null); // Clear any previous messages
        // Don't clear form data or set submit message when successful
        // The success state will be handled by isSubmitted
      } else {
        throw new Error("Failed to submit feedback");
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
      // Only show error message if we haven't already successfully submitted
      if (!isSubmitted) {
        setSubmitMessage({
          type: "error",
          text: "There was an error submitting your feedback. Please try again.",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header with Profile Menu */}
      <div className="relative">
        <TwainPageHeader
          title="Feedback"
          subtitle="Help us improve Twain Story Writer"
          showBackButton={true}
          onBackClick={handleBackToBookshelf}
        />

        {/* Profile Menu - positioned over the header */}
        {session && (
          <TwainProfileMenu
            session={session}
            planType={planType}
            onAccountSettings={handleAccountSettings}
            onAbout={handleAbout}
            onHelp={handleHelp}
            onLogout={handleLogout}
            additionalClasses="z-50"
          />
        )}
      </div>

      {/* Main content area */}
      <main className="flex-1 bg-gray-100 p-4 lg:p-8">
        <div className="w-[95%] lg:w-[60%] mx-auto">
          <Paper elevation={1} sx={{ p: 4, borderRadius: 2 }}>
            {isSubmitted ? (
              <div className="text-center space-y-6">
                <Typography
                  variant="h5"
                  sx={{
                    fontFamily: "'Rubik', sans-serif",
                    fontWeight: 600,
                    color: "rgb(34, 197, 94)",
                    marginBottom: 2,
                  }}
                >
                  Thank You!
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    fontFamily: "'Rubik', sans-serif",
                    color: "rgb(31, 41, 55)",
                    marginBottom: 4,
                  }}
                >
                  Your feedback has been submitted successfully. We appreciate
                  your input and will review it to help improve Twain Story
                  Writer.
                </Typography>
                <Button
                  variant="contained"
                  onClick={handleBackToBookshelf}
                  sx={{
                    fontFamily: "'Rubik', sans-serif",
                    fontWeight: 500,
                    backgroundColor: "rgb(19, 135, 194)",
                    "&:hover": {
                      backgroundColor: "rgb(15, 108, 155)",
                    },
                    px: 4,
                    py: 1.5,
                    mt: 3,
                  }}
                >
                  Back to Book Index
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="space-y-6">
                  <Typography
                    variant="h6"
                    sx={{
                      fontFamily: "'Rubik', sans-serif",
                      fontWeight: 600,
                      marginBottom: 3,
                      color: "rgb(31, 41, 55)",
                    }}
                  >
                    Submit Feedback
                  </Typography>

                  {submitMessage && submitMessage.type === "error" && (
                    <Alert severity={submitMessage.type} sx={{ mb: 3 }}>
                      {submitMessage.text}
                    </Alert>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Type Selection */}
                    <FormControl fullWidth required>
                      <InputLabel
                        sx={{
                          fontFamily: "'Rubik', sans-serif",
                        }}
                      >
                        Type
                      </InputLabel>
                      <Select
                        value={formData.type}
                        label="Type"
                        onChange={(e) =>
                          handleInputChange("type", e.target.value)
                        }
                        sx={{
                          fontFamily: "'Rubik', sans-serif",
                        }}
                      >
                        {feedbackTypes.map((type) => (
                          <MenuItem
                            key={type.value}
                            value={type.value}
                            sx={{ fontFamily: "'Rubik', sans-serif" }}
                          >
                            {type.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    {/* Area Selection */}
                    <FormControl fullWidth required>
                      <InputLabel
                        sx={{
                          fontFamily: "'Rubik', sans-serif",
                        }}
                      >
                        Area/Section
                      </InputLabel>
                      <Select
                        value={formData.area}
                        label="Area/Section"
                        onChange={(e) =>
                          handleInputChange("area", e.target.value)
                        }
                        sx={{
                          fontFamily: "'Rubik', sans-serif",
                        }}
                      >
                        {feedbackAreas.map((area) => (
                          <MenuItem
                            key={area.value}
                            value={area.value}
                            sx={{ fontFamily: "'Rubik', sans-serif" }}
                          >
                            {area.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </div>

                  {/* Subject */}
                  <TextField
                    fullWidth
                    required
                    label="Subject"
                    value={formData.subject}
                    onChange={(e) =>
                      handleInputChange("subject", e.target.value)
                    }
                    InputLabelProps={{
                      sx: { fontFamily: "'Rubik', sans-serif" },
                    }}
                    InputProps={{
                      sx: {
                        fontFamily: "'Rubik', sans-serif",
                        marginBottom: 3,
                      },
                    }}
                  />

                  {/* Description */}
                  <TextField
                    fullWidth
                    required
                    multiline
                    rows={6}
                    label="Describe the problem or suggestion"
                    value={formData.description}
                    onChange={(e) =>
                      handleInputChange("description", e.target.value)
                    }
                    InputLabelProps={{
                      sx: { fontFamily: "'Rubik', sans-serif" },
                    }}
                    InputProps={{
                      sx: { fontFamily: "'Rubik', sans-serif" },
                    }}
                    placeholder="Please provide as much detail as possible to help us understand and address your feedback..."
                  />

                  {/* Submit Button */}
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: { xs: "stretch", md: "flex-end" },
                      mt: 3,
                    }}
                  >
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={isSubmitting}
                      sx={{
                        fontFamily: "'Rubik', sans-serif",
                        fontWeight: 500,
                        backgroundColor: "rgb(19, 135, 194)",
                        "&:hover": {
                          backgroundColor: "rgb(15, 108, 155)",
                        },
                        px: 4,
                        py: 1.5,
                        width: { xs: "100%", md: "auto" },
                      }}
                    >
                      {isSubmitting ? "Submitting..." : "Submit Feedback"}
                    </Button>
                  </Box>
                </div>
              </form>
            )}
          </Paper>
        </div>
      </main>

      <TwainPageFooter />
    </div>
  );
};

export default FeedbackPage;
