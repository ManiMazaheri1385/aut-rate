import Link from "next/link";
import { Seal } from "@/components/seal";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <Link href="/" className="mb-6 flex items-center gap-3">
        <Seal size={52} />
        <div>
          <p className="font-display text-xl font-bold leading-tight">استادسنجی امیرکبیر</p>
          <p className="text-xs text-muted-foreground">دانشگاه صنعتی امیرکبیر</p>
        </div>
      </Link>
      {children}
    </div>
  );
}
