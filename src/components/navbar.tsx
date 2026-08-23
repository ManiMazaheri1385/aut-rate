"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { GraduationCap, LayoutDashboard, ShieldCheck, LogOut, UserRound } from "lucide-react";
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
import { t } from "@/lib/i18n";
import { nameInitials } from "@/lib/utils";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const user = session?.user;

  const links = [
    { href: "/", label: t("nav.home") },
    { href: "/professors", label: t("nav.professors") },
    { href: "/courses", label: t("nav.courses") },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="container flex h-16 items-center gap-4">
        {/* Brand */}
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <GraduationCap className="h-5 w-5" />
          </span>
          <span className="hidden flex-col leading-tight sm:flex">
            <span className="text-sm font-bold">{t("common.appName")}</span>
            <span className="text-[11px] text-muted-foreground">{t("common.faculty")}</span>
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
        <div className="ms-auto flex items-center gap-2">
          {status === "loading" ? (
            <div className="h-9 w-9 animate-pulse rounded-full bg-secondary" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button aria-label={user.name ?? ""} className="rounded-full outline-none ring-primary focus-visible:ring-2">
                  <Avatar className="h-9 w-9 border">
                    {user.image ? <AvatarImage src={user.image} alt={user.name ?? ""} /> : null}
                    <AvatarFallback>{nameInitials(user.name ?? "")}</AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-52">
                <div className="px-3 py-2">
                  <p className="text-sm font-medium">{user.name}</p>
                  <p dir="ltr" className="truncate text-xs text-muted-foreground">{user.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/dashboard")}>
                  <LayoutDashboard className="h-4 w-4" />
                  {t("nav.dashboard")}
                </DropdownMenuItem>
                {user.role === "PROFESSOR" && (
                  <DropdownMenuItem onClick={() => router.push("/dashboard?tab=professor")}>
                    <UserRound className="h-4 w-4" />
                    {t("professor.profile")}
                  </DropdownMenuItem>
                )}
                {user.role === "ADMIN" && (
                  <DropdownMenuItem onClick={() => router.push("/admin")}>
                    <ShieldCheck className="h-4 w-4" />
                    {t("nav.admin")}
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => signOut({ callbackUrl: "/" })}
                >
                  <LogOut className="h-4 w-4" />
                  {t("nav.logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button size="sm" onClick={() => router.push("/login")}>
                {t("nav.login")}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Mobile search */}
      <div className="container pb-3 lg:hidden">
        <SearchBar placeholder={t("search.placeholderFull")} />
      </div>
    </header>
  );
}
