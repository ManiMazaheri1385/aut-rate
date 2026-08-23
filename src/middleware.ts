import { NextResponse, type NextRequest } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

/**
 * Protects authenticated areas. Role checks for /admin are done
 * server-side in the admin layout (middleware only verifies the session).
 * The @aut.ac.ir restriction is enforced in src/lib/auth/guards.ts on every
 * server request, so a non-university account can never act on this app.
 *
 * When Clerk keys are absent the site degrades to a public catalog:
 * protected routes simply bounce to the sign-in page.
 */
const isProtectedRoute = createRouteMatcher(["/dashboard(.*)", "/admin(.*)"]);

const hasClerkKeys = () => Boolean(process.env.CLERK_SECRET_KEY);

export default hasClerkKeys()
  ? clerkMiddleware(async (auth, req) => {
      if (isProtectedRoute(req)) await auth.protect();
    })
  : function fallback(req: NextRequest) {
      if (isProtectedRoute(req)) {
        const url = new URL("/login", req.url);
        return NextResponse.redirect(url);
      }
      return NextResponse.next();
    };

export const config = {
  matcher: [
    // Run Clerk auth on all routes except static files and Next internals.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
