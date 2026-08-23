import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { createHash } from "crypto";
import { db } from "@/lib/db";

/**
 * NextAuth configuration using an email OTP (one-time code) flow restricted
 * to @aut.ac.ir addresses. Codes are issued by POST /api/auth/otp and stored
 * hashed in the OtpCode table.
 */

function hashCode(email: string, code: string): string {
  return createHash("sha256").update(`${email}:${code}:${process.env.NEXTAUTH_SECRET}`).digest("hex");
}

export function hashOtp(email: string, code: string): string {
  return hashCode(email, code);
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      id: "otp",
      name: "Email OTP",
      credentials: {
        email: { label: "Email", type: "text" },
        code: { label: "Code", type: "text" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.toLowerCase().trim();
        const code = credentials?.code?.trim();

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
        if (!email.endsWith("@aut.ac.ir")) return null;
        if (!code || !/^\d{6}$/.test(code)) return null;

        // Find the newest active OTP for this address.
        const otp = await db.otpCode.findFirst({
          where: { email, consumed: false, expiresAt: { gt: new Date() } },
          orderBy: { createdAt: "desc" },
        });
        if (!otp) return null;
        if (otp.attempts >= 5) return null;

        const valid = otp.codeHash === hashCode(email, code);
        await db.otpCode.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } });
        if (!valid) return null;

        await db.otpCode.update({ where: { id: otp.id }, data: { consumed: true } });

        const user = await db.user.findUnique({ where: { email } });
        if (!user) return null; // users are always created when the OTP is requested
        if (user.suspended) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
          studentId: user.studentId,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.studentId = user.studentId ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.studentId = token.studentId ?? null;
      }
      return session;
    },
  },
};
