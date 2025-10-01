import NextAuth, { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import pool from "../../../src/lib/db";

// Function to check if user is allowed
async function isUserAllowed(email: string): Promise<boolean> {
  try {
    const [rows] = await pool.execute("SELECT id FROM users WHERE email = ?", [
      email,
    ]);
    return Array.isArray(rows) && rows.length > 0;
  } catch (error) {
    console.error("Error checking user permission:", error);
    return false;
  }
}

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/auth/signin", // Custom sign-in page
    error: "/auth/access-denied", // Custom error page
  },
  callbacks: {
    async signIn({ user }) {
      // Check if the user's email is in the users table
      if (user.email && (await isUserAllowed(user.email))) {
        return true;
      }
      // Redirect to signup page with user email
      return `/auth/signup?email=${encodeURIComponent(user.email || "")}`;
    },
    async session({ session }) {
      // You can add additional user info to the session here if needed
      return session;
    },
    async jwt({ token }) {
      // Persist additional user info in the token if needed
      return token;
    },
  },
};

export default NextAuth(authOptions);
