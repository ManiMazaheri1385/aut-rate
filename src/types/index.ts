import type { SortValue } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Data Transfer Objects shared by server components and API routes.
// ---------------------------------------------------------------------------

export interface ProfessorCardDto {
  id: string;
  userId: string;
  name: string;
  image: string | null;
  department: string;
  bio: string | null;
  photoUrl: string | null;
  researchInterests: string[];
  personalLink: string | null;
  /** Raw mean rating (1..5). */
  avgRating: number;
  /** Bayesian-adjusted rating used for display and ranking. */
  bayesianRating: number;
  avgDifficulty: number;
  totalReviews: number;
  totalLikes: number;
}

export interface CourseDto {
  id: string;
  code: string;
  name: string;
  department: string;
  credits: number;
  description: string;
  semester: string;
  professorId: string | null;
  professorName: string | null;
  totalReviews: number;
  avgRating: number;
}

export interface ReviewAuthorDto {
  id: string;
  name: string | null;
  image: string | null;
}

export interface ReviewDto {
  id: string;
  professorId: string;
  rating: number;
  difficulty: number;
  wouldTakeAgain: boolean;
  comment: string;
  anonymous: boolean;
  helpfulCount: number;
  reply: string | null;
  repliedAt: string | null;
  createdAt: string;
  updatedAt: string;
  author: ReviewAuthorDto | null;
  course: { id: string; code: string; name: string } | null;
  likedByViewer: boolean;
  ownedByViewer: boolean;
}

export interface RatingDistributionBucket {
  rating: number;
  count: number;
}

export interface TrendPoint {
  label: string; // Persian month label
  rating: number;
  count: number;
}

export interface SuggestItem {
  id: string;
  title: string;
  subtitle: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
}

export type ProfessorSort = Extract<SortValue, "highest_rated" | "most_reviewed" | "newest">;

export interface ProfessorListFilters {
  q?: string;
  department?: string;
  sort?: ProfessorSort;
  page?: number;
  pageSize?: number;
}
