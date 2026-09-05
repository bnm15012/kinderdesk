/**
 * SMTP email utility using nodemailer.
 *
 * Required env vars (server-side only):
 *   SMTP_HOST     — e.g. smtp.resend.com
 *   SMTP_PORT     — e.g. 465
 *   SMTP_USER     — e.g. resend (or your email)
 *   SMTP_PASS     — SMTP password / API key
 *   SMTP_FROM     — e.g. "KinderDesk <noreply@kinderdesk.in>"
 */
import nodemailer from "nodemailer";

function getTransport() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT ?? "465", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error("SMTP not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS in env.");
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

const FROM = process.env.SMTP_FROM ?? "KinderDesk <noreply@kinderdesk.in>";

export async function sendConfirmationEmail(email: string, token: string, appUrl: string) {
  const transport = getTransport();
  const link = `${appUrl}/confirm?token=${token}`;
  await transport.sendMail({
    from: FROM,
    to: email,
    subject: "Confirm your KinderDesk account",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        <h2 style="color:#0f172a">Confirm your email</h2>
        <p>Thanks for signing up for KinderDesk! Click the button below to confirm your account.</p>
        <a href="${link}" style="display:inline-block;background:#6366f1;color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0">Confirm email</a>
        <p style="color:#64748b;font-size:13px">Link expires in 24 hours. If you didn't sign up, you can safely ignore this email.</p>
      </div>
    `,
  });
}

export async function sendOtpEmail(email: string, code: string) {
  const transport = getTransport();
  await transport.sendMail({
    from: FROM,
    to: email,
    subject: "Your KinderDesk password reset code",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        <h2 style="color:#0f172a">Password reset code</h2>
        <p>Use the code below to reset your KinderDesk password. It expires in 15 minutes.</p>
        <div style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#6366f1;padding:20px 0">${code}</div>
        <p style="color:#64748b;font-size:13px">If you didn't request this, ignore this email.</p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(email: string, token: string, appUrl: string) {
  const transport = getTransport();
  const link = `${appUrl}/reset-password?token=${token}`;
  await transport.sendMail({
    from: FROM,
    to: email,
    subject: "Reset your KinderDesk password",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        <h2 style="color:#0f172a">Password reset</h2>
        <p>Click the button below to reset your KinderDesk password. It expires in 1 hour.</p>
        <a href="${link}" style="display:inline-block;background:#6366f1;color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0">Reset password</a>
        <p style="color:#64748b;font-size:13px">If you didn't request this, ignore this email.</p>
      </div>
    `,
  });
}

export async function sendStaffInviteEmail(email: string, inviteUrl: string, schoolName: string) {
  const transport = getTransport();
  await transport.sendMail({
    from: FROM,
    to: email,
    subject: `You've been invited to join ${schoolName} on KinderDesk`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        <h2 style="color:#0f172a">You're invited!</h2>
        <p>${schoolName} has invited you to join their team on KinderDesk.</p>
        <p>Click the button below to set your password and activate your account.</p>
        <a href="${inviteUrl}" style="display:inline-block;background:#6366f1;color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0">Accept invitation</a>
        <p style="color:#64748b;font-size:13px">Link expires in 7 days. If you weren't expecting this, you can ignore this email.</p>
      </div>
    `,
  });
}
