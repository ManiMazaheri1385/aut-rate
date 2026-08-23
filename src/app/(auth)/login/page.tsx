"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSignIn, useSignUp, useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { ArrowRight, Loader2, MailCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AUT_EMAIL_REGEX, isClerkConfigured } from "@/lib/clerk-config";
import { t } from "@/lib/i18n";
import { toPersianDigits } from "@/lib/utils";

/** Extract the first Clerk error code from a thrown ClerkAPIError. */
function clerkErrorCode(err: unknown): string | null {
  const e = err as { errors?: Array<{ code?: string }> } | undefined;
  return e?.errors?.[0]?.code ?? null;
}

const RESEND_COOLDOWN_SECONDS = 30;

export default function LoginPage() {
  if (!isClerkConfigured) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>{t("auth.loginTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-sm leading-7 text-muted-foreground">
            سرویس ورود هنوز راه‌اندازی نشده است. کلیدهای Clerk را در فایل <span dir="ltr">.env</span> قرار دهید و سرور
            را دوباره اجرا کنید.
          </p>
          <p className="text-xs text-muted-foreground">
            راهنما: <span dir="ltr">NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</span> و{" "}
            <span dir="ltr">CLERK_SECRET_KEY</span>
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <React.Suspense
      fallback={
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center text-sm text-muted-foreground">{t("common.loading")}</CardContent>
        </Card>
      }
    >
      <LoginFlow />
    </React.Suspense>
  );
}

type Step = "email" | "code";
/** Which Clerk flow owns the current verification. */
type Mode = "signIn" | "signUp" | null;

function LoginFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

  const { isLoaded: signInLoaded, signIn, setActive: setSignInActive } = useSignIn();
  const { isLoaded: signUpLoaded, signUp, setActive: setSignUpActive } = useSignUp();
  const { isSignedIn } = useAuth();

  const [step, setStep] = React.useState<Step>("email");
  const [mode, setMode] = React.useState<Mode>(null);
  const [email, setEmail] = React.useState("");
  const [code, setCode] = React.useState("");
  const [emailError, setEmailError] = React.useState<string | null>(null);
  const [sending, setSending] = React.useState(false);
  const [verifying, setVerifying] = React.useState(false);
  const [cooldown, setCooldown] = React.useState(0);

  const ready = signInLoaded && signUpLoaded;

  // Already signed in? Straight to the destination.
  React.useEffect(() => {
    if (isSignedIn) {
      router.replace(callbackUrl);
      router.refresh();
    }
  }, [isSignedIn, router, callbackUrl]);

  // Cooldown ticker for the resend link.
  React.useEffect(() => {
    if (cooldown <= 0) return;
    const id = window.setInterval(() => setCooldown((s) => (s <= 1 ? 0 : s - 1)), 1000);
    return () => window.clearInterval(id);
  }, [cooldown]);

  async function sendCode(rawEmail: string) {
    const value = rawEmail.trim().toLowerCase();
    if (!AUT_EMAIL_REGEX.test(value)) {
      setEmailError(t("auth.nonAutEmail"));
      return;
    }
    setEmailError(null);

    if (!signIn || !signUp) return;
    setSending(true);
    try {
      try {
        // Existing account: email-code sign-in.
        await signIn.create({ identifier: value, strategy: "email_code" });
        setMode("signIn");
      } catch (err) {
        if (clerkErrorCode(err) !== "form_identifier_not_found") throw err;
        // New student: register silently, then verify the same address.
        await signUp.create({ emailAddress: value });
        await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
        setMode("signUp");
      }
      setEmail(value);
      setCode("");
      setStep("code");
      setCooldown(RESEND_COOLDOWN_SECONDS);
      toast.success(t("auth.codeSentMessage"));
    } catch (err) {
      const code = clerkErrorCode(err);
      if (code === "rate_limit_exceeded" || code === "too_many_requests") {
        toast.error(t("auth.rateLimited"));
      } else {
        toast.error(t("auth.otpSendError"));
      }
    } finally {
      setSending(false);
    }
  }

  async function verify(submitted?: string) {
    const value = submitted ?? code;
    if (!signIn || !signUp || value.length !== 6) return;
    setVerifying(true);
    try {
      if (mode === "signIn") {
        const result = await signIn.attemptFirstFactor({ strategy: "email_code", code: value });
        if (result.status === "complete") {
          await setSignInActive({ session: result.createdSessionId });
          finish();
          return;
        }
      } else if (mode === "signUp") {
        const result = await signUp.attemptEmailAddressVerification({ code: value });
        if (result.status === "complete") {
          await setSignUpActive({ session: result.createdSessionId });
          finish();
          return;
        }
      }
      toast.error(t("auth.otpInvalid"));
    } catch (err) {
      const errorCode = clerkErrorCode(err);
      if (errorCode === "form_code_incorrect") {
        toast.error(t("auth.otpInvalid"));
      } else if (errorCode === "verification_expired") {
        toast.error(t("auth.expiredCode"));
      } else if (errorCode === "rate_limit_exceeded" || errorCode === "too_many_attempts") {
        toast.error(t("auth.tooManyAttempts"));
      } else {
        toast.error(t("auth.otpInvalid"));
      }
    } finally {
      setVerifying(false);
    }
  }

  function finish() {
    toast.success(t("auth.welcome"));
    router.push(callbackUrl);
    router.refresh();
  }

  function onCodeChange(value: string) {
    // Digits only; paste-friendly.
    const digits = value.replace(/\D/g, "").slice(0, 6);
    setCode(digits);
    if (digits.length === 6 && !verifying) void verify(digits);
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle>{t("auth.loginTitle")}</CardTitle>
        <p className="mx-auto max-w-sm text-xs leading-6 text-muted-foreground">{t("auth.loginSubtitle")}</p>
      </CardHeader>
      <CardContent>
        {!ready ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : step === "email" ? (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              void sendCode(email);
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="login-email">{t("auth.emailLabel")}</Label>
              <Input
                id="login-email"
                dir="ltr"
                type="email"
                autoComplete="email"
                autoFocus
                placeholder={t("auth.emailPlaceholder")}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError(null);
                }}
              />
              {emailError && <p className="text-xs text-destructive">{emailError}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={sending}>
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {t("auth.sendCode")}
            </Button>
            <p className="text-center text-[11px] leading-5 text-muted-foreground">{t("auth.autoAccountNote")}</p>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 rounded-md bg-accent px-3 py-2.5 text-sm text-accent-foreground">
                <MailCheck className="h-4 w-4 shrink-0" />
                <span dir="ltr" className="truncate font-medium">
                  {email}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setStep("email")}
                className="inline-flex items-center gap-1 pt-0.5 text-xs text-muted-foreground hover:text-primary"
              >
                <ArrowRight className="h-3 w-3" />
                {t("auth.backToEmail")}
              </button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="login-code">{t("auth.codeLabel")}</Label>
              <Input
                id="login-code"
                dir="ltr"
                inputMode="numeric"
                autoComplete="one-time-code"
                autoFocus
                placeholder={t("auth.codePlaceholder")}
                className="text-center text-lg font-semibold tracking-[0.45em]"
                value={code}
                onChange={(e) => onCodeChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && code.length === 6 && !verifying) void verify();
                }}
              />
              {verifying && (
                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  {t("common.loading")}
                </p>
              )}
            </div>

            <Button type="button" className="w-full" disabled={verifying || code.length !== 6} onClick={() => void verify()}>
              {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {t("auth.verifyButton")}
            </Button>

            <div className="text-center text-xs">
              {cooldown > 0 ? (
                <span className="text-muted-foreground">
                  {t("auth.resendIn").replace("{seconds}", toPersianDigits(cooldown))}
                </span>
              ) : (
                <button
                  type="button"
                  disabled={sending}
                  onClick={() => void sendCode(email)}
                  className="font-medium text-primary hover:underline"
                >
                  {sending ? t("common.loading") : t("auth.resend")}
                </button>
              )}
            </div>
          </div>
        )}

        <p className="mt-6 border-t pt-4 text-center text-[11px] leading-5 text-muted-foreground">
          ورود تنها با ایمیل دانشگاهی <span dir="ltr">@aut.ac.ir</span> امکان‌پذیر است.{" "}
          <Link href="/" className="hover:text-primary">
            بازگشت به صفحه اصلی
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
