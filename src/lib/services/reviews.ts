import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import type { Paginated, ReviewDto } from "@/types";

/**
 * Review read services. Author identity is hidden for anonymous reviews
 * unless the viewer is the author (or an admin).
 */

const reviewInclude = {
  student: { select: { id: true, name: true, image: true } },
  course: { select: { id: true, code: true, name: true } },
} satisfies Prisma.ReviewInclude;

type ReviewWithRelations = Prisma.ReviewGetPayload<{ include: typeof reviewInclude }>;

function mapReview(r: ReviewWithRelations, viewerId?: string | null, likedIds?: Set<string>): ReviewDto {
  const isOwner = r.studentId === viewerId;
  const showAuthor = !r.anonymous || isOwner || false;
  return {
    id: r.id,
    professorId: r.professorId,
    rating: r.rating,
    difficulty: r.difficulty,
    wouldTakeAgain: r.wouldTakeAgain,
    comment: r.comment,
    anonymous: r.anonymous,
    helpfulCount: r.helpfulCount,
    reply: r.reply,
    repliedAt: r.repliedAt?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    author:
      showAuthor && !r.anonymous
        ? { id: r.student.id, name: r.student.name, image: r.student.image }
        : isOwner
          ? { id: r.student.id, name: r.student.name, image: r.student.image }
          : null,
    course: r.course ? { id: r.course.id, code: r.course.code, name: r.course.name } : null,
    likedByViewer: likedIds?.has(r.id) ?? false,
    ownedByViewer: isOwner,
  };
}

async function likedReviewIds(reviewIds: string[], viewerId?: string | null): Promise<Set<string>> {
  if (!viewerId || reviewIds.length === 0) return new Set();
  const likes = await db.like.findMany({
    where: { userId: viewerId, reviewId: { in: reviewIds } },
    select: { reviewId: true },
  });
  return new Set(likes.map((l) => l.reviewId));
}

export async function getReviews(opts: {
  professorId?: string;
  courseId?: string;
  viewerId?: string | null;
  take?: number;
  skip?: number;
  orderBy?: "newest" | "helpful";
}): Promise<Paginated<ReviewDto>> {
  const where: Prisma.ReviewWhereInput = {};
  if (opts.professorId) where.professorId = opts.professorId;
  if (opts.courseId) where.courseId = opts.courseId;

  const take = opts.take ?? 20;
  const skip = opts.skip ?? 0;
  const orderBy: Prisma.ReviewOrderByWithRelationInput =
    opts.orderBy === "helpful" ? { helpfulCount: "desc" } : { createdAt: "desc" };

  const [total, reviews] = await Promise.all([
    db.review.count({ where }),
    db.review.findMany({ where, include: reviewInclude, orderBy, take, skip }),
  ]);
  const liked = await likedReviewIds(reviews.map((r) => r.id), opts.viewerId);

  return {
    items: reviews.map((r) => mapReview(r, opts.viewerId, liked)),
    total,
  };
}

export async function getReviewById(id: string, viewerId?: string | null): Promise<ReviewDto | null> {
  const review = await db.review.findUnique({ where: { id }, include: reviewInclude });
  if (!review) return null;
  const liked = await likedReviewIds([id], viewerId);
  return mapReview(review, viewerId, liked);
}

export async function getUserReviews(userId: string, take = 50): Promise<ReviewDto[]> {
  const reviews = await db.review.findMany({
    where: { studentId: userId },
    include: reviewInclude,
    orderBy: { createdAt: "desc" },
    take,
  });
  return reviews.map((r) => mapReview(r, userId));
}

export async function getUserLikedReviews(userId: string, take = 50): Promise<ReviewDto[]> {
  const likes = await db.like.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take,
    select: { reviewId: true },
  });
  if (likes.length === 0) return [];
  const reviews = await db.review.findMany({
    where: { id: { in: likes.map((l) => l.reviewId) } },
    include: reviewInclude,
  });
  const order = new Map(likes.map((l, i) => [l.reviewId, i]));
  const liked = new Set(likes.map((l) => l.reviewId));
  return reviews
    .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0))
    .map((r) => mapReview(r, userId, liked));
}
