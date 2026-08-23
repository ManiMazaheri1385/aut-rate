import { withAuth } from "next-auth/middleware";

/**
 * Protects authenticated areas. Role checks for /admin are done
 * server-side in the admin layout (middleware only verifies the token).
 */
export default withAuth({
  pages: { signIn: "/login" },
});

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
