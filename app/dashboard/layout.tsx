import { redirect } from "next/navigation";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { Header } from "@/components/layout/header";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session || !session.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background font-mono">
      <Header user={session.user} />
      <main className="container mx-auto px-4 py-6 md:py-8 max-w-7xl relative z-10">
        {children}
      </main>
    </div>
  );
}
