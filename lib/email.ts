import { createTransport } from "nodemailer";
import { Resend } from "resend";

const emailProvider = process.env.EMAIL_PROVIDER || "resend";
const resendApiKey = process.env.RESEND_API_KEY;
const gmailUser = process.env.GMAIL_USER;
const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;
const emailFrom =
  process.env.EMAIL_FROM ||
  (gmailUser ? `ChatForge <${gmailUser}>` : "ChatForge <noreply@example.com>");

const resend = resendApiKey ? new Resend(resendApiKey) : null;

type SendEmailOptions = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

async function sendWithGmail({ to, subject, html, text }: SendEmailOptions) {
  if (!gmailUser || !gmailAppPassword) {
    console.warn(
      "GMAIL_USER or GMAIL_APP_PASSWORD is not configured. Skipping Gmail email send."
    );
    return { sent: false };
  }

  try {
    const transporter = createTransport({
      service: "gmail",
      auth: {
        user: gmailUser,
        pass: gmailAppPassword,
      },
    });

    await transporter.sendMail({
      from: emailFrom,
      to,
      subject,
      html,
      text,
    });

    return { sent: true };
  } catch (error) {
    console.error("Gmail email error:", error);
    return { sent: false };
  }
}

async function sendWithResend({ to, subject, html, text }: SendEmailOptions) {
  if (!resend) {
    console.warn("RESEND_API_KEY is not configured. Skipping Resend email send.");
    return { sent: false };
  }

  const result = await resend.emails.send({
    from: emailFrom,
    to,
    subject,
    html,
    text,
  });

  if (result.error) {
    console.error("Resend email error:", result.error);
    return { sent: false };
  }

  return { sent: true };
}

async function sendEmail(options: SendEmailOptions) {
  if (emailProvider === "gmail") {
    return sendWithGmail(options);
  }

  return sendWithResend(options);
}

export async function sendVerificationEmail({
  to,
  verificationUrl,
}: {
  to: string;
  verificationUrl: string;
}) {
  return sendEmail({
    to,
    subject: "Verify your ChatForge email",
    text: `Verify your ChatForge email by opening this link: ${verificationUrl}`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6;">
        <h1 style="font-size: 24px;">Verify your email</h1>
        <p>Welcome to ChatForge. Confirm your email address to activate your account.</p>
        <p>
          <a
            href="${verificationUrl}"
            style="display: inline-block; padding: 10px 16px; background: #111827; color: #ffffff; text-decoration: none; border-radius: 8px;"
          >
            Verify Email
          </a>
        </p>
        <p>If the button does not work, copy and paste this link into your browser:</p>
        <p style="word-break: break-all;">${verificationUrl}</p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail({
  to,
  resetUrl,
}: {
  to: string;
  resetUrl: string;
}) {
  return sendEmail({
    to,
    subject: "Reset your ChatForge password",
    text: `Reset your ChatForge password by opening this link: ${resetUrl}`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6;">
        <h1 style="font-size: 24px;">Reset your ChatForge password</h1>
        <p>We received a request to reset your ChatForge password.</p>
        <p>
          <a
            href="${resetUrl}"
            style="display: inline-block; padding: 10px 16px; background: #111827; color: #ffffff; text-decoration: none; border-radius: 8px;"
          >
            Reset Password
          </a>
        </p>
        <p>If you did not request this, you can ignore this email.</p>
        <p>If the button does not work, copy and paste this link into your browser:</p>
        <p style="word-break: break-all;">${resetUrl}</p>
      </div>
    `,
  });
}
