"use client";

import React, { useState } from "react";
import {
  Menu,
  MenuItem,
  Avatar,
  IconButton,
  Chip,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import {
  Settings as SettingsIcon,
  Info as InfoIcon,
  Help as HelpIcon,
  Feedback as FeedbackIcon,
  Logout as LogoutIcon,
} from "@mui/icons-material";

// Utility function to process Google profile image URL
const processGoogleImageUrl = (url: string): string => {
  // Remove size parameters and add our own
  const baseUrl = url.split("=")[0];
  return `${baseUrl}=s40-c`;
};

// Helper function to get plan chip properties
const getPlanChipProps = (planType: "freelance" | "professional") => {
  switch (planType) {
    case "freelance":
      return {
        label: "Freelance",
        color: "default" as const,
        sx: {
          backgroundColor: "#9e9e9e",
          color: "white",
          fontSize: "14px",
          fontWeight: "bold",
          height: "32px",
        },
      };
    case "professional":
      return {
        label: "Professional",
        color: "error" as const,
        sx: {
          backgroundColor: "#f44336",
          color: "white",
          fontSize: "14px",
          fontWeight: "bold",
          height: "32px",
        },
      };
    default:
      return {
        label: "Freelance",
        color: "default" as const,
        sx: {
          backgroundColor: "#9e9e9e",
          color: "white",
          fontSize: "14px",
          fontWeight: "bold",
          height: "32px",
        },
      };
  }
};

// Custom Avatar Component
interface UserAvatarProps {
  session: {
    user?: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  } | null;
  onError?: () => void;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ session, onError }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Fallback avatar component
  const FallbackAvatar = () => (
    <Avatar
      sx={{
        width: 40,
        height: 40,
        bgcolor: "rgb(19, 135, 194)",
        color: "white",
        fontSize: "16px",
        fontWeight: 600,
      }}
    >
      {session?.user?.name ? session.user.name.charAt(0).toUpperCase() : "?"}
    </Avatar>
  );

  if (!session?.user?.image || imageError) {
    return <FallbackAvatar />;
  }

  return (
    <div
      style={{
        width: 40,
        height: 40,
        borderRadius: "50%",
        overflow: "hidden",
        position: "relative",
        backgroundColor: imageLoaded ? "transparent" : "rgb(19, 135, 194)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {!imageLoaded && (
        <span
          style={{
            color: "white",
            fontSize: "16px",
            fontWeight: 600,
            position: "absolute",
            zIndex: 1,
          }}
        >
          {session?.user?.name
            ? session.user.name.charAt(0).toUpperCase()
            : "?"}
        </span>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={processGoogleImageUrl(session.user.image)}
        alt={session?.user?.name || "User"}
        style={{
          width: "40px",
          height: "40px",
          borderRadius: "50%",
          objectFit: "cover",
          display: imageLoaded ? "block" : "none",
        }}
        onLoad={() => {
          setImageLoaded(true);
          console.log(
            "Avatar image loaded successfully:",
            session?.user?.image
          );
        }}
        onError={() => {
          const originalUrl = session?.user?.image;
          const processedUrl = originalUrl
            ? processGoogleImageUrl(originalUrl)
            : "N/A";
          console.error(
            "Avatar image failed to load. Original URL:",
            originalUrl
          );
          console.error("Processed URL:", processedUrl);
          setImageError(true);
          onError?.();
        }}
        referrerPolicy="no-referrer"
      />
    </div>
  );
};

// Reusable Profile Menu Component
interface TwainProfileMenuProps {
  session: {
    user?: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  } | null;
  planType: "freelance" | "professional";
  onAccountSettings?: () => void;
  onAbout?: () => void;
  onHelp?: () => void;
  onFeedback?: () => void;
  onLogout: () => void;
  additionalClasses?: string;
  showPlanChip?: boolean;
}

const TwainProfileMenu: React.FC<TwainProfileMenuProps> = ({
  session,
  planType,
  onAccountSettings,
  onAbout,
  onHelp,
  onFeedback,
  onLogout,
  additionalClasses = "",
  showPlanChip = true,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleAccountSettings = () => {
    handleMenuClose();
    onAccountSettings?.();
  };

  const handleAbout = () => {
    handleMenuClose();
    onAbout?.();
  };

  const handleHelp = () => {
    handleMenuClose();
    onHelp?.();
  };

  const handleFeedback = () => {
    handleMenuClose();
    onFeedback?.();
  };

  const handleLogout = () => {
    handleMenuClose();
    onLogout();
  };

  return (
    <div
      className={`absolute top-4 right-4 flex items-center gap-2 ${additionalClasses}`}
    >
      <IconButton onClick={handleMenuOpen}>
        <UserAvatar session={session} />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        sx={{
          "& .MuiPaper-root": {
            minWidth: "200px",
            width: "200px",
          },
        }}
      >
        {showPlanChip && (
          <div className="ml-2 pb-1 pt-2">
            <Chip {...getPlanChipProps(planType)} />
          </div>
        )}
        {onAccountSettings && (
          <MenuItem onClick={handleAccountSettings}>
            <ListItemIcon>
              <SettingsIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Account Settings</ListItemText>
          </MenuItem>
        )}
        {onAbout && (
          <MenuItem onClick={handleAbout}>
            <ListItemIcon>
              <InfoIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>About</ListItemText>
          </MenuItem>
        )}
        {onHelp && (
          <MenuItem onClick={handleHelp}>
            <ListItemIcon>
              <HelpIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Help</ListItemText>
          </MenuItem>
        )}
        {onFeedback && (
          <MenuItem onClick={handleFeedback}>
            <ListItemIcon>
              <FeedbackIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Feedback</ListItemText>
          </MenuItem>
        )}
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Sign Out</ListItemText>
        </MenuItem>
      </Menu>
    </div>
  );
};

export default TwainProfileMenu;
export { UserAvatar, getPlanChipProps };
export type { TwainProfileMenuProps, UserAvatarProps };
