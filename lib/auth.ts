import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import prisma from "@/lib/db";
import { loginSchema } from "@/lib/validations/auth";

export const authConfig = {
  providers: [
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
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
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
