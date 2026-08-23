import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/guards";
import { AdminPanel } from "@/components/admin/admin-panel";
import { Navbar } from "@/components/navbar";

export const metadata = { title: "پنل مدیریت" };

export default async function AdminPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <p className="rounded-lg bg-card px-6 py-8 text-center text-sm font-medium shadow">
          شما اجازه دسترسی به این بخش را ندارید
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <AdminPanel adminName={user.name ?? ""} />
      </main>
    </div>
  );
}
