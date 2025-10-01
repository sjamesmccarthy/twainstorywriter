"use client";

import React from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Typography, Box } from "@mui/material";
import TwainPageHeader from "@/components/TwainPageHeader";
import TwainPageFooter from "@/components/TwainPageFooter";
import TwainProfileMenu from "@/components/TwainProfileMenu";
import { useUserPreferences } from "@/hooks/useUserPreferences";

const TermsAndConditionsPage: React.FC = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const { planType } = useUserPreferences();

  const handleBackToBookshelf = () => {
    router.push("/bookshelf");
  };

  const handleAccountSettings = () => {
    router.push("/account-settings");
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
    // Will be handled by the profile menu
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header with Profile Menu */}
      <div className="relative">
        <TwainPageHeader
          title="Terms and Conditions"
          subtitle="Please read these terms carefully before using Twain Story Writer"
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
          <div className="bg-white rounded-lg shadow-sm p-8">
            <Box sx={{ maxWidth: "100%" }}>
              {/* Last Updated */}
              <Typography
                variant="body2"
                sx={{
                  fontFamily: "'Rubik', sans-serif",
                  color: "rgb(107, 114, 128)",
                  marginBottom: 3,
                  textAlign: "center",
                  fontStyle: "italic",
                }}
              >
                Last updated: October 1, 2025
              </Typography>

              {/* Introduction */}
              <Typography
                variant="h6"
                sx={{
                  fontFamily: "'Rubik', sans-serif",
                  fontWeight: 600,
                  color: "rgb(31, 41, 55)",
                  marginBottom: 2,
                }}
              >
                1. Introduction
              </Typography>
              <Typography
                sx={{
                  fontFamily: "'Rubik', sans-serif",
                  color: "rgb(55, 65, 81)",
                  lineHeight: 1.6,
                  marginBottom: 3,
                }}
              >
                Welcome to Twain Story Writer (&quot;we&quot;, &quot;our&quot;,
                or &quot;us&quot;). These Terms and Conditions
                (&quot;Terms&quot;) govern your use of our web application and
                services. By accessing or using Twain Story Writer, you agree to
                be bound by these Terms. If you do not agree to these Terms,
                please do not use our service.
              </Typography>

              {/* Beta Software */}
              <Typography
                variant="h6"
                sx={{
                  fontFamily: "'Rubik', sans-serif",
                  fontWeight: 600,
                  color: "rgb(31, 41, 55)",
                  marginBottom: 2,
                }}
              >
                2. Beta Software Notice
              </Typography>
              <Typography
                sx={{
                  fontFamily: "'Rubik', sans-serif",
                  color: "rgb(55, 65, 81)",
                  lineHeight: 1.6,
                  marginBottom: 3,
                }}
              >
                Twain Story Writer is currently in BETA. This means the software
                is still in development and testing. You may experience bugs,
                incomplete features, or service interruptions. We appreciate
                your feedback and patience as we continue to improve the
                platform. Use of beta software is at your own risk.
              </Typography>

              {/* User Accounts */}
              <Typography
                variant="h6"
                sx={{
                  fontFamily: "'Rubik', sans-serif",
                  fontWeight: 600,
                  color: "rgb(31, 41, 55)",
                  marginBottom: 2,
                }}
              >
                3. User Accounts and Registration
              </Typography>
              <Typography
                sx={{
                  fontFamily: "'Rubik', sans-serif",
                  color: "rgb(55, 65, 81)",
                  lineHeight: 1.6,
                  marginBottom: 3,
                }}
              >
                To use certain features of our service, you may need to create
                an account. You are responsible for maintaining the
                confidentiality of your account credentials and for all
                activities that occur under your account. You agree to provide
                accurate, current, and complete information during registration
                and to update such information as necessary.
              </Typography>

              {/* Content Ownership */}
              <Typography
                variant="h6"
                sx={{
                  fontFamily: "'Rubik', sans-serif",
                  fontWeight: 600,
                  color: "rgb(31, 41, 55)",
                  marginBottom: 2,
                }}
              >
                4. Content Ownership and Rights
              </Typography>
              <Typography
                sx={{
                  fontFamily: "'Rubik', sans-serif",
                  color: "rgb(55, 65, 81)",
                  lineHeight: 1.6,
                  marginBottom: 3,
                }}
              >
                <strong>Your Content:</strong> You retain full ownership of all
                content you create using Twain Story Writer, including but not
                limited to stories, books, text, and other creative works. We do
                not claim any ownership rights to your content.
                <br />
                <br />
                <strong>Our Platform:</strong> The Twain Story Writer software,
                interface, design, and functionality are owned by us and
                protected by intellectual property laws. You may not copy,
                modify, distribute, or create derivative works based on our
                platform.
              </Typography>

              {/* Data Storage */}
              <Typography
                variant="h6"
                sx={{
                  fontFamily: "'Rubik', sans-serif",
                  fontWeight: 600,
                  color: "rgb(31, 41, 55)",
                  marginBottom: 2,
                }}
              >
                5. Data Storage and Privacy
              </Typography>
              <Typography
                sx={{
                  fontFamily: "'Rubik', sans-serif",
                  color: "rgb(55, 65, 81)",
                  lineHeight: 1.6,
                  marginBottom: 3,
                }}
              >
                <strong>Local Storage:</strong> Your content is primarily stored
                locally in your browser. We are not responsible for data loss
                due to browser issues, device problems, or user actions.
                <br />
                <br />
                <strong>Cloud Storage (Professional Plans):</strong>{" "}
                Professional subscribers may access cloud storage features. We
                implement reasonable security measures but cannot guarantee
                absolute security of cloud-stored data.
                <br />
                <br />
                <strong>Privacy:</strong> We respect your privacy and handle
                your personal information in accordance with our Privacy Policy,
                which forms part of these Terms.
              </Typography>

              {/* Subscription Plans */}
              <Typography
                variant="h6"
                sx={{
                  fontFamily: "'Rubik', sans-serif",
                  fontWeight: 600,
                  color: "rgb(31, 41, 55)",
                  marginBottom: 2,
                }}
              >
                6. Subscription Plans and Billing
              </Typography>
              <Typography
                sx={{
                  fontFamily: "'Rubik', sans-serif",
                  color: "rgb(55, 65, 81)",
                  lineHeight: 1.6,
                  marginBottom: 3,
                }}
              >
                <strong>Free Plan:</strong> We offer a free plan with basic
                features and local storage.
                <br />
                <br />
                <strong>Professional Plan:</strong> Paid subscriptions provide
                additional features including cloud storage and export
                capabilities. Billing occurs monthly unless cancelled. You may
                cancel your subscription at any time, and cancellation will take
                effect at the end of your current billing period.
                <br />
                <br />
                <strong>Refunds:</strong> Refunds are handled on a case-by-case
                basis. Please contact our support team for refund requests.
              </Typography>

              {/* Acceptable Use */}
              <Typography
                variant="h6"
                sx={{
                  fontFamily: "'Rubik', sans-serif",
                  fontWeight: 600,
                  color: "rgb(31, 41, 55)",
                  marginBottom: 2,
                }}
              >
                7. Acceptable Use Policy
              </Typography>
              <Typography
                sx={{
                  fontFamily: "'Rubik', sans-serif",
                  color: "rgb(55, 65, 81)",
                  lineHeight: 1.6,
                  marginBottom: 3,
                }}
              >
                You agree not to use Twain Story Writer for any unlawful
                purposes or in any way that could harm, disable, or impair the
                service. You may not use our platform to create, store, or
                distribute content that is illegal, harmful, threatening,
                abusive, or violates the rights of others.
              </Typography>

              {/* Service Availability */}
              <Typography
                variant="h6"
                sx={{
                  fontFamily: "'Rubik', sans-serif",
                  fontWeight: 600,
                  color: "rgb(31, 41, 55)",
                  marginBottom: 2,
                }}
              >
                8. Service Availability and Maintenance
              </Typography>
              <Typography
                sx={{
                  fontFamily: "'Rubik', sans-serif",
                  color: "rgb(55, 65, 81)",
                  lineHeight: 1.6,
                  marginBottom: 3,
                }}
              >
                We strive to maintain high service availability but cannot
                guarantee uninterrupted access. We may perform maintenance,
                updates, or modifications that could temporarily affect service
                availability. As beta software, you may experience more frequent
                updates and potential service interruptions.
              </Typography>

              {/* Limitation of Liability */}
              <Typography
                variant="h6"
                sx={{
                  fontFamily: "'Rubik', sans-serif",
                  fontWeight: 600,
                  color: "rgb(31, 41, 55)",
                  marginBottom: 2,
                }}
              >
                9. Limitation of Liability
              </Typography>
              <Typography
                sx={{
                  fontFamily: "'Rubik', sans-serif",
                  color: "rgb(55, 65, 81)",
                  lineHeight: 1.6,
                  marginBottom: 3,
                }}
              >
                To the maximum extent permitted by law, Twain Story Writer and
                its creators shall not be liable for any indirect, incidental,
                special, consequential, or punitive damages, including but not
                limited to loss of data, loss of profits, or business
                interruption, arising from your use of the service.
              </Typography>

              {/* Termination */}
              <Typography
                variant="h6"
                sx={{
                  fontFamily: "'Rubik', sans-serif",
                  fontWeight: 600,
                  color: "rgb(31, 41, 55)",
                  marginBottom: 2,
                }}
              >
                10. Termination
              </Typography>
              <Typography
                sx={{
                  fontFamily: "'Rubik', sans-serif",
                  color: "rgb(55, 65, 81)",
                  lineHeight: 1.6,
                  marginBottom: 3,
                }}
              >
                Either party may terminate these Terms at any time. You may stop
                using the service and delete your account. We may suspend or
                terminate your access if you violate these Terms. Upon
                termination, your right to use the service ceases immediately.
              </Typography>

              {/* Changes to Terms */}
              <Typography
                variant="h6"
                sx={{
                  fontFamily: "'Rubik', sans-serif",
                  fontWeight: 600,
                  color: "rgb(31, 41, 55)",
                  marginBottom: 2,
                }}
              >
                11. Changes to These Terms
              </Typography>
              <Typography
                sx={{
                  fontFamily: "'Rubik', sans-serif",
                  color: "rgb(55, 65, 81)",
                  lineHeight: 1.6,
                  marginBottom: 3,
                }}
              >
                We may update these Terms from time to time. When we make
                changes, we will update the &quot;Last updated&quot; date at the
                top of this page. Your continued use of the service after such
                changes constitutes acceptance of the new Terms.
              </Typography>

              {/* Governing Law */}
              <Typography
                variant="h6"
                sx={{
                  fontFamily: "'Rubik', sans-serif",
                  fontWeight: 600,
                  color: "rgb(31, 41, 55)",
                  marginBottom: 2,
                }}
              >
                12. Governing Law
              </Typography>
              <Typography
                sx={{
                  fontFamily: "'Rubik', sans-serif",
                  color: "rgb(55, 65, 81)",
                  lineHeight: 1.6,
                  marginBottom: 3,
                }}
              >
                These Terms shall be governed by and construed in accordance
                with the laws of the jurisdiction where Twain Story Writer
                operates, without regard to its conflict of law provisions.
              </Typography>

              {/* Contact Information */}
              <Typography
                variant="h6"
                sx={{
                  fontFamily: "'Rubik', sans-serif",
                  fontWeight: 600,
                  color: "rgb(31, 41, 55)",
                  marginBottom: 2,
                }}
              >
                13. Contact Information
              </Typography>
              <Typography
                sx={{
                  fontFamily: "'Rubik', sans-serif",
                  color: "rgb(55, 65, 81)",
                  lineHeight: 1.6,
                  marginBottom: 4,
                }}
              >
                If you have any questions about these Terms and Conditions,
                please contact us through the Feedback option in your profile
                menu or through our support channels.
              </Typography>

              {/* Agreement Notice */}
              <Box
                sx={{
                  marginTop: 4,
                  padding: 3,
                  backgroundColor: "rgb(243, 244, 246)",
                  borderRadius: 2,
                  border: "1px solid rgb(209, 213, 219)",
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    fontFamily: "'Rubik', sans-serif",
                    color: "rgb(55, 65, 81)",
                    textAlign: "center",
                    fontWeight: 500,
                  }}
                >
                  By using Twain Story Writer, you acknowledge that you have
                  read, understood, and agree to be bound by these Terms and
                  Conditions.
                </Typography>
              </Box>
            </Box>
          </div>
        </div>
      </main>

      {/* Footer */}
      <TwainPageFooter />
    </div>
  );
};

export default TermsAndConditionsPage;
