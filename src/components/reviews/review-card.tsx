"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Flag, MessageSquare, Pencil, ThumbsUp, Trash2, CornerDownLeft, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { StarRating } from "@/components/star-rating";
import { ReportDialog } from "@/components/reviews/report-dialog";
import { CommentsSection } from "@/components/reviews/comments-section";
import { reviewUpdateSchema, replySchema } from "@/lib/validations/review";
import { t, tf } from "@/lib/i18n";
import { apiFetch } from "@/lib/client-api";
import { formatNumberFa, nameInitials, timeAgoFa } from "@/lib/utils";
import type { ReviewDto } from "@/types";

export interface ViewerInfo {
  id: string;
  role: string;
  /** Professor profile id when the viewer is the reviewed professor. */
  professorId?: string | null;
}

interface ReviewCardProps {
  review: ReviewDto;
  viewer: ViewerInfo | null;
  showCourse?: boolean;
  onChanged?: () => void;
}

/** Single student review card with like/report/comment/reply/edit/delete actions. */
export function ReviewCard({ review, viewer, showCourse = false, onChanged }: ReviewCardProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [reportOpen, setReportOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [commentsOpen, setCommentsOpen] = React.useState(false);

  const isOwner = Boolean(viewer && review.author?.id === viewer.id) || review.ownedByViewer;
  const canReply = Boolean(
    viewer &&
      (viewer.role === "ADMIN" ||
        (viewer.role === "PROFESSOR" && viewer.professorId && viewer.professorId === review.professorId)),
  );
  const canEdit = isOwner;

  async function toggleLike() {
    if (!viewer) {
      toast.error(t("review.loginRequired"));
      return;
    }
    try {
      await apiFetch(`/api/reviews/${review.id}/like`, { method: "POST" });
      await queryClient.invalidateQueries({ queryKey: ["reviews"] });
      onChanged?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("common.error"));
    }
  }

  async function handleDelete() {
    try {
      await apiFetch(`/api/reviews/${review.id}`, { method: "DELETE" });
      toast.success(t("review.deleteSuccessToast"));
      setDeleteOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["reviews"] });
      onChanged?.();
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("common.error"));
    }
  }

  const authorName = review.anonymous
    ? review.ownedByViewer && review.author?.name
      ? review.author.name
      : t("review.anonymousName")
    : (review.author?.name ?? t("review.anonymousName"));

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="p-5">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border">
              {!review.anonymous && review.author?.image ? (
                <AvatarImage src={review.author.image} alt={authorName} />
              ) : null}
              <AvatarFallback>{review.anonymous ? "؟" : nameInitials(authorName)}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold">
                {authorName}
                {isOwner && <Badge variant="secondary">{t("review.youBadge")}</Badge>}
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span>{timeAgoFa(review.createdAt)}</span>
                {showCourse && review.course && (
                  <Link href={`/courses/${review.course.id}`} className="hover:text-primary hover:underline">
                    {review.course.name} ({review.course.code})
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            {/* Like */}
            <button
              title={t("review.helpfulTooltip")}
              onClick={toggleLike}
              className={`inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-sm transition-colors ${
                review.likedByViewer ? "bg-accent text-primary" : "text-muted-foreground hover:bg-secondary"
              }`}
            >
              <ThumbsUp className={`h-4 w-4 ${review.likedByViewer ? "fill-primary" : ""}`} />
              {formatNumberFa(review.helpfulCount)}
            </button>

            {/* Comments toggle */}
            <button
              title={t("comments.title")}
              onClick={() => setCommentsOpen((v) => !v)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary"
            >
              <MessageSquare className="h-4 w-4" />
            </button>

            {/* Report */}
            <button
              title={t("report.title")}
              onClick={() => (viewer ? setReportOpen(true) : toast.error(t("review.loginRequired")))}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary"
            >
              <Flag className="h-4 w-4" />
            </button>

            {/* Owner edit / delete */}
            {canEdit && (
              <>
                <button
                  title={t("common.edit")}
                  onClick={() => setEditOpen(true)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  title={t("common.delete")}
                  onClick={() => setDeleteOpen(true)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md text-destructive/80 transition-colors hover:bg-secondary"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Ratings summary */}
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-md bg-secondary/60 px-3 py-2">
            <p className="mb-1 text-[11px] text-muted-foreground">{t("common.rating")}</p>
            <StarRating value={review.rating} size="sm" showValue />
          </div>
          <div className="rounded-md bg-secondary/60 px-3 py-2">
            <p className="text-[11px] text-muted-foreground">{t("professor.avgDifficulty")}</p>
            <p className="text-sm font-bold">{formatNumberFa(review.difficulty)}</p>
          </div>
          <div className="rounded-md bg-secondary/60 px-3 py-2">
            <p className="text-[11px] text-muted-foreground">{t("review.wouldTakeAgain")}</p>
            <p className={`text-sm font-bold ${review.wouldTakeAgain ? "text-green-700" : "text-destructive"}`}>
              {review.wouldTakeAgain ? `✓ ${t("common.yes")}` : `✗ ${t("common.no")}`}
            </p>
          </div>
        </div>

        {/* Comment body */}
        <p className="mt-4 whitespace-pre-line text-sm leading-7">{review.comment}</p>

        {/* Professor official reply */}
        {review.reply && (
          <div className="mt-4 rounded-md border-r-4 border-primary bg-accent px-4 py-3">
            <p className="mb-1 flex items-center gap-1.5 text-xs font-bold text-primary">
              <CornerDownLeft className="h-3.5 w-3.5" />
              {t("reply.label")}
            </p>
            <p className="whitespace-pre-line text-sm leading-6">{review.reply}</p>
          </div>
        )}

        {/* Inline professor reply form */}
        {canReply && <ReplyBox reviewId={review.id} />}

        {/* Comments */}
        {commentsOpen && <CommentsSection reviewId={review.id} />}
      </CardContent>

      {/* Report dialog */}
      <ReportDialog reviewId={review.id} open={reportOpen} onOpenChange={setReportOpen} />

      {/* Delete confirmation */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("review.deleteConfirm")}</DialogTitle>
            <DialogDescription>{t("review.editWindowNote")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              {t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <EditReviewDialog review={review} open={editOpen} onOpenChange={setEditOpen} />
    </Card>
  );
}

function ReplyBox({ reviewId }: { reviewId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  async function submit() {
    const parsed = replySchema.safeParse({ reply: value });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0]?.message ?? t("reply.errorToast"));
      return;
    }
    setSubmitting(true);
    try {
      await apiFetch(`/api/reviews/${reviewId}/reply`, {
        method: "POST",
        body: JSON.stringify(parsed.data),
      });
      toast.success(t("reply.savedToast"));
      setOpen(false);
      setValue("");
      await queryClient.invalidateQueries({ queryKey: ["reviews"] });
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("reply.errorToast"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-3">
      {open ? (
        <div className="space-y-2">
          <Textarea value={value} onChange={(e) => setValue(e.target.value)} placeholder={t("reply.placeholder")} />
          <div className="flex gap-2">
            <Button size="sm" onClick={submit} disabled={submitting}>
              {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {t("reply.button")}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
              {t("common.cancel")}
            </Button>
          </div>
        </div>
      ) : (
        <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
          {t("dashboard.replyAction")}
        </Button>
      )}
    </div>
  );
}

function EditReviewDialog({
  review,
  open,
  onOpenChange,
}: {
  review: ReviewDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [submitting, setSubmitting] = React.useState(false);

  const form = useForm<{ rating?: number; difficulty?: number; wouldTakeAgain?: boolean; comment?: string; anonymous?: boolean }>({
    resolver: zodResolver(reviewUpdateSchema),
    defaultValues: {
      rating: review.rating,
      difficulty: review.difficulty,
      wouldTakeAgain: review.wouldTakeAgain,
      comment: review.comment,
      anonymous: review.anonymous,
    },
  });

  const rating = Number(form.watch("rating") ?? review.rating);
  const difficulty = Number(form.watch("difficulty") ?? review.difficulty);
  const comment = String(form.watch("comment") ?? "");
  const remaining = Math.max(0, 20 - comment.trim().length);

  async function onSubmit() {
    setSubmitting(true);
    try {
      const values = form.getValues();
      await apiFetch(`/api/reviews/${review.id}`, {
        method: "PATCH",
        body: JSON.stringify(values),
      });
      toast.success(t("review.updateSuccessToast"));
      onOpenChange(false);
      await queryClient.invalidateQueries({ queryKey: ["reviews"] });
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("common.error"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("common.edit")} — نظر</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("review.ratingLabel")}</label>
            <StarRating value={rating} onChange={(v) => form.setValue("rating", v)} size="lg" />
            {form.formState.errors.rating && (
              <p className="text-xs text-destructive">{form.formState.errors.rating.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{t("review.difficultyLabel")}</label>
            <input
              type="range"
              min={1}
              max={5}
              step={1}
              value={difficulty}
              onChange={(e) => form.setValue("difficulty", Number(e.target.value))}
              className="w-full accent-[hsl(var(--primary))]"
            />
            <p className="text-sm font-bold">{formatNumberFa(difficulty)}</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{t("review.wouldTakeAgain")}</label>
            <div className="flex gap-2">
              {[true, false].map((val, i) => (
                <button
                  key={String(val)}
                  type="button"
                  onClick={() => form.setValue("wouldTakeAgain", val)}
                  className={`rounded-md border px-4 py-1.5 text-sm ${
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

          <div className="space-y-2">
            <label className="text-sm font-medium">{t("review.commentLabel")}</label>
            <Textarea value={comment} onChange={(e) => form.setValue("comment", e.target.value)} />
            {remaining > 0 && (
              <p className="text-xs text-muted-foreground">
                {tf("review.charsRemaining", { count: formatNumberFa(remaining) })}
              </p>
            )}
            <label className="flex w-fit cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 accent-[hsl(var(--primary))]"
                checked={Boolean(form.watch("anonymous"))}
                onChange={(e) => form.setValue("anonymous", e.target.checked)}
              />
              {t("review.anonymousLabel")}
            </label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {t("review.updateButton")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
