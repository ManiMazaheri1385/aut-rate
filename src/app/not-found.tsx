import Link from "next/link";
import { SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <SearchX className="h-12 w-12 text-muted-foreground/40" />
      <h1 className="text-xl font-extrabold">صفحه مورد نظر یافت نشد</h1>
      <p className="text-sm text-muted-foreground">
        آدرس وارد شده معتبر نیست یا محتوای آن حذف شده است.
      </p>
      <Link
        href="/"
        className="mt-2 rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        بازگشت به خانه
      </Link>
    </div>
  );
}
