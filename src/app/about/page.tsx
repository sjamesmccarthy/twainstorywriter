"use client";

import React from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Typography, Paper, Box } from "@mui/material";
import {
  MenuBookOutlined,
  EditOutlined,
  PeopleOutlined,
  ListAltOutlined,
  LightbulbOutlined,
  BarChartOutlined,
  FileDownloadOutlined,
} from "@mui/icons-material";
import TwainPageHeader from "@/components/TwainPageHeader";
import TwainPageFooter from "@/components/TwainPageFooter";
import TwainProfileMenu from "@/components/TwainProfileMenu";
import { useUserPreferences } from "@/hooks/useUserPreferences";

const AboutPage: React.FC = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const { planType } = useUserPreferences();

  const handleBackClick = () => {
    router.push("/bookshelf");
  };

  const handleAccountSettings = () => {
    router.push("/account-settings"); // or wherever account settings should go
  };

  const handleFeedback = () => {
    router.push("/feedback");
  };

  const handleHelp = () => {
    router.push("/help");
  };

  const handleLogout = () => {
    signOut();
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header with Profile Menu */}
      <div className="relative">
        <TwainPageHeader
          title="About Twain Story Writer"
          subtitle="Learn more about our powerful story writing platform"
          onBackClick={handleBackClick}
          showBackButton={true}
        />

        {/* Profile Menu - positioned over the header */}
        {session && (
          <TwainProfileMenu
            session={session}
            planType={planType}
            onAccountSettings={handleAccountSettings}
            onFeedback={handleFeedback}
            onHelp={handleHelp}
            onLogout={handleLogout}
          />
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <Paper elevation={1} sx={{ p: 4 }}>
            <Typography
              variant="h4"
              sx={{
                mb: 3,
                fontFamily: "'Rubik', sans-serif",
                textAlign: "center",
              }}
            >
              Welcome to Twain Story Writer
            </Typography>
            <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.6 }}>
              Twain Story Writer is a comprehensive platform designed to help
              authors bring their stories to life. Whether you&apos;re writing
              your first novel or your twentieth, our tools are designed to
              streamline your creative process and help you focus on what
              matters most: telling great stories.
            </Typography>
            <Typography variant="body1" sx={{ mb: 4, lineHeight: 1.6 }}>
              Our platform offers powerful features for organizing your ideas,
              developing characters, outlining plots, and writing chapters. With
              both Freelance and Professional plans available, we provide
              flexible options to suit every writer&apos;s needs.
            </Typography>

            <Typography
              variant="h5"
              sx={{ mb: 3, mt: 4, fontFamily: "'Rubik', sans-serif" }}
            >
              Key Features
            </Typography>
            <Box sx={{ pl: 4, mb: 4 }}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <MenuBookOutlined sx={{ mr: 2, color: "primary.main" }} />
                <Typography variant="body1">
                  Organize multiple books and series
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <EditOutlined sx={{ mr: 2, color: "primary.main" }} />
                <Typography variant="body1">
                  Powerful writing editor with formatting tools
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <PeopleOutlined sx={{ mr: 2, color: "primary.main" }} />
                <Typography variant="body1">
                  Character development and management
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <ListAltOutlined sx={{ mr: 2, color: "primary.main" }} />
                <Typography variant="body1">
                  Chapter and outline organization
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <LightbulbOutlined sx={{ mr: 2, color: "primary.main" }} />
                <Typography variant="body1">
                  Idea capture and story planning
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <BarChartOutlined sx={{ mr: 2, color: "primary.main" }} />
                <Typography variant="body1">
                  Word count tracking and progress monitoring
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <FileDownloadOutlined sx={{ mr: 2, color: "primary.main" }} />
                <Typography variant="body1">
                  Export capabilities for various formats
                </Typography>
              </Box>
            </Box>

            <Typography
              variant="h5"
              sx={{ mb: 3, mt: 4, fontFamily: "'Rubik', sans-serif" }}
            >
              Get Started
            </Typography>
            <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
              Ready to begin your writing journey? Head back to your bookshelf
              to create your first book, or explore the account settings to
              customize your experience. If you have any questions or feedback,
              don&apos;t hesitate to use our feedback system - we&apos;re always
              looking to improve!
            </Typography>
          </Paper>
        </div>
      </div>

      {/* Footer */}
      <TwainPageFooter />
    </div>
  );
};

export default AboutPage;
