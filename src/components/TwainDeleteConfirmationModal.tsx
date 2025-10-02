"use client";

import React from "react";
import { Modal, Box, Typography, Button, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import WarningIcon from "@mui/icons-material/Warning";

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

interface TwainDeleteConfirmationModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemToDelete: {
    book: Book;
    isStory: boolean;
  } | null;
}

const TwainDeleteConfirmationModal: React.FC<
  TwainDeleteConfirmationModalProps
> = ({ open, onClose, onConfirm, itemToDelete }) => {
  if (!itemToDelete) return null;

  const { book, isStory } = itemToDelete;

  return (
    <Modal open={open} onClose={onClose} aria-labelledby="delete-modal-title">
      <Box
        sx={{
          position: "absolute",
          top: { xs: 0, sm: "50%" },
          left: { xs: 0, sm: "50%" },
          transform: { xs: "none", sm: "translate(-50%, -50%)" },
          width: { xs: "100vw", sm: 500 },
          maxWidth: { xs: "100vw", sm: "90vw" },
          height: { xs: "100vh", sm: "auto" },
          bgcolor: "background.paper",
          borderRadius: { xs: 0, sm: 3 },
          overflow: "hidden",
          boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <Box
          sx={{
            backgroundColor: "rgb(220, 38, 38)",
            color: "white",
            p: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography
            id="delete-modal-title"
            variant="h6"
            component="h2"
            sx={{
              fontFamily: "'Rubik', sans-serif",
              fontWeight: 600,
              margin: 0,
            }}
          >
            Delete {isStory ? "Story" : "Book"}
          </Typography>
          <IconButton
            onClick={onClose}
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
            flex: 1,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <Box>
            {/* Warning icon and message */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mb: 3,
              }}
            >
              <WarningIcon
                sx={{
                  fontSize: 48,
                  color: "rgb(245, 101, 101)",
                  mr: 2,
                }}
              />
            </Box>

            <Typography
              variant="h6"
              sx={{
                textAlign: "center",
                fontFamily: "'Rubik', sans-serif",
                fontWeight: 600,
                mb: 2,
                color: "rgb(17, 24, 39)",
              }}
            >
              Are you sure you want to delete this {isStory ? "story" : "book"}?
            </Typography>

            <Typography
              variant="body1"
              sx={{
                textAlign: "center",
                fontFamily: "'Rubik', sans-serif",
                color: "rgb(75, 85, 99)",
                mb: 3,
                fontSize: "16px",
                lineHeight: 1.5,
              }}
            >
              &ldquo;{book.title}&rdquo; will be permanently deleted along with
              all its content.
            </Typography>

            <Box
              sx={{
                backgroundColor: "rgb(254, 242, 242)",
                border: "1px solid rgb(252, 165, 165)",
                borderRadius: 2,
                p: 3,
                mb: 4,
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  fontFamily: "'Rubik', sans-serif",
                  color: "rgb(153, 27, 27)",
                  fontSize: "14px",
                  lineHeight: 1.4,
                  textAlign: "center",
                }}
              >
                <strong>Warning:</strong> This action cannot be undone. All{" "}
                {isStory ? "story" : "book"} data including{" "}
                {!isStory && "ideas, characters, chapters, "} content, and
                settings will be lost forever.
              </Typography>
            </Box>
          </Box>

          {/* Action buttons */}
          <Box
            sx={{
              display: "flex",
              gap: 2,
              flexDirection: { xs: "column", sm: "row" },
            }}
          >
            <Button
              onClick={onClose}
              variant="outlined"
              sx={{
                flex: 1,
                py: 1.5,
                fontFamily: "'Rubik', sans-serif",
                textTransform: "none",
                fontWeight: 500,
                fontSize: "16px",
                borderColor: "rgb(209, 213, 219)",
                color: "rgb(75, 85, 99)",
                "&:hover": {
                  borderColor: "rgb(156, 163, 175)",
                  backgroundColor: "rgb(249, 250, 251)",
                },
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={onConfirm}
              variant="contained"
              startIcon={<DeleteIcon />}
              sx={{
                flex: 1,
                py: 1.5,
                backgroundColor: "rgb(220, 38, 38)",
                fontFamily: "'Rubik', sans-serif",
                textTransform: "none",
                fontWeight: 500,
                fontSize: "16px",
                "&:hover": {
                  backgroundColor: "rgb(185, 28, 28)",
                },
              }}
            >
              Delete {isStory ? "Story" : "Book"}
            </Button>
          </Box>
        </Box>
      </Box>
    </Modal>
  );
};

export default TwainDeleteConfirmationModal;
