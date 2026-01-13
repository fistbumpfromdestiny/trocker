import { redirect } from "next/navigation";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { Header } from "@/components/layout/header";
import { StatusBar } from "@/components/layout/status-bar";

export default async function MessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session || !session.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background font-mono flex flex-col">
      <Header user={session.user} />
      <main className="flex-1 flex flex-col">
        {children}
      </main>
      <StatusBar />
    </div>
  );
}
