"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Flag, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { reportCreateSchema, type ReportCreateInput } from "@/lib/validations/report";
import { REPORT_REASONS } from "@/lib/constants";
import { t } from "@/lib/i18n";
import { apiFetch } from "@/lib/client-api";

interface ReportDialogProps {
  reviewId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** "گزارش نظر" modal with Persian reason dropdown. */
export function ReportDialog({ reviewId, open, onOpenChange }: ReportDialogProps) {
  const [reason, setReason] = React.useState<string>("");
  const [description, setDescription] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const form = useForm<{ reason: ReportCreateInput["reason"]; description?: string }>({
    resolver: zodResolver(reportCreateSchema),
    defaultValues: { reason: undefined, description: "" },
  });

  async function onSubmit(values: ReportCreateInput) {
    setSubmitting(true);
    try {
      await apiFetch(`/api/reviews/${reviewId}/report`, {
        method: "POST",
        body: JSON.stringify(values),
      });
      toast.success(t("report.successToast"));
      onOpenChange(false);
      setReason("");
      setDescription("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("report.errorToast"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="h-4 w-4 text-primary" />
            {t("report.title")}
          </DialogTitle>
          <DialogDescription>{t("report.hint")}</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={form.handleSubmit((v) =>
            onSubmit({ reason: v.reason, description: v.description ?? "" }),
          )}
        >
          <div className="space-y-2">
            <Label htmlFor="report-reason">{t("report.reasonLabel")}</Label>
            <Select
              id="report-reason"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                form.setValue("reason", e.target.value as ReportCreateInput["reason"], {
                  shouldValidate: true,
                });
              }}
            >
              <option value="" disabled>
                {t("review.coursePlaceholder")}
              </option>
              {REPORT_REASONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </Select>
            {form.formState.errors.reason && (
              <p className="text-xs text-destructive">{form.formState.errors.reason.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="report-description">توضیحات ({t("common.optional")})</Label>
            <Textarea
              id="report-description"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                form.setValue("description", e.target.value);
              }}
              placeholder={t("report.descriptionPlaceholder")}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={submitting || !reason}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {t("report.submitButton")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
