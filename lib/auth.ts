import type { NextAuthConfig } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import prisma from "@/lib/db";
import { loginSchema } from "@/lib/validations/auth";

export const authConfig = {
  adapter: PrismaAdapter(prisma),
  trustHost: true,
  session: {
    strategy: "jwt",
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      async authorize(credentials) {
        try {
          const { email, password } = loginSchema.parse(credentials);

          const user = await prisma.user.findUnique({
            where: { email }
          });

          if (!user || !user.passwordHash) {
            return null;
          }

          const isCorrectPassword = await bcrypt.compare(
            password,
            user.passwordHash
          );

          if (!isCorrectPassword) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          };
        } catch {
          return null;
        }
      }
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Allow credentials login (existing users with passwords)
      if (account?.provider === "credentials") {
        return true;
      }

      // For OAuth providers (Google, etc.)
      if (account?.provider === "google") {
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! }
        });

        if (existingUser) {
          // User exists - PrismaAdapter will handle Account linking automatically
          return true;
        }

        // Check if there's a valid invite for this email
        const invite = await prisma.userInvite.findFirst({
          where: {
            email: user.email!,
            status: "PENDING",
            expiresAt: { gt: new Date() }
          }
        });

        if (invite) {
          // Create the user account - PrismaAdapter will handle Account linking
          const newUser = await prisma.user.create({
            data: {
              email: user.email!,
              name: user.name,
              image: user.image,
              role: "USER",
            }
          });

          // Accept the invite
          await prisma.userInvite.update({
            where: { id: invite.id },
            data: {
              status: "ACCEPTED",
              usedAt: new Date()
            }
          });

          // Update the user object for the JWT callback
          user.id = newUser.id;
          user.role = newUser.role;

          return true;
        }

        // No existing user or invite - create pending application
        await prisma.pendingUser.upsert({
          where: { email: user.email! },
          create: {
            email: user.email!,
            name: user.name,
            image: user.image,
            provider: account.provider,
            providerAccountId: account.providerAccountId,
            status: "PENDING"
          },
          update: {
            name: user.name,
            image: user.image,
            status: "PENDING", // Reset to pending if they try again
          }
        });

        // Deny sign-in
        return false;
      }

      return false;
    },
    async jwt({ token, user, account, trigger }) {
      // Initial sign in
      if (user) {
        // For credentials provider, user object has all fields
        if (account?.provider === "credentials") {
          token.role = user.role;
          token.id = user.id;
        }
        // For OAuth providers, fetch user from database
        else if (account?.provider === "google") {
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email! }
          });

          if (dbUser) {
            token.role = dbUser.role;
            token.id = dbUser.id;
          }
        }
      }

      return token;
    },
    session({ session, token }) {
      if (session.user && token.role && token.id) {
        session.user.role = token.role;
        session.user.id = token.id;
      }
      return session;
    }
  },
  pages: {
    signIn: "/login",
  },
} satisfies NextAuthConfig;
