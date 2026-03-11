import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { upsertUser, getUser } from "./db";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user.id || !user.name || !user.email) return false;
      upsertUser({
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image ?? undefined,
      });
      return true;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        const dbUser = getUser(token.sub);
        if (dbUser) {
          session.user.isAdmin = dbUser.is_admin === 1;
          session.user.balance = dbUser.balance;
        }
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
  },
  pages: {
    signIn: "/",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

// Helper to check if user is admin
export function isAdmin(userId: string): boolean {
  const user = getUser(userId);
  return user?.is_admin === 1;
}
