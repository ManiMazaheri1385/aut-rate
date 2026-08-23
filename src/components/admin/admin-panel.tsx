"use client";

import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Ban, CheckCircle2, RotateCcw, ShieldCheck, Trash2, Undo2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { t } from "@/lib/i18n";
import { apiFetch } from "@/lib/client-api";
import { departmentLabel, reportReasonLabel } from "@/lib/constants";
import { cn, formatJalaliDate, formatNumberFa } from "@/lib/utils";

type Section = "users" | "reviews" | "courses" | "reports" | "logs";

const TABS: { key: Section; label: string }[] = [
  { key: "users", label: t("admin.tabUsers") },
  { key: "reviews", label: t("admin.tabReviews") },
  { key: "courses", label: t("admin.tabCourses") },
  { key: "reports", label: t("admin.tabReports") },
  { key: "logs", label: t("admin.tabLogs") },
];

// Admin rows are loosely typed on purpose: one endpoint feeds all tabs.
type Row = Record<string, any> & { id: string };

/** Admin panel with Persian tabs: کاربران، نظرات، دروس، گزارشات، لاگ سیستم. */
export function AdminPanel({ adminName }: { adminName: string }) {
  const [section, setSection] = React.useState<Section>("users");

  return (
    <div className="container space-y-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold">{t("admin.title")}</h1>
        <Badge variant="accent">
          <ShieldCheck className="ml-1 h-3.5 w-3.5" />
          {adminName}
        </Badge>
      </div>

      <div className="flex flex-wrap gap-2 border-b pb-3">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setSection(tab.key)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition-colors",
              section === tab.key ? "bg-primary text-primary-foreground" : "bg-card hover:bg-secondary",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {section === "users" && <UsersSection />}
      {section === "reviews" && <ReviewsSection />}
      {section === "courses" && <CoursesSection />}
      {section === "reports" && <ReportsSection />}
      {section === "logs" && <LogsSection />}
    </div>
  );
}

function useAdminData<T>(section: string) {
  return useQuery<T[]>({
    queryKey: ["admin", section],
    queryFn: () => apiFetch<T[]>(`/api/admin/data?section=${section}`),
  });
}

function LoadingRows() {
  return (
    <div className="space-y-2 p-4">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  );
}

