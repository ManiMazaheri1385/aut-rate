"use client";

import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { t } from "@/lib/i18n";
import { apiFetch } from "@/lib/client-api";
import { nameInitials, timeAgoFa } from "@/lib/utils";

interface CommentDto {
  id: string;
  content: string;
  createdAt: string;
  author: { id: string; name: string | null; image: string | null };
}

/** Thread of comments under a review. */
export function CommentsSection({ reviewId }: { reviewId: string }) {
  const queryClient = useQueryClient();
  const [content, setContent] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const { data, isLoading } = useQuery<CommentDto[]>({
    queryKey: ["comments", reviewId],
    queryFn: () => apiFetch(`/api/reviews/${reviewId}/comments`),
  });

  async function submit() {
    const trimmed = content.trim();
    if (!trimmed) return;
    setSubmitting(true);
    try {
      await apiFetch(`/api/reviews/${reviewId}/comments`, {
        method: "POST",
        body: JSON.stringify({ content: trimmed }),
      });
      setContent("");
      toast.success(t("comments.successToast"));
      await queryClient.invalidateQueries({ queryKey: ["comments", reviewId] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("comments.errorToast"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-3 space-y-3 rounded-md bg-secondary/50 p-3">
      <p className="text-xs font-semibold text-muted-foreground">{t("comments.title")}</p>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ) : !data || data.length === 0 ? (
        <p className="text-xs text-muted-foreground">{t("comments.empty")}</p>
      ) : (
        <ul className="space-y-2">
          {data.map((c) => (
            <li key={c.id} className="flex items-start gap-2">
              <Avatar className="h-6 w-6 border">
                {c.author.image ? <AvatarImage src={c.author.image} alt="" /> : null}
                <AvatarFallback className="text-[10px]">{nameInitials(c.author.name ?? "")}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1 rounded-md bg-card px-3 py-2 text-sm shadow-sm">
                <span className="font-medium">{c.author.name}</span>{" "}
                <span className="text-[11px] text-muted-foreground">{timeAgoFa(c.createdAt)}</span>
                <p className="whitespace-pre-line text-sm">{c.content}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-end gap-2">
        <Textarea
          rows={1}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={t("comments.placeholder")}
          className="min-h-[40px]"
        />
        <Button size="sm" onClick={submit} disabled={submitting || !content.trim()}>
          {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {t("comments.submit")}
        </Button>
      </div>
    </div>
  );
}
