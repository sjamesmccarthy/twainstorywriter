"use client";

import React from "react";
import { Typography } from "@mui/material";
import { useRouter } from "next/navigation";

interface TwainPageFooterProps {
  variant?: "default" | "bookshelf";
}

const TwainPageFooter: React.FC<TwainPageFooterProps> = ({
  variant = "default",
}) => {
  const router = useRouter();

  const getFooterClasses = () => {
    switch (variant) {
      case "bookshelf":
        return "h-[100px] pl-3 pr-3 flex items-center justify-center bg-gray-200";
      case "default":
      default:
        return "bg-white border-t border-gray-200 py-6 pl-3 pr-3";
    }
  };

  return (
    <footer className={getFooterClasses()}>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ fontFamily: "'Rubik', sans-serif", textAlign: "center" }}
      >
        © {new Date().getFullYear()} Twain Story Writer. All Rights Reserved.
        <br />
        You are using a BETA version of this software -{" "}
        <span
          onClick={() => router.push("/feedback")}
          className="underline text-blue-600 hover:text-blue-800 cursor-pointer"
        >
          Feedback{" "}
        </span>
        -{" "}
        <span
          onClick={() => router.push("/terms")}
          className="underline text-blue-600 hover:text-blue-800 cursor-pointer"
        >
          Terms and Conditions
        </span>
      </Typography>
    </footer>
  );
};

export default TwainPageFooter;
