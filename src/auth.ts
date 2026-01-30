import NextAuth, { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise from "./lib/mongodb";

console.log("[NextAuth] Initializing...");
console.log("[NextAuth] Config check:", {
  hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
  hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
  hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
  hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
  nextAuthUrl: process.env.NEXTAUTH_URL,
});

export const authConfig: NextAuthConfig = {
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        console.log("[NextAuth] JWT callback - User signed in:", {
          userId: user.id?.substring(0, 8) + "...",
        });
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      console.log("[NextAuth] Session callback:", {
        hasToken: !!token,
        hasUser: !!session.user,
        userId: token.id?.toString().substring(0, 8) + "...",
      });
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
