import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  secret: process.env.NEXTAUTH_SECRET,
});

export const { GET, POST } = handlers;
