import NextAuth, { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { isUserAllowed, addOrUpdateUser } from "../../../src/lib/users";

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
    async signIn({ user, account }) {
      // Check if the user's email is in the users.json file
      if (user.email && isUserAllowed(user.email)) {
        // Update user info in users.json with Google data
        try {
          addOrUpdateUser({
            email: user.email,
            name: user.name || "",
            image: user.image || "",
            provider_id: account?.providerAccountId || "",
          });
        } catch (error) {
          console.error("Error updating user info:", error);
        }
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
