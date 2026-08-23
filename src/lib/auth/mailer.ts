import nodemailer from "nodemailer";

/**
 * Sends the OTP email. When SMTP is not configured (local development),
 * the code is printed to the server console instead of failing.
 */
export async function sendOtpEmail(to: string, code: string): Promise<boolean> {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;

  if (!host || !user || !pass) {
    console.log(`[otp] SMTP not configured — verification code for ${to}: ${code}`);
    return false;
  }

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
    return true;
  } catch (error) {
    console.error("[otp] failed to send email:", error);
    console.log(`[otp] fallback — verification code for ${to}: ${code}`);
    return false;
  }
}
