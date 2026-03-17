const nodemailer = require("nodemailer");

function getTransport() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
}

async function sendVerificationEmail(toEmail, name, token, baseUrl) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.log(`[EMAIL SKIPPED] Verification token for ${toEmail}: ${token}`);
    console.log(`[EMAIL SKIPPED] Verify URL: ${baseUrl}/verify-email?token=${token}`);
    return;
  }
  const verifyUrl = `${baseUrl}/verify-email?token=${token}`;
  const transporter = getTransport();
  await transporter.sendMail({
    from: `"ResumeCraft" <${process.env.GMAIL_USER}>`,
    to: toEmail,
    subject: "Verify your ResumeCraft account",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px;background:#f9fafb;border-radius:12px;">
        <h2 style="color:#1e3a8a;margin:0 0 8px">Welcome to ResumeCraft, ${name}!</h2>
        <p style="color:#374151;margin:0 0 24px">Click the button below to verify your email address and activate your account.</p>
        <a href="${verifyUrl}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:15px;">Verify Email</a>
        <p style="color:#6b7280;font-size:13px;margin:24px 0 0">This link expires in 24 hours. If you didn't sign up, ignore this email.</p>
      </div>
    `,
  });
}

module.exports = { sendVerificationEmail };
