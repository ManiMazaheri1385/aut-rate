import { t } from "@/lib/i18n";

export function Footer() {
  return (
    <footer className="mt-16 border-t bg-card">
      <div className="container flex flex-col items-center gap-2 py-8 text-center">
        <p className="text-sm font-medium">{t("common.appName")}</p>
        <p className="text-xs text-muted-foreground">
          {t("common.faculty")} — {t("common.university")}
        </p>
      </div>
    </footer>
  );
}
