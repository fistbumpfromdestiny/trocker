import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import prisma from "@/lib/db";
import { loginSchema } from "@/lib/validations/auth";

export const authConfig = {
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
          // Check if OAuth account link exists, create if not
          const existingAccount = await prisma.account.findFirst({
            where: {
              userId: existingUser.id,
              provider: account.provider,
              providerAccountId: account.providerAccountId,
            }
          });

          if (!existingAccount) {
            // Create the OAuth account link for existing user
            // Only store essential fields to avoid type conversion issues
            await prisma.account.create({
              data: {
                userId: existingUser.id,
                type: account.type ?? "oauth",
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                access_token: typeof account.access_token === 'string' ? account.access_token : null,
                refresh_token: typeof account.refresh_token === 'string' ? account.refresh_token : null,
                expires_at: typeof account.expires_at === 'number' ? account.expires_at : null,
                token_type: typeof account.token_type === 'string' ? account.token_type : null,
                scope: typeof account.scope === 'string' ? account.scope : null,
                id_token: typeof account.id_token === 'string' ? account.id_token : null,
                session_state: typeof account.session_state === 'string' ? account.session_state : null,
              }
            });
          }

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
          // Create the user account
          const newUser = await prisma.user.create({
            data: {
              email: user.email!,
              name: user.name,
              image: user.image,
              role: "USER",
            }
          });

          // Create the OAuth account link
          // Only store essential fields to avoid type conversion issues
          await prisma.account.create({
            data: {
              userId: newUser.id,
              type: account.type ?? "oauth",
              provider: account.provider,
              providerAccountId: account.providerAccountId,
              access_token: typeof account.access_token === 'string' ? account.access_token : null,
              refresh_token: typeof account.refresh_token === 'string' ? account.refresh_token : null,
              expires_at: typeof account.expires_at === 'number' ? account.expires_at : null,
              token_type: typeof account.token_type === 'string' ? account.token_type : null,
              scope: typeof account.scope === 'string' ? account.scope : null,
              id_token: typeof account.id_token === 'string' ? account.id_token : null,
              session_state: typeof account.session_state === 'string' ? account.session_state : null,
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
    async jwt({ token, user, account }) {
      // Initial sign in
      if (user) {
        // For credentials provider, user object has all fields
        if (account?.provider === "credentials") {
          token.role = user.role;
          token.id = String(user.id);
        }
        // For OAuth providers, fetch user from database
        else if (account?.provider === "google") {
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email! }
          });

          if (dbUser) {
            token.role = dbUser.role;
            token.id = String(dbUser.id);
          }
        }
      }

      return token;
    },
    session({ session, token }) {
      if (session.user && token.role && token.id) {
        session.user.role = token.role;
        session.user.id = String(token.id);
      }
      return session;
    }
  },
  pages: {
    signIn: "/login",
  },
} satisfies NextAuthConfig;
