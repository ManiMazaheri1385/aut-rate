"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { t } from "@/lib/i18n";
import { apiFetch } from "@/lib/client-api";

interface ProfessorCourseDto {
  id: string;
  code: string;
  name: string;
  credits: number;
  semester: string;
  description: string;
}

/** "دروس ارائه‌شده" manager for the professor dashboard. */
export function ProfessorCoursesManager() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery<ProfessorCourseDto[]>({
    queryKey: ["professor-courses"],
    queryFn: () => apiFetch("/api/professor/courses"),
  });

  const [formOpen, setFormOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<ProfessorCourseDto | null>(null);
  const [saving, setSaving] = React.useState(false);

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await apiFetch(`/api/professor/courses/${deleteTarget.id}`, { method: "DELETE" });
      toast.success(t("professorForm.courseRemovedToast"));
      setDeleteTarget(null);
      await refetch();
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("common.error"));
    }
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold">{t("dashboard.coursesManager")}</h3>
          <Button size="sm" onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4" />
            {t("professorForm.addCourse")}
          </Button>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
        ) : !data || data.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("professorForm.noCourses")}</p>
        ) : (
          <ul className="divide-y">
            {data.map((course) => (
              <li key={course.id} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {course.name}
                    <span dir="ltr" className="mr-2 text-xs text-muted-foreground">
                      ({course.code})
                    </span>
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {t("courses.semester")}: {course.semester} — {formatCredits(course.credits)}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  title={t("professorForm.removeCourse")}
                  onClick={() => setDeleteTarget(course)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}

        {/* Add course dialog */}
        <AddCourseDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          onSaved={async () => {
            await refetch();
            router.refresh();
          }}
          saving={saving}
          setSaving={setSaving}
        />

        {/* Delete confirm */}
        <Dialog open={Boolean(deleteTarget)} onOpenChange={(v) => !v && setDeleteTarget(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("professorForm.removeCourseConfirm")}</DialogTitle>
              <DialogDescription>
                {deleteTarget ? `${deleteTarget.name} (${deleteTarget.code})` : ""}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteTarget(null)}>
                {t("common.cancel")}
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                <Trash2 className="h-4 w-4" />
                {t("common.delete")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

function AddCourseDialog({
  open,
  onOpenChange,
  onSaved,
  saving,
  setSaving,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => Promise<void> | void;
  saving: boolean;
  setSaving: (v: boolean) => void;
}) {
  const [code, setCode] = React.useState("");
  const [name, setName] = React.useState("");
  const [credits, setCredits] = React.useState("3");
  const [semester, setSemester] = React.useState("");
  const [description, setDescription] = React.useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      await apiFetch("/api/professor/courses", {
        method: "POST",
        body: JSON.stringify({ code, name, credits: Number(credits), semester, description }),
      });
      toast.success(t("professorForm.courseAddedToast"));
      onOpenChange(false);
      setCode("");
      setName("");
      setSemester("");
      setDescription("");
      await onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("common.error"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("professorForm.addCourseTitle")}</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={submit}>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="course-code">{t("professorForm.courseCodeLabel")}</Label>
              <Input
                id="course-code"
                dir="ltr"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder={t("professorForm.courseCodePlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="course-name">{t("professorForm.courseNameLabel")}</Label>
              <Input id="course-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="course-credits">{t("professorForm.creditsLabel")}</Label>
              <Select id="course-credits" value={credits} onChange={(e) => setCredits(e.target.value)}>
                {[1, 2, 3, 4].map((c) => (
                  <option key={c} value={c}>
                    {toFa(c)}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="course-semester">{t("professorForm.semesterLabel")}</Label>
              <Input
                id="course-semester"
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                placeholder={t("professorForm.semesterPlaceholder")}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="course-description">{t("professorForm.descriptionLabel")}</Label>
            <Textarea
              id="course-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {t("professorForm.addCourse")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function toFa(n: number): string {
  return String(n).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);
}

function formatCredits(credits: number): string {
  return `${toFa(credits)} ${t("courses.credits")}`;
}
