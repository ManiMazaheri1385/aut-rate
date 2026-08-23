// Standalone SMTP tester — bypasses the app entirely.
// Usage: node scripts/test-smtp.mjs <host> <port> <user> <password> <to>
import nodemailer from "nodemailer";

const [host, port, user, pass, to] = process.argv.slice(2);

if (!host || !port || !user || !pass || !to) {
  console.log("Usage: node scripts/test-smtp.mjs <host> <port> <user> <password> <to>");
  process.exit(1);
}

console.log(`Connecting to ${host}:${port} as ${user} ...`);

const transport = nodemailer.createTransport({
  host,
  port: Number(port),
  secure: Number(port) === 465,
  auth: { user, pass },
});

try {
  const info = await transport.sendMail({
    from: user,
    to,
    subject: "SMTP Test - AUT Rate",
    text: "Agar in email ra didid, settings dorost ast.",
  });
  console.log("SUCCESS:", info.messageId);
} catch (error) {
  console.error("FAILED:");
  console.error(error instanceof Error ? error.message : error);
}
