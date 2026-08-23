import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) redirect("/login");

  // Fresh suspension state (session JWT may be stale).
  const fresh = await db.user.findUnique({
    where: { id: sessionUser.id },
    select: { suspended: true, role: true },
  });
  if (!fresh) redirect("/login");
  if (fresh.suspended) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <p className="rounded-lg bg-card px-6 py-8 text-center text-sm font-medium shadow">
          حساب کاربری شما تعلیق شده است
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
