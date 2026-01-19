import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import prisma from "@/lib/db";
import { loginSchema } from "@/lib/validations/auth";

export const authConfig = {
  trustHost: true,
  useSecureCookies: process.env.NEXTAUTH_URL?.startsWith('https://') ?? false,
  session: {
    strategy: "jwt",
  },
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
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
      console.log('[AUTH] signIn callback - provider:', account?.provider, 'user:', user?.email);

      // Allow credentials login (existing users with passwords)
      if (account?.provider === "credentials") {
        console.log('[AUTH] Allowing credentials login');
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

      console.log('[AUTH] No provider matched - denying sign-in');
      return false;
    },
    async jwt({ token, user, account }) {
      console.log('[AUTH] JWT callback - has user:', !!user, 'has token.id:', !!token.id);

      // Initial sign in
      if (user) {
        console.log('[AUTH] JWT - Initial sign in, provider:', account?.provider);
        // For credentials provider, user object has all fields
        if (account?.provider === "credentials") {
          console.log('[AUTH] JWT - Setting credentials user data');
          token.role = user.role;
          token.id = String(user.id);
        }
        // For OAuth providers, fetch user from database
        else if (account?.provider === "google") {
          console.log('[AUTH] JWT - Fetching Google user from db');
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email! }
          });

          if (dbUser) {
            console.log('[AUTH] JWT - Setting Google user data');
            token.role = dbUser.role;
            token.id = String(dbUser.id);
          }
        }
      }

      console.log('[AUTH] JWT - Returning token with id:', token.id);
      return token;
    },
    session({ session, token }) {
      console.log('[AUTH] Session callback - token.id:', token.id, 'token.role:', token.role);
      if (session.user && token.role && token.id) {
        session.user.role = token.role;
        session.user.id = String(token.id);
      }
      console.log('[AUTH] Session - returning session for user:', session.user?.email);
      return session;
    }
  },
  pages: {
    signIn: "/login",
  },
} satisfies NextAuthConfig;
