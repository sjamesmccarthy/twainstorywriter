"use client";

import React from "react";
import { Typography, IconButton } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

interface TwainPageHeaderProps {
  title: string;
  subtitle?: string;
  onBackClick?: () => void;
  showBackButton?: boolean;
}

const TwainPageHeader: React.FC<TwainPageHeaderProps> = ({
  title,
  subtitle,
  onBackClick,
  showBackButton = false,
}) => {
  return (
    <>
      {/* Header */}
      <header
        className="h-[300px] flex flex-col justify-center items-center text-white relative"
        style={{ backgroundColor: "rgb(38, 52, 63)" }}
      >
        <Typography
          variant="h4"
          sx={{
            fontFamily: "'Rubik', sans-serif",
            fontWeight: 600,
            marginBottom: 1,
            color: "white",
          }}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography
            variant="body2"
            sx={{
              fontFamily: "'Rubik', sans-serif",
              fontWeight: 300,
              fontSize: "14px",
              textAlign: "center",
              maxWidth: "600px",
              margin: "0 auto",
              color: "white",
            }}
          >
            {subtitle}
          </Typography>
        )}
      </header>

      {/* Navigation Bar */}
      {showBackButton && onBackClick && (
        <div className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="w-[90%] md:w-[80%] mx-auto flex items-center">
            <IconButton
              onClick={onBackClick}
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
      )}
    </>
  );
};

export default TwainPageHeader;
