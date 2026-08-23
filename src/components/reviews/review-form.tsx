"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { StarRating } from "@/components/star-rating";
import { reviewCreateSchema, type ReviewCreateInput } from "@/lib/validations/review";
import { t, tf } from "@/lib/i18n";
import { formatNumberFa } from "@/lib/utils";
import { apiFetch } from "@/lib/client-api";

interface CourseOption {
  id: string;
  code: string;
  name: string;
}

interface ReviewFormProps {
  professorId: string;
  courses: CourseOption[];
  disabledReason?: string | null;
}

/** Persian review submission form ("ثبت نظر جدید"). */
export function ReviewForm({ professorId, courses, disabledReason }: ReviewFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [submitting, setSubmitting] = React.useState(false);

  const form = useForm<ReviewCreateInput>({
    resolver: zodResolver(reviewCreateSchema),
    defaultValues: {
      professorId,
      courseId: "",
      rating: 0 as unknown as number,
      difficulty: 3,
      wouldTakeAgain: true,
      comment: "",
      anonymous: false,
    },
  });

  const rating = Number(form.watch("rating") ?? 0);
  const difficulty = Number(form.watch("difficulty") ?? 3);
  const comment = String(form.watch("comment") ?? "");
  const remaining = Math.max(0, 20 - comment.trim().length);

  async function onSubmit(values: ReviewCreateInput) {
    setSubmitting(true);
    try {
      await apiFetch("/api/reviews", { method: "POST", body: JSON.stringify(values) });
      toast.success(t("review.successToast"));
      form.reset();
      await queryClient.invalidateQueries({ queryKey: ["reviews"] });
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("review.errorToast"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("review.formTitle")}</CardTitle>
        <p className="text-xs text-muted-foreground">{t("review.editWindowNote")}</p>
      </CardHeader>
      <CardContent>
        {disabledReason ? (
          <p className="rounded-md bg-accent px-4 py-3 text-sm text-accent-foreground">{disabledReason}</p>
        ) : (
          <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
            {/* Course selection */}
            <div className="space-y-2">
              <Label htmlFor="course-select">{t("review.courseLabel")}</Label>
              <Select
                id="course-select"
                value={String(form.watch("courseId") ?? "")}
                onChange={(e) =>
                  form.setValue("courseId", e.target.value, { shouldValidate: true })
                }
              >
                <option value="" disabled>
                  {t("review.coursePlaceholder")}
                </option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </Select>
              {form.formState.errors.courseId && (
                <p className="text-xs text-destructive">{t("errors.notFoundCourse")}</p>
              )}
            </div>

            {/* Rating */}
            <div className="space-y-2">
              <Label>{t("review.ratingLabel")}</Label>
              <div className="flex items-center gap-3">
                <StarRating
                  value={rating}
                  onChange={(v) => form.setValue("rating", v, { shouldValidate: true })}
                  size="lg"
                />
                <span className="text-sm font-medium text-primary">
                  {rating > 0 ? t("review.ratingHint") : null}
                </span>
              </div>
              {form.formState.errors.rating && (
                <p className="text-xs text-destructive">{form.formState.errors.rating.message}</p>
              )}
            </div>

            {/* Difficulty */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="difficulty-range">{t("review.difficultyLabel")}</Label>
                <span className="text-sm font-bold text-primary">{formatNumberFa(difficulty)}</span>
              </div>
              <Input
                id="difficulty-range"
                type="range"
                min={1}
                max={5}
                step={1}
                value={difficulty}
                onChange={(e) => form.setValue("difficulty", Number(e.target.value))}
                className="h-2 cursor-pointer p-0 accent-[hsl(var(--primary))]"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{t("review.difficultyEasy")}</span>
                <span>{t("review.difficultyHard")}</span>
              </div>
            </div>

            {/* Would take again */}
            <div className="space-y-2">
              <Label>{t("review.wouldTakeAgain")}</Label>
              <div className="flex gap-2">
                {[true, false].map((val, i) => (
                  <button
                    key={String(val)}
                    type="button"
                    onClick={() => form.setValue("wouldTakeAgain", val)}
                    className={`rounded-md border px-4 py-1.5 text-sm transition-colors ${
                      form.watch("wouldTakeAgain") === val
                        ? "border-primary bg-primary text-primary-foreground"
                        : "bg-card hover:bg-secondary"
                    }`}
                  >
                    {i === 0 ? t("common.yes") : t("common.no")}
                  </button>
                ))}
              </div>
            </div>

            {/* Comment */}
            <div className="space-y-2">
              <Label htmlFor="comment-textarea">{t("review.commentLabel")}</Label>
              <Textarea
                id="comment-textarea"
                value={comment}
                onChange={(e) => form.setValue("comment", e.target.value, { shouldValidate: true })}
                placeholder={t("review.commentPlaceholder")}
              />
              {remaining > 0 && (
                <p className="text-xs text-muted-foreground">
                  {tf("review.charsRemaining", { count: formatNumberFa(remaining) })}
                </p>
              )}
              {form.formState.errors.comment && (
                <p className="text-xs text-destructive">{form.formState.errors.comment.message}</p>
              )}
            </div>

            {/* Anonymous */}
            <label className="flex w-fit cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 accent-[hsl(var(--primary))]"
                checked={Boolean(form.watch("anonymous"))}
                onChange={(e) => form.setValue("anonymous", e.target.checked)}
              />
              {t("review.anonymousLabel")}
            </label>

            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {t("review.submitButton")}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
