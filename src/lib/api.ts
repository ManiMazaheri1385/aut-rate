import { NextResponse } from "next/server";
import { ZodError } from "zod";

/**
 * API helpers. Every user-facing message is Persian; only identifiers are English.
 */

export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function fail(message: string, status = 400) {
  return NextResponse.json({ success: false, message }, { status });
}

/**
 * Wraps a route handler and converts thrown errors to Persian JSON responses.
 */
export async function handleApi(fn: () => Promise<Response>): Promise<Response> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof ApiError) {
      return fail(error.message, error.status);
    }
    if (error instanceof ZodError) {
      const first = error.errors[0]?.message ?? "اطلاعات وارد شده معتبر نیست";
      return fail(first, 422);
    }
    console.error("[api] unhandled error:", error);
    return fail("خطای سرور. لطفاً بعداً دوباره تلاش کنید", 500);
  }
}
