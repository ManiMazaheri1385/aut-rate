import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes (shadcn/ui convention). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const PERSIAN_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

/** Convert Latin digits inside a string to Persian digits (۰-۹). */
export function toPersianDigits(input: string | number): string {
  return String(input).replace(/[0-9]/g, (d) => PERSIAN_DIGITS[Number(d)]);
}

/** Convert Persian/Arabic digits back to Latin digits. */
export function toLatinDigits(input: string): string {
  return input
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
}

/** Normalize Persian text for search/comparison (unify Yeh/Kaf variants). */
export function normalizePersian(input: string): string {
  return toLatinDigits(input)
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/\u200c+/g, " ")
    .trim();
}

/** Format a number in Persian locale, e.g. 1234 -> ۱٬۲۳۴ */
export function formatNumberFa(value: number, maximumFractionDigits = 0): string {
  try {
    return new Intl.NumberFormat("fa-IR", { maximumFractionDigits }).format(value);
  } catch {
    return toPersianDigits(value.toFixed(maximumFractionDigits));
  }
}

/** Format a rating like 4.25 -> "۴٫۳" (one decimal, Persian digits). */
export function formatRatingFa(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return formatNumberFa(0);
  const rounded = Math.round(value * 10) / 10;
  if (Number.isInteger(rounded)) return formatNumberFa(rounded);
  return formatNumberFa(rounded, 1);
}

/** Format a Date as Jalali calendar with Persian digits, e.g. ۱۴۰۴/۰۶/۰۱ */
export function formatJalaliDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  try {
    return new Intl.DateTimeFormat("fa-IR-u-ca-persian-nu-arabext", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(d);
  } catch {
    // Fallback: ISO date converted to Persian digits
    return toPersianDigits(d.toISOString().slice(0, 10));
  }
}

/** Human friendly relative time in Persian, e.g. «۳ روز پیش». */
export function timeAgoFa(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
  try {
    const rtf = new Intl.RelativeTimeFormat("fa-IR", { numeric: "auto" });
    if (seconds < 60) return rtf.format(-seconds, "second");
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return rtf.format(-minutes, "minute");
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return rtf.format(-hours, "hour");
    const days = Math.floor(hours / 24);
    if (days < 30) return rtf.format(-days, "day");
    const months = Math.floor(days / 30);
    if (months < 12) return rtf.format(-months, "month");
    return rtf.format(-Math.floor(months / 12), "year");
  } catch {
    return formatJalaliDate(d);
  }
}

/** Get initials from a Persian name for avatar fallbacks. */
export function nameInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "؟";
  if (parts.length === 1) return parts[0].slice(0, 1);
  return parts.slice(0, 2).map((p) => p.slice(0, 1)).join("");
}
