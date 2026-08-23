"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ArrowRight, Loader2, MailCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  otpRequestSchema,
  otpVerifySchema,
  type OtpRequestInput,
  type OtpVerifyInput,
} from "@/lib/validations/auth";
import { t } from "@/lib/i18n";

export default function LoginPage() {
  return (
    <React.Suspense fallback={<Card className="w-full max-w-md"><CardContent className="p-8 text-center text-sm text-muted-foreground">{t("common.loading")}</CardContent></Card>}>
      <LoginForms />
    </React.Suspense>
  );
}

function LoginForms() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

  const [step, setStep] = React.useState<"email" | "code">("email");
  const [email, setEmail] = React.useState("");
  const [devCode, setDevCode] = React.useState<string | null>(null);
  const [sending, setSending] = React.useState(false);
  const [verifying, setVerifying] = React.useState(false);

  const emailForm = useForm<OtpRequestInput>({ resolver: zodResolver(otpRequestSchema) });
  const codeForm = useForm<OtpVerifyInput>({
    resolver: zodResolver(otpVerifySchema),
    defaultValues: { email: "", code: "" },
  });

  async function requestOtp(values: OtpRequestInput) {
    setSending(true);
    try {
      const res = await fetch("/api/auth/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json.message ?? t("auth.otpSendError"));
        return;
      }
      setEmail(values.email);
      setDevCode(json.data?.devCode ?? null);
      setStep("code");
      toast.success(t("auth.codeSentMessage"));
    } catch {
      toast.error(t("auth.otpSendError"));
    } finally {
      setSending(false);
    }
  }

  async function verifyOtp(values: OtpVerifyInput) {
    setVerifying(true);
    try {
      const result = await signIn("otp", {
        email: values.email || email,
        code: values.code,
        redirect: false,
      });
      if (result?.error) {
        // Distinguish suspension vs invalid code is server-side; show generic Persian message.
        toast.error(t("auth.otpInvalid"));
        return;
      }
      toast.success(t("auth.welcome"));
      router.push(callbackUrl);
      router.refresh();
    } catch {
      toast.error(t("auth.otpInvalid"));
    } finally {
      setVerifying(false);
    }
  }

  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="text-center">
        <CardTitle>{t("auth.loginTitle")}</CardTitle>
        <p className="mx-auto max-w-sm text-xs leading-6 text-muted-foreground">{t("auth.loginSubtitle")}</p>
      </CardHeader>
      <CardContent>
        {step === "email" ? (
          <form className="space-y-4" onSubmit={emailForm.handleSubmit(requestOtp)}>
            <div className="space-y-2">
              <Label htmlFor="login-email">{t("auth.emailLabel")}</Label>
              <Input
                id="login-email"
                dir="ltr"
                autoComplete="email"
                placeholder={t("auth.emailPlaceholder")}
                {...emailForm.register("email")}
              />
              {emailForm.formState.errors.email && (
                <p className="text-xs text-destructive">{emailForm.formState.errors.email.message}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={sending}>
              {sending && <Loader2 className="h-4 w-4 animate-spin" />}
              {t("auth.sendCode")}
            </Button>
          </form>
        ) : (
          <form className="space-y-4" onSubmit={codeForm.handleSubmit(verifyOtp)}>
            <div className="flex items-center gap-2 rounded-md bg-accent px-3 py-2.5 text-sm text-accent-foreground">
              <MailCheck className="h-4 w-4 shrink-0" />
              <span dir="ltr" className="truncate font-medium">{email}</span>
            </div>

            {devCode && (
              <div className="rounded-md border border-dashed border-primary/40 px-3 py-2 text-center text-sm">
                <span className="text-muted-foreground">{t("auth.devCodePrefix")} </span>
                <span dir="ltr" className="font-extrabold tracking-widest text-primary">{devCode}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="login-code">{t("auth.codeLabel")}</Label>
              <Input
                id="login-code"
                dir="ltr"
                inputMode="numeric"
                maxLength={6}
                placeholder={t("auth.codePlaceholder")}
                className="text-center text-lg tracking-[0.5em]"
                {...codeForm.register("code")}
              />
              {codeForm.formState.errors.code && (
                <p className="text-xs text-destructive">{codeForm.formState.errors.code.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={verifying}>
              {verifying && <Loader2 className="h-4 w-4 animate-spin" />}
              {t("auth.verifyButton")}
            </Button>

            <div className="flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => setStep("email")}
                className="inline-flex items-center gap-1 text-muted-foreground hover:text-primary"
              >
                <ArrowRight className="h-3.5 w-3.5 rotate-180" />
                {t("auth.backToEmail")}
              </button>
              <button
                type="button"
                disabled={sending}
                onClick={() => void requestOtp({ email })}
                className="font-medium text-primary hover:underline"
              >
                {t("auth.resend")}
              </button>
            </div>
          </form>
        )}

        <p className="mt-6 text-center text-[11px] leading-5 text-muted-foreground">
          ورود تنها با ایمیل دانشگاهی <span dir="ltr">@aut.ac.ir</span> امکان‌پذیر است.
        </p>
      </CardContent>
    </Card>
  );
}
