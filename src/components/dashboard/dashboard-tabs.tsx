"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ReviewCard } from "@/components/reviews/review-card";
import type { ViewerInfo } from "@/components/reviews/review-card";
import { t } from "@/lib/i18n";
import { apiFetch } from "@/lib/client-api";
import { departmentLabel } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { ReviewDto } from "@/types";

interface DashboardTabsProps {
  myReviews: ReviewDto[];
  likedReviews: ReviewDto[];
  favorites: { id: string; name: string; department: string }[];
  viewer: ViewerInfo | null;
}

type TabKey = "my_reviews" | "my_likes" | "favorites";

/** Student dashboard tabs: نظرات من / لایک‌های من / اساتید مورد علاقه. */
export function DashboardTabs({ myReviews, likedReviews, favorites, viewer }: DashboardTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as TabKey) ?? "my_reviews";
  const [tab, setTab] = React.useState<TabKey>(initialTab);

  const tabs: { key: TabKey; label: string }[] = [
    { key: "my_reviews", label: t("dashboard.tabMyReviews") },
    { key: "my_likes", label: t("dashboard.tabMyLikes") },
    { key: "favorites", label: t("dashboard.tabFavorites") },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 border-b pb-3">
        {tabs.map((item) => (
          <button
            key={item.key}
            onClick={() => setTab(item.key)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition-colors",
              tab === item.key ? "bg-primary text-primary-foreground" : "bg-card hover:bg-secondary",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "my_reviews" &&
        (myReviews.length === 0 ? (
          <EmptyState text={t("dashboard.emptyMyReviews")} />
        ) : (
          <div className="space-y-4">
            {myReviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                viewer={viewer}
                showCourse
                onChanged={() => router.refresh()}
              />
            ))}
          </div>
        ))}

      {tab === "my_likes" &&
        (likedReviews.length === 0 ? (
          <EmptyState text={t("dashboard.emptyMyLikes")} />
        ) : (
          <div className="space-y-4">
            {likedReviews.map((review) => (
              <ReviewCard key={review.id} review={review} viewer={viewer} showCourse />
            ))}
          </div>
        ))}

      {tab === "favorites" &&
        (favorites.length === 0 ? (
          <EmptyState text={t("dashboard.emptyFavorites")} />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {favorites.map((fav) => (
              <li key={fav.id}>
                <Link href={`/professors/${fav.id}`}>
                  <Card className="transition-colors hover:border-input">
                    <CardContent className="flex items-center justify-between p-4">
                      <span className="text-sm font-bold">{fav.name}</span>
                      <Badge variant="accent">{departmentLabel(fav.department)}</Badge>
                    </CardContent>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        ))}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="rounded-lg bg-card px-4 py-10 text-center text-sm text-muted-foreground">{text}</p>;
}

/** Inline student ID form shown when the student has not registered one yet. */
export function StudentIdForm() {
  const router = useRouter();
  const [value, setValue] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!/^\d{9}$/.test(value.trim())) {
      toast.error("شناسه دانشجویی باید ۹ رقم باشد");
      return;
    }
    setSaving(true);
    try {
      await apiFetch("/api/me", { method: "PATCH", body: JSON.stringify({ studentId: value.trim() }) });
      toast.success(t("dashboard.studentIdSaved"));
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("common.error"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="flex flex-col gap-2 sm:flex-row">
      <Input
        dir="ltr"
        inputMode="numeric"
        maxLength={9}
        value={value}
        onChange={(e) => setValue(e.target.value.replace(/\D/g, ""))}
        placeholder={t("dashboard.studentIdPlaceholder")}
        className="sm:w-56"
      />
      <Button type="submit" disabled={saving}>
        {saving && <Loader2 className="h-4 w-4 animate-spin" />}
        {t("common.save")}
      </Button>
    </form>
  );
}
