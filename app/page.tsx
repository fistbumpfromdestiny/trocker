import { redirect } from "next/navigation";
import { auth } from "@/app/api/auth/[...nextauth]/route";

export default async function Home() {
  console.log('[ROOT] Home function called');

  let session;
  try {
    session = await auth();
    console.log('[ROOT] auth() returned:', { hasSession: !!session, userEmail: session?.user?.email });
  } catch (error) {
    console.error('[ROOT] auth() threw error:', error);
  }

  redirect("/dashboard");
}
