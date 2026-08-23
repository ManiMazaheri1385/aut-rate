// Shared domain constants + Persian labels.

export type DepartmentValue = "MATH" | "CS" | "STATS" | "OR";
export type RoleValue = "STUDENT" | "PROFESSOR" | "ADMIN";
export type SortValue = "highest_rated" | "most_reviewed" | "newest";

export const DEPARTMENTS: { value: DepartmentValue; label: string }[] = [
  { value: "CS", label: "علوم کامپیوتر" },
  { value: "MATH", label: "ریاضی" },
  { value: "STATS", label: "آمار" },
  { value: "OR", label: "تحقیق در عملیات" },
];

export function departmentLabel(dept: string): string {
  return DEPARTMENTS.find((d) => d.value === dept)?.label ?? dept;
}

export const SORT_OPTIONS: { value: SortValue; label: string }[] = [
  { value: "highest_rated", label: "بیشترین امتیاز" },
  { value: "most_reviewed", label: "بیشترین تعداد نظر" },
  { value: "newest", label: "جدیدترین" },
];

export const REPORT_REASONS: { value: "SPAM" | "OFFENSIVE" | "INACCURATE" | "OTHER"; label: string }[] = [
  { value: "SPAM", label: "هرزنامه" },
  { value: "OFFENSIVE", label: "توهین‌آمیز" },
  { value: "INACCURATE", label: "اطلاعات نادرست" },
  { value: "OTHER", label: "سایر" },
];

export function reportReasonLabel(reason: string): string {
  return REPORT_REASONS.find((r) => r.value === reason)?.label ?? reason;
}

// ---------------------------------------------------------------------------
// Bayesian average priors
// ---------------------------------------------------------------------------

/** Prior weight (pseudo reviews). Higher = more conservative averages. */
export const BAYES_PRIOR_WEIGHT = 5;
/** Global prior mean rating on the 1..5 scale. */
export const BAYES_PRIOR_MEAN = 3;

/**
 * Bayesian average prevents low-review-count inflation:
 *   score = (C * m + sum(ratings)) / (C + n)
 */
export function bayesianAverage(avgRating: number, totalReviews: number): number {
  const C = BAYES_PRIOR_WEIGHT;
  const m = BAYES_PRIOR_MEAN;
  if (totalReviews <= 0) return m;
  const sum = avgRating * totalReviews;
  return (C * m + sum) / (C + totalReviews);
}
