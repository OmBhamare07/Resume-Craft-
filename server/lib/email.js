const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');

const ses = new SESClient({ region: process.env.AWS_REGION || 'us-east-1' });
const FROM = process.env.SES_FROM_EMAIL || 'noreply@resumecraft.app';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

async function sendVerificationEmail(toEmail, name, token) {
  const link = `${FRONTEND_URL}/verify-email?token=${token}`;
  await ses.send(new SendEmailCommand({
    Source: FROM,
    Destination: { ToAddresses: [toEmail] },
    Message: {
      Subject: { Data: 'Verify your ResumeCraft account' },
      Body: {
        Html: {
          Data: `
            <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px;background:#f8fafc;border-radius:12px;">
              <h1 style="color:#1e3a8a;font-size:22px;margin-bottom:8px;">Welcome to ResumeCraft 👋</h1>
              <p style="color:#334155;font-size:15px;">Hi ${name}, please verify your email to get started.</p>
              <a href="${link}" style="display:inline-block;margin:24px 0;padding:12px 28px;background:#2563eb;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">
                Verify Email Address
              </a>
              <p style="color:#94a3b8;font-size:12px;">This link expires in 24 hours. If you didn't sign up, ignore this email.</p>
            </div>
          `,
        },
        Text: { Data: `Verify your ResumeCraft account: ${link}` },
      },
    },
  }));
}

module.exports = { sendVerificationEmail };