function UsersSection() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useAdminData<Row>("users");
  const [busyId, setBusyId] = React.useState<string | null>(null);

  async function patch(id: string, body: Record<string, unknown>) {
    setBusyId(id);
    try {
      await apiFetch(`/api/admin/users/${id}`, { method: "PATCH", body: JSON.stringify(body) });
      if (body.role) toast.success(t("admin.roleChangedToast"));
      if (body.suspended !== undefined) {
        toast.success(body.suspended ? t("admin.userSuspendedToast") : t("admin.userUnsuspendedToast"));
      }
      await queryClient.invalidateQueries({ queryKey: ["admin"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("common.error"));
    } finally {
      setBusyId(null);
    }
  }

  if (isLoading) return <Card><LoadingRows /></Card>;

  return (
    <Card>
      <CardContent className="p-0">
        <TableWrap
          headers={[
            t("admin.colName"),
            t("admin.colEmail"),
            t("admin.colRole"),
            t("admin.colStudentId"),
            t("admin.colDate"),
            t("admin.colActions"),
          ]}
        >
          {(data ?? []).map((user) => (
            <tr key={user.id} className="border-b last:border-0">
              <Td>
                <span className="font-medium">{user.name}</span>
                {user.suspended && <Badge variant="destructive" className="mr-2">تعلیق‌شده</Badge>}
              </Td>
              <Td dir="ltr" className="text-left text-xs">{user.email}</Td>
              <Td>
                <Select
                  value={user.role}
                  disabled={busyId === user.id}
                  onChange={(e) => patch(user.id, { role: e.target.value })}
                  className="h-8 w-28 text-xs"
                >
                  <option value="STUDENT">دانشجو</option>
                  <option value="PROFESSOR">استاد</option>
                  <option value="ADMIN">مدیر</option>
                </Select>
              </Td>
              <Td dir="ltr" className="text-left text-xs">{user.studentId ?? "—"}</Td>
              <Td className="text-xs text-muted-foreground">{formatJalaliDate(user.createdAt)}</Td>
              <Td>
                <Button
                  size="sm"
                  variant={user.suspended ? "outline" : "destructive"}
                  disabled={busyId === user.id}
                  onClick={() => patch(user.id, { suspended: !user.suspended })}
                >
                  {user.suspended ? (
                    <>
                      <Undo2 className="h-3.5 w-3.5" />
                      {t("admin.unsuspend")}
                    </>
                  ) : (
                    <>
                      <Ban className="h-3.5 w-3.5" />
                      {t("admin.suspend")}
                    </>
                  )}
                </Button>
              </Td>
            </tr>
          ))}
        </TableWrap>
      </CardContent>
    </Card>
  );
}

function ReviewsSection() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useAdminData<Row>("reviews");
  const [deleteTarget, setDeleteTarget] = React.useState<Row | null>(null);

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await apiFetch(`/api/reviews/${deleteTarget.id}`, { method: "DELETE" });
      toast.success(t("admin.reviewDeletedToast"));
      setDeleteTarget(null);
      await queryClient.invalidateQueries({ queryKey: ["admin"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("common.error"));
    }
  }

  if (isLoading) return <Card><LoadingRows /></Card>;

  return (
    <>
      <div className="space-y-3">
        {(data ?? []).map((review) => (
          <Card key={review.id}>
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{review.studentName}</span>
                  <span dir="ltr">({review.studentEmail})</span>
                  <span>—</span>
                  <span>{review.courseName}</span>
                  <span dir="ltr">({review.courseCode})</span>
                  <span>—</span>
                  <span>{review.professorName}</span>
                </div>
                <p className="line-clamp-2 text-sm leading-6">{review.comment}</p>
                <p className="text-[11px] text-muted-foreground">
                  ⭐ {formatNumberFa(review.rating)} · {formatJalaliDate(review.createdAt)}
                </p>
              </div>
              <Button size="sm" variant="destructive" onClick={() => setDeleteTarget(review)}>
                <Trash2 className="h-3.5 w-3.5" />
                {t("common.delete")}
              </Button>
            </CardContent>
          </Card>
        ))}
        {(!data || data.length === 0) && <EmptyRow />}
      </div>

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>آیا از حذف این نظر مطمئن هستید؟</DialogTitle>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              {t("common.cancel")}
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              {t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function CoursesSection() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useAdminData<Row>("courses");
  const [deleteTarget, setDeleteTarget] = React.useState<Row | null>(null);

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await apiFetch(`/api/professor/courses/${deleteTarget.id}`, { method: "DELETE" });
      toast.success(t("admin.courseDeletedToast"));
      setDeleteTarget(null);
      await queryClient.invalidateQueries({ queryKey: ["admin"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("common.error"));
    }
  }

  if (isLoading) return <Card><LoadingRows /></Card>;

  return (
    <>
      <Card>
        <CardContent className="p-0">
          <TableWrap
            headers={[t("courses.code"), "نام درس", t("courses.semester"), t("courses.provider"), t("professors.reviewsSuffix"), t("admin.colActions")]}
          >
            {(data ?? []).map((course) => (
              <tr key={course.id} className="border-b last:border-0">
                <Td dir="ltr" className="text-left font-medium">{course.code}</Td>
                <Td>{course.name}</Td>
                <Td className="text-xs">{course.semester}</Td>
                <Td className="text-xs">{course.professorName ?? "—"}</Td>
                <Td className="text-xs">{formatNumberFa(course.reviewsCount)}</Td>
                <Td>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setDeleteTarget(course)}
                  >
                    <Trash2 className="h-4 w-4" />
                    {t("professorForm.removeCourse")}
                  </Button>
                </Td>
              </tr>
            ))}
          </TableWrap>
        </CardContent>
      </Card>

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("admin.deleteCourseConfirm")}</DialogTitle>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              {t("common.cancel")}
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              {t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ReportsSection() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useAdminData<Row>("reports");
  const [busyId, setBusyId] = React.useState<string | null>(null);

  async function act(id: string, action: "resolve" | "reject") {
    setBusyId(id);
    try {
      await apiFetch(`/api/admin/reports/${id}`, { method: "PATCH", body: JSON.stringify({ action }) });
      toast.success(action === "resolve" ? t("admin.reportResolvedToast") : t("admin.reportRejectedToast"));
      await queryClient.invalidateQueries({ queryKey: ["admin"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("common.error"));
    } finally {
      setBusyId(null);
    }
  }

  if (isLoading) return <Card><LoadingRows /></Card>;
  if (!data || data.length === 0)
    return (
      <Card>
        <CardContent className="p-8 text-center text-sm text-muted-foreground">
          {t("admin.noReports")}
        </CardContent>
      </Card>
    );

  return (
    <div className="space-y-3">
      {data.map((report) => (
        <Card key={report.id}>
          <CardContent className="space-y-2 p-4">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <Badge variant={report.status === "PENDING" ? "secondary" : report.status === "RESOLVED" ? "default" : "destructive"}>
                {t(`report.statusLabels.${report.status}`)}
              </Badge>
              <Badge variant="outline">{reportReasonLabel(report.reason)}</Badge>
              <span className="text-muted-foreground">
                گزارش‌دهنده: {report.reporterName} — {formatJalaliDate(report.createdAt)}
              </span>
            </div>
            {report.description && <p className="text-sm text-muted-foreground">{report.description}</p>}
            {report.reviewComment && (
              <p className="rounded-md bg-secondary/60 px-3 py-2 text-sm leading-6 line-clamp-2">
                «{report.reviewComment}»
              </p>
            )}
            {report.status === "PENDING" && (
              <div className="flex gap-2 pt-1">
                <Button
                  size="sm"
                  disabled={busyId === report.id}
                  onClick={() => act(report.id, "resolve")}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {t("admin.approve")}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busyId === report.id}
                  onClick={() => act(report.id, "reject")}
                >
                  <RotateCcw className="h-4 w-4" />
                  {t("admin.reject")}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function LogsSection() {
  const { data, isLoading } = useAdminData<Row>("logs");

  if (isLoading) return <Card><LoadingRows /></Card>;

  return (
    <Card>
      <CardContent className="p-0">
        <TableWrap headers={[t("admin.colDate"), "رویداد", "کاربر", "جزئیات"]}>
          {(data ?? []).map((log) => (
            <tr key={log.id} className="border-b last:border-0">
              <Td dir="ltr" className="whitespace-nowrap text-left text-xs text-muted-foreground">
                {formatJalaliDate(log.createdAt)}
              </Td>
              <Td className="font-medium">{log.action}</Td>
              <Td className="text-xs">{log.actorName ?? "—"}</Td>
              <Td dir="ltr" className="max-w-[280px] truncate text-left text-[11px] text-muted-foreground">
                {log.meta ? JSON.stringify(log.meta) : "—"}
              </Td>
            </tr>
          ))}
        </TableWrap>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Small table helpers
// ---------------------------------------------------------------------------

function TableWrap({
  headers,
  children,
}: {
  headers: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-right text-sm">
        <thead>
          <tr className="border-b bg-secondary/50">
            {headers.map((header) => (
              <th key={header} className="px-4 py-3 text-xs font-semibold text-muted-foreground">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
      {React.Children.count(children) === 0 && <div className="p-4"><EmptyRow /></div>}
    </div>
  );
}

function Td({
  children,
  className,
  dir,
}: {
  children?: React.ReactNode;
  className?: string;
  dir?: "ltr" | "rtl";
}) {
  return (
    <td dir={dir} className={cn("px-4 py-3 align-middle", className)}>
      {children}
    </td>
  );
}

function EmptyRow() {
  return <p className="py-8 text-center text-sm text-muted-foreground">{t("common.noResults")}</p>;
}
