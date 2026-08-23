import nodemailer from "nodemailer";

/**
 * Sends the OTP email via Resend HTTP API when RESEND_API_KEY is configured,
 * otherwise falls back to classic SMTP (nodemailer).
 * When neither is configured (local development), the code is printed to console.
 */

interface SendResult {
  sent: boolean;
  provider: "resend" | "smtp" | "console";
}

async function sendViaResend(to: string, code: string): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { sent: false, provider: "resend" };

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.OTP_FROM_EMAIL ?? "onboarding@resend.dev",
        to,
        subject: "کد ورود به سامانه ارزیابی اساتید امیرکبیر",
        html: `<div dir="rtl" style="font-family:Tahoma,sans-serif;text-align:right">
          <p>سلام،</p>
          <p>کد تایید ورود شما به سامانه ارزیابی اساتید دانشگاه صنعتی امیرکبیر:</p>
          <p style="font-size:28px;font-weight:bold;letter-spacing:6px">${code}</p>
          <p style="color:#666">این کد تا ۱۰ دقیقه اعتبار دارد.</p>
        </div>`,
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      console.error(`[otp] resend error (${response.status}): ${body}`);
      return { sent: false, provider: "resend" };
    }
    return { sent: true, provider: "resend" };
  } catch (error) {
    console.error("[otp] resend request failed:", error);
    return { sent: false, provider: "resend" };
  }
}

async function sendViaSmtp(to: string, code: string): Promise<SendResult> {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;

  if (!host || !user || !pass) return { sent: false, provider: "console" };

  try {
    const transport = nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT ?? "587"),
      secure: Number(process.env.SMTP_PORT ?? "587") === 465,
      auth: { user, pass },
    });
    await transport.sendMail({
      from: process.env.OTP_FROM_EMAIL ?? `no-reply@${host}`,
      to,
      subject: "کد ورود به سامانه ارزیابی اساتید امیرکبیر",
      text: `کد تایید شما: ${code}\nاین کد تا ۱۰ دقیقه اعتبار دارد.`,
      html: `<div dir="rtl" style="font-family:Tahoma,sans-serif;text-align:right">
        <p>سلام،</p>
        <p>کد تایید ورود شما به سامانه ارزیابی اساتید دانشگاه صنعتی امیرکبیر:</p>
        <p style="font-size:28px;font-weight:bold;letter-spacing:6px">${code}</p>
        <p style="color:#666">این کد تا ۱۰ دقیقه اعتبار دارد.</p>
      </div>`,
    });
    return { sent: true, provider: "smtp" };
  } catch (error) {
    console.error("[otp] smtp failed:", error);
    return { sent: false, provider: "smtp" };
  }
}

export async function sendOtpEmail(to: string, code: string): Promise<boolean> {
  // Prefer Resend when an API key exists; then SMTP; otherwise console-only (dev).
  const result =
    process.env.RESEND_API_KEY ? await sendViaResend(to, code) : await sendViaSmtp(to, code);

  if (result.sent) return true;

  if (result.provider === "resend") {
    // Resend was attempted but failed — still try SMTP as a safety net.
    const smtpFallback = await sendViaSmtp(to, code);
    if (smtpFallback.sent) return true;
  }

  console.log(`[otp] no mail provider succeeded — verification code for ${to}: ${code}`);
  return false;
}
