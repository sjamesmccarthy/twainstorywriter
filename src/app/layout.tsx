import type { Metadata } from "next";
import {
  Geist,
  Geist_Mono,
  IBM_Plex_Sans,
  Spectral,
  JetBrains_Mono,
  Rubik,
  Alike,
  Crimson_Text,
} from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
// import AppsMenu from "@/components/AppsMenu";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-ibm-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const spectral = Spectral({
  variable: "--font-spectral",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const alike = Alike({
  variable: "--font-alike",
  subsets: ["latin"],
  weight: ["400"],
});

const crimsonText = Crimson_Text({
  variable: "--font-crimson-text",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: "hikerbikerwriter",
  description:
    "Adventures in hiking, biking, and writing as well as a little bbq",
  icons: {
    icon: "/icon.png",
    shortcut: "/favicon.ico",
    apple: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${ibmPlexSans.variable} ${spectral.variable} ${jetBrainsMono.variable} ${rubik.variable} ${alike.variable} ${crimsonText.variable} antialiased`}
      >
        {/* <AppsMenu /> */}
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
