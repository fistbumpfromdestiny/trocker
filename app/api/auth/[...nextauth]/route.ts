import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth";

console.log('[NEXTAUTH] Initializing with secret:', process.env.NEXTAUTH_SECRET ? 'SET' : 'NOT SET');
console.log('[NEXTAUTH] NEXTAUTH_URL:', process.env.NEXTAUTH_URL);

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'production',
});

export const { GET, POST } = handlers;
