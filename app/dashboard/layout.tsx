import { redirect } from "next/navigation";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { Header } from "@/components/layout/header";
import { StatusBar } from "@/components/layout/status-bar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  console.log('[DASHBOARD] Session check:', {
    hasSession: !!session,
    hasUser: !!session?.user,
    userEmail: session?.user?.email,
  });

  if (!session || !session.user) {
    console.log('[DASHBOARD] No session - redirecting to login');
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background font-mono">
      <Header user={session.user} />
      <main className="container mx-auto px-4 py-6 md:py-8 max-w-7xl relative z-10 pb-16">
        {children}
      </main>
      <StatusBar />
    </div>
  );
}
