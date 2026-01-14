import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import prisma from "@/lib/db";
import { loginSchema } from "@/lib/validations/auth";

export const authConfig = {
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
    async jwt({ token, user, account }) {
      if (user) {
        token.role = user.role || "USER";
        token.id = user.id;

        // For OAuth users, ensure role is set in database on first login
        if (account && !user.role) {
          await prisma.user.update({
            where: { id: user.id },
            data: { role: "USER" }
          });
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
