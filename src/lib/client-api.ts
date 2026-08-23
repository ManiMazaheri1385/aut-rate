"use client";

import { t } from "@/lib/i18n";

/**
 * Small fetch wrapper matching the API envelope { success, data | message }.
 */
export async function apiFetch<T = unknown>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: init?.body instanceof FormData ? undefined : { "Content-Type": "application/json" },
    ...init,
  });
  let json: { success?: boolean; data?: T; message?: string } | null = null;
  try {
    json = await res.json();
  } catch {
    // non-JSON response
  }
  if (!res.ok || !json?.success) {
    throw new Error(json?.message ?? t("common.error"));
  }
  return json.data as T;
}
