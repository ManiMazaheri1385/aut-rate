// Clerk configuration flag — safe to import in client components.
export const CLERK_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

/** True when the publishable key env var is present. */
export const isClerkConfigured = Boolean(CLERK_PUBLISHABLE_KEY);

/** Only university emails may own an account on this platform. */
export const AUT_EMAIL_REGEX = /^[^@\s]+@aut\.ac\.ir$/i;
