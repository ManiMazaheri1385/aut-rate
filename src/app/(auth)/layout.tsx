import { GraduationCap } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-bl from-primary/5 via-background to-primary/10 p-4">
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <GraduationCap className="h-7 w-7" />
        </span>
        <div>
          <p className="text-lg font-extrabold">استادسنجی امیرکبیر</p>
          <p className="text-xs text-muted-foreground">دانشگاه صنعتی امیرکبیر</p>
        </div>
      </div>
      {children}
    </div>
  );
}
