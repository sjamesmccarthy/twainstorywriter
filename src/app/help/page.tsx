"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import TwainPageHeader from "@/components/TwainPageHeader";
import TwainPageFooter from "@/components/TwainPageFooter";
import TwainProfileMenu from "@/components/TwainProfileMenu";
import { useUserPreferences } from "@/hooks/useUserPreferences";

const HelpPage: React.FC = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const { planType } = useUserPreferences();
  const [expanded, setExpanded] = useState<string | false>(false);

  const handleBackToBookshelf = () => {
    router.push("/bookshelf");
  };

  const handleAccountSettings = () => {
    router.push("/account-settings");
  };

  const handleAbout = () => {
    router.push("/about");
  };

  const handleFeedback = () => {
    router.push("/feedback");
  };

  const handleHelp = () => {
    // Already on help page, so do nothing or scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleLogout = () => {
    // Will be handled by the profile menu
  };

  const handleChange =
    (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
      setExpanded(isExpanded ? panel : false);
    };

  const helpTopics = [
    {
      id: "getting-started",
      title: "Getting Started with Twain Story Writer",
      content: `
        Welcome to Twain Story Writer! Here's how to get started:
        
        1. **Create Your First Book**: Click the "Add New Book" button on your bookshelf
        2. **Fill in Basic Details**: Add your book title, author name, and other metadata
        3. **Upload a Cover**: Click on the book cover area to upload your cover image
        4. **Start Writing**: Click "Write Story" to begin your creative journey
        5. **Save Regularly**: Your work is automatically saved as you type
        
        Your books are stored locally in your browser and synced to the cloud if you have a Professional plan.
      `,
    },
    {
      id: "book-management",
      title: "Managing Your Books and Series",
      content: `
        Organize your writing projects effectively:
        
        **Book Management:**
        - Edit book details anytime by clicking the settings icon
        - Upload and change cover images for better organization
        - Set copyright year and edition information
        - Add subtitle and description for detailed cataloging
        
        **Series Management:**
        - Professional users can create unlimited book series
        - Free users can have up to 3 books in series
        - Each book in a series gets an automatic number
        - Manage series order and book relationships
        
        **Metadata Options:**
        - Set genre and age group classifications
        - Add contributor information (editors, illustrators, etc.)
        - Include publisher details and ISBN numbers
      `,
    },
    {
      id: "writing-features",
      title: "Writing Tools and Features",
      content: `
        Enhance your writing experience with our powerful tools:
        
        **Writing Interface:**
        - Clean, distraction-free writing environment
        - Real-time word count tracking
        - Automatic save functionality
        - Chapter and section organization
        
        **Formatting Options:**
        - Rich text formatting for professional manuscripts
        - Paragraph and line spacing controls
        - Font and style customization
        - Print-ready formatting
        
        **Writing Aids:**
        - Built-in spell check and grammar assistance
        - Word count goals and progress tracking
        - Writing statistics and analytics
        - Export options for various formats
      `,
    },
    {
      id: "export-publish",
      title: "Exporting and Publishing Your Work",
      content: `
        Share your finished work with the world:
        
        **Export Formats (Professional Feature):**
        - PDF for print-ready manuscripts
        - EPUB for e-book distribution
        - Microsoft Word for further editing
        - Plain text for universal compatibility
        
        **Publishing Preparation:**
        - Professional manuscript formatting
        - Copyright page generation
        - ISBN integration support
        - Cover image optimization
        
        **Distribution Options:**
        - Export for self-publishing platforms
        - Traditional publisher submission format
        - Print-on-demand preparation
        - Digital distribution ready files
        
        Note: Export and publishing features require a Professional plan subscription.
      `,
    },
    {
      id: "plans-pricing",
      title: "Plans and Pricing Information",
      content: `
        Choose the plan that works best for your writing needs:
        
        **Freelance Plan (Free):**
        - Unlimited books and stories
        - Local storage in browser
        - Basic writing tools
        - Up to 3 books in series
        - Standard support
        
        **Professional Plan ($9.99/month):**
        - Everything in Freelance
        - Cloud storage and sync
        - Export in multiple formats (PDF, EPUB, Word)
        - Unlimited books in series
        - Advanced manuscript formatting
        - Priority support
        - Publishing tools and ISBN integration
        
        **Upgrading:**
        - Upgrade or downgrade anytime
        - No long-term contracts
        - Immediate access to new features
        - Data preserved during plan changes
      `,
    },
    {
      id: "data-storage",
      title: "Data Storage and Backup",
      content: `
        Keep your work safe with our storage options:
        
        **Local Storage (All Plans):**
        - Work is saved in your browser automatically
        - Accessible offline for writing
        - No internet required for basic features
        - Export data for manual backup
        
        **Cloud Storage (Professional Only):**
        - Automatic cloud synchronization
        - Access your work from any device
        - Automatic backups and version history
        - Share projects with collaborators
        
        **Data Export:**
        - Download all your work anytime
        - Export individual books or entire library
        - Multiple format options available
        - No vendor lock-in policy
        
        **Security:**
        - Your work belongs to you
        - Encrypted cloud storage
        - Privacy-focused design
        - GDPR compliant data handling
      `,
    },
    {
      id: "troubleshooting",
      title: "Troubleshooting Common Issues",
      content: `
        Solve common problems quickly:
        
        **Work Not Saving:**
        - Check your internet connection
        - Ensure browser storage isn't full
        - Try refreshing the page
        - Clear browser cache if needed
        
        **Cover Image Problems:**
        - Use images with 1:1.6 ratio (width:height)
        - Minimum 2500px on longest side
        - Supported formats: JPG, PNG, WebP
        - File size under 10MB recommended
        
        **Performance Issues:**
        - Close other browser tabs
        - Ensure browser is up to date
        - Check available device storage
        - Try incognito/private browsing mode
        
        **Access Problems:**
        - Verify your login credentials
        - Check if your plan is active
        - Try logging out and back in
        - Contact support if issues persist
      `,
    },
    {
      id: "contact-support",
      title: "Contact and Support Options",
      content: `
        Get help when you need it:
        
        **Self-Help Resources:**
        - This comprehensive help section
        - Video tutorials (coming soon)
        - Community forums (coming soon)
        - FAQ section on our website
        
        **Direct Support:**
        - Use the Feedback form in your profile menu
        - Email support for Professional users
        - Priority support for paid subscribers
        - Response within 24-48 hours
        
        **Feature Requests:**
        - Submit ideas through the Feedback form
        - Vote on features in our roadmap
        - Beta testing opportunities
        - Community-driven development
        
        **Community:**
        - Join our Discord server (coming soon)
        - Follow us on social media
        - Writer community forums
        - Monthly virtual writing events
        
        **Emergency Contact:**
        - For urgent account or billing issues
        - Data recovery assistance
        - Security concerns
        - Technical emergencies
      `,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header with Profile Menu */}
      <div className="relative">
        <TwainPageHeader
          title="Help & Support"
          subtitle="Find answers to common questions and learn how to make the most of Twain Story Writer"
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
            onFeedback={handleFeedback}
            onLogout={handleLogout}
          />
        )}
      </div>

      {/* Main Content */}
      <main className="flex-1 bg-gray-100 p-4 lg:p-8">
        <div className="w-[95%] lg:w-[70%] mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <Typography
              variant="h5"
              sx={{
                fontFamily: "'Rubik', sans-serif",
                fontWeight: 600,
                marginBottom: 3,
                color: "rgb(31, 41, 55)",
                textAlign: "center",
              }}
            >
              Frequently Asked Questions
            </Typography>

            <Box sx={{ maxWidth: "100%" }}>
              {helpTopics.map((topic) => (
                <Accordion
                  key={topic.id}
                  expanded={expanded === topic.id}
                  onChange={handleChange(topic.id)}
                  sx={{
                    marginBottom: 1,
                    boxShadow: "none",
                    border: "1px solid rgb(229, 231, 235)",
                    "&:before": {
                      display: "none",
                    },
                    "&.Mui-expanded": {
                      margin: "0 0 8px 0",
                    },
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    sx={{
                      backgroundColor: "rgb(249, 250, 251)",
                      "&.Mui-expanded": {
                        backgroundColor: "rgb(243, 244, 246)",
                      },
                    }}
                  >
                    <Typography
                      sx={{
                        fontFamily: "'Rubik', sans-serif",
                        fontWeight: 500,
                        color: "rgb(31, 41, 55)",
                      }}
                    >
                      {topic.title}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails
                    sx={{
                      backgroundColor: "white",
                      padding: "16px 24px",
                    }}
                  >
                    <Typography
                      sx={{
                        fontFamily: "'Rubik', sans-serif",
                        color: "rgb(55, 65, 81)",
                        lineHeight: 1.6,
                        whiteSpace: "pre-line",
                      }}
                    >
                      {topic.content}
                    </Typography>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>

            {/* Additional Support Section */}
            <Box
              sx={{
                marginTop: 4,
                padding: 3,
                backgroundColor: "rgb(243, 244, 246)",
                borderRadius: 2,
                textAlign: "center",
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontFamily: "'Rubik', sans-serif",
                  fontWeight: 600,
                  color: "rgb(31, 41, 55)",
                  marginBottom: 1,
                }}
              >
                Still Need Help?
              </Typography>
              <Typography
                sx={{
                  fontFamily: "'Rubik', sans-serif",
                  color: "rgb(107, 114, 128)",
                  marginBottom: 2,
                }}
              >
                Can&apos;t find what you&apos;re looking for? We&apos;re here to
                help!
              </Typography>
              <Typography
                sx={{
                  fontFamily: "'Rubik', sans-serif",
                  color: "rgb(55, 65, 81)",
                }}
              >
                Use the <strong>Feedback</strong> option in your profile menu to
                send us a message, report bugs, or request new features. We
                typically respond within 24-48 hours.
              </Typography>
            </Box>
          </div>
        </div>
      </main>

      {/* Footer */}
      <TwainPageFooter />
    </div>
  );
};

export default HelpPage;
