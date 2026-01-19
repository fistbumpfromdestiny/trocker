import { redirect } from "next/navigation";
import { auth } from "@/app/api/auth/[...nextauth]/route";

export default async function Home() {
  console.log('[ROOT] Accessing root page');
  const session = await auth();
  console.log('[ROOT] Session:', { hasSession: !!session, userEmail: session?.user?.email });
  redirect("/dashboard");
}
