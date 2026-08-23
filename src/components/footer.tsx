import Link from "next/link";
import { Seal } from "@/components/seal";
import { t } from "@/lib/i18n";

export function Footer() {
  return (
    <footer className="bg-floor text-primary-foreground">
      <div className="container pb-40 pt-14">
        <div className="flex flex-col items-start justify-between gap-10 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <Seal size={72} tone="mint" />
            <div>
              <p className="font-display text-xl font-semibold">{t("common.appName")}</p>
              <p className="mt-1 text-xs leading-5 text-primary-foreground/60">
                {t("common.faculty")} · {t("common.university")}
              </p>
            </div>
          </div>

          <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-primary-foreground/75">
            <Link href="/professors" className="transition-colors hover:text-primary-foreground">
              {t("nav.professors")}
            </Link>
            <Link href="/courses" className="transition-colors hover:text-primary-foreground">
              {t("nav.courses")}
            </Link>
            <Link href="/login" className="transition-colors hover:text-primary-foreground">
              {t("nav.login")}
            </Link>
          </nav>
        </div>
      </div>

      {/* Oversized wordmark: anchored flush to the bottom edge, bleeding off it on purpose,
          set in the display face with deliberate spacing. Sits above the floor color. */}
      <div aria-hidden className="pointer-events-none select-none overflow-hidden">
        <p
          dir="rtl"
          className="whitespace-nowrap text-center font-display font-bold leading-none tracking-tight text-primary-foreground/[0.07]"
          style={{ fontSize: "clamp(6rem, 22vw, 20rem)", marginBottom: "-0.28em" }}
        >
          {t("common.appName")}
        </p>
      </div>
    </footer>
  );
}
