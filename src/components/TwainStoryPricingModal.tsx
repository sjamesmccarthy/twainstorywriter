"use client";

import React from "react";
import {
  Modal,
  Box,
  Typography,
  Button,
  IconButton,
  Chip,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import WorkspacePremiumOutlinedIcon from "@mui/icons-material/WorkspacePremiumOutlined";
import { twainPricingPlans } from "../data/twainPricingPlans";

interface TwainStoryPricingModalProps {
  open: boolean;
  onClose: () => void;
  onUpgrade: (planType: "professional") => void;
}

interface ProfessionalFeatureChipProps {
  onClick?: () => void;
  size?: "small" | "medium";
  label?: string;
}

// Reusable Professional Feature Chip component
export const ProfessionalFeatureChip: React.FC<
  ProfessionalFeatureChipProps
> = ({ onClick, size = "medium", label = "Professional Feature" }) => {
  const isSmall = size === "small";

  return (
    <Chip
      icon={<WorkspacePremiumOutlinedIcon />}
      label={label}
      onClick={onClick}
      sx={{
        backgroundColor: "#fbbf24",
        color: "white",
        fontSize: isSmall ? "10px" : "12px",
        fontWeight: "bold",
        height: isSmall ? "20px" : "28px",
        cursor: onClick ? "pointer" : "default",
        "& .MuiChip-icon": {
          color: "white",
          fontSize: isSmall ? "12px" : "16px",
        },
        "&:hover": onClick
          ? {
              backgroundColor: "#f59e0b",
            }
          : {},
      }}
    />
  );
};

interface TwainStoryPricingModalProps {
  open: boolean;
  onClose: () => void;
  onUpgrade: (planType: "professional") => void;
}

const TwainStoryPricingModal: React.FC<TwainStoryPricingModalProps> = ({
  open,
  onClose,
  onUpgrade,
}) => {
  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="pricing-modal-title"
      sx={{ zIndex: 99999 }}
    >
      <Box
        sx={{
          position: "absolute",
          top: { xs: 0, sm: "50%" },
          left: { xs: 0, sm: "50%" },
          transform: { xs: "none", sm: "translate(-50%, -50%)" },
          width: { xs: "100vw", sm: 800 },
          maxWidth: { xs: "100vw", sm: "90vw" },
          height: { xs: "100vh", sm: "auto" },
          maxHeight: { xs: "100vh", sm: "90vh" },
          bgcolor: "background.paper",
          borderRadius: { xs: 0, sm: 3 },
          overflow: "hidden",
          boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
          display: { xs: "flex", sm: "block" },
          flexDirection: { xs: "column", sm: "row" },
          zIndex: 99999,
          outline: "none",
          "&:focus": {
            outline: "none",
          },
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
            id="pricing-modal-title"
            variant="h6"
            component="h2"
            sx={{
              fontFamily: "'Rubik', sans-serif",
              fontWeight: 600,
              margin: 0,
            }}
          >
            Choose Your Plan
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

        {/* Modal content */}
        <Box
          sx={{
            p: { xs: 3, sm: 4 },
            flex: { xs: 1, sm: "none" },
            overflowY: "auto",
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(twainPricingPlans.plans).map(([planKey, plan]) => (
              <div
                key={planKey}
                className={`${
                  plan.popular
                    ? "border-2 border-blue-500"
                    : "border border-gray-200"
                } rounded-lg p-6 bg-white relative flex flex-col h-full`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      Popular
                    </span>
                  </div>
                )}

                <div className="flex-1">
                  <div className="text-center mb-6">
                    <Typography
                      variant="h5"
                      sx={{
                        fontFamily: "'Rubik', sans-serif",
                        fontWeight: 600,
                        color: "rgb(31, 41, 55)",
                        mb: 2,
                      }}
                    >
                      {plan.name}
                    </Typography>
                    <Typography
                      variant="h3"
                      sx={{
                        fontFamily: "'Rubik', sans-serif",
                        fontWeight: 700,
                        color: "rgb(19, 135, 194)",
                        mb: 1,
                      }}
                    >
                      ${plan.price.amount}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        fontFamily: "'Rubik', sans-serif",
                        color: "rgb(107, 114, 128)",
                      }}
                    >
                      per {plan.price.period}
                    </Typography>
                  </div>

                  <div className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-center">
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

                <Button
                  fullWidth
                  variant={plan.popular ? "contained" : "outlined"}
                  onClick={() => plan.popular && onUpgrade("professional")}
                  sx={{
                    py: 1.5,
                    textTransform: "none",
                    fontFamily: "'Rubik', sans-serif",
                    ...(plan.popular
                      ? {
                          backgroundColor: "rgb(19, 135, 194)",
                          boxShadow: "none",
                          "&:hover": {
                            backgroundColor: "rgb(15, 108, 155)",
                            boxShadow: "none",
                          },
                        }
                      : {
                          borderColor: "rgb(19, 135, 194)",
                          color: "rgb(19, 135, 194)",
                          "&:hover": {
                            backgroundColor: "rgba(19, 135, 194, 0.04)",
                          },
                        }),
                  }}
                >
                  {plan.popular ? "Start Professional" : "Get Started Free"}
                </Button>
              </div>
            ))}
          </div>

          <div className="mt-6 text-center">
            <Typography
              variant="body2"
              sx={{
                fontFamily: "'Rubik', sans-serif",
                color: "rgb(107, 114, 128)",
              }}
            >
              All plans include our core writing features and regular updates
              <br />
              <span className="text-sm">
                * Local storage is not available across devices. Your data is
                stored in your web browsers cache and may be lost if you clear
                your cache. ** Cloud storage is available across devices and
                stored in a secure database. *** Publishing to Amazon Kindle is
                coming soon.
              </span>
            </Typography>
          </div>
        </Box>
      </Box>
    </Modal>
  );
};

export default TwainStoryPricingModal;
