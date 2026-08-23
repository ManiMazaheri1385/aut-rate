"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth, useClerk, useUser } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { LayoutDashboard, ShieldCheck, LogOut, UserRound } from "lucide-react";
import { Seal } from "@/components/seal";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SearchBar } from "@/components/search-bar";
import { isClerkConfigured } from "@/lib/clerk-config";
import { t } from "@/lib/i18n";
import { nameInitials } from "@/lib/utils";

/** Minimal shape returned by GET /api/me. */
interface MeResponse {
  success: boolean;
  data: null | {
    id: string;
    name: string;
    email: string;
    role: "STUDENT" | "PROFESSOR" | "ADMIN";
    studentId: string | null;
    image: string | null;
    suspended: boolean;
  };
}

export function Navbar() {
  // Without Clerk keys the site stays fully browsable as a public catalog.
  return isClerkConfigured ? <NavbarWithAuth /> : <NavbarShell signedInArea={null} />;
}

function NavbarShell({ signedInArea }: { signedInArea: React.ReactNode }) {
  const pathname = usePathname();

  const links = [
    { href: "/", label: t("nav.home") },
    { href: "/professors", label: t("nav.professors") },
    { href: "/courses", label: t("nav.courses") },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="container flex h-16 items-center gap-4">
        {/* Brand: the bare registry mark, no tile behind it */}
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <Seal size={38} className="hidden sm:block" />
          <span className="flex flex-col leading-tight">
            <span className="font-display text-lg font-bold">{t("common.appName")}</span>
            <span className="text-[10px] text-muted-foreground">{t("common.faculty")}</span>
          </span>
        </Link>

        {/* Nav links */}
        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-secondary ${
                pathname === link.href ? "text-primary" : "text-foreground/80"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Search */}
        <div className="mx-auto hidden w-full max-w-md lg:block">
          <SearchBar placeholder={t("search.placeholderFull")} />
        </div>

        {/* Session actions */}
        <div className="ms-auto flex items-center gap-2">{signedInArea}</div>
      </div>

      {/* Mobile search */}
      <div className="container pb-3 lg:hidden">
        <SearchBar placeholder={t("search.placeholderFull")} />
      </div>
    </header>
  );
}

function NavbarWithAuth() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const clerk = useClerk();

  // Role lives in our own database; fetch it only while signed in.
  const { data: me } = useQuery({
    queryKey: ["me"],
    enabled: isSignedIn === true,
    staleTime: 60_000,
    queryFn: async (): Promise<MeResponse["data"]> => {
      try {
        const res = await fetch("/api/me");
        const json = (await res.json()) as MeResponse;
        return json.data ?? null;
      } catch {
        return null;
      }
    },
  });

  const displayName = me?.name ?? user?.fullName ?? user?.firstName ?? "";
  const email = me?.email ?? user?.primaryEmailAddress?.emailAddress ?? "";
  const imageUrl = me?.image ?? user?.imageUrl ?? "";
  const role = me?.role;

  const signedInArea = !isLoaded ? (
    <div className="h-9 w-9 animate-pulse rounded-full bg-secondary" />
  ) : isSignedIn ? (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button aria-label={displayName} className="rounded-full outline-none ring-primary focus-visible:ring-2">
          <Avatar className="h-9 w-9 border">
            {imageUrl ? <AvatarImage src={imageUrl} alt={displayName} /> : null}
            <AvatarFallback>{nameInitials(displayName)}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52">
        <div className="px-3 py-2">
          <p className="text-sm font-medium">{displayName}</p>
          <p dir="ltr" className="truncate text-xs text-muted-foreground">
            {email}
          </p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/dashboard")}>
          <LayoutDashboard className="h-4 w-4" />
          {t("nav.dashboard")}
        </DropdownMenuItem>
        {role === "PROFESSOR" && (
          <DropdownMenuItem onClick={() => router.push("/dashboard?tab=professor")}>
            <UserRound className="h-4 w-4" />
            {t("professor.profile")}
          </DropdownMenuItem>
        )}
        {role === "ADMIN" && (
          <DropdownMenuItem onClick={() => router.push("/admin")}>
            <ShieldCheck className="h-4 w-4" />
            {t("nav.admin")}
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={() => void clerk.signOut({ redirectUrl: "/" })}
        >
          <LogOut className="h-4 w-4" />
          {t("nav.logout")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ) : (
    <Button size="sm" onClick={() => router.push("/login")}>
      {t("nav.login")}
    </Button>
  );

  return <NavbarShell signedInArea={signedInArea} />;
}
