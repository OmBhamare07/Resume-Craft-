const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');

const ses = new SESClient({ region: process.env.AWS_REGION || 'us-east-1' });

async function sendVerificationEmail(toEmail, name, token) {
  const verifyUrl = `${process.env.BACKEND_URL}/api/auth/verify-email?token=${token}`;

  await ses.send(new SendEmailCommand({
    Source: process.env.SES_FROM_EMAIL,
    Destination: { ToAddresses: [toEmail] },
    Message: {
      Subject: { Data: 'Verify your ResumeCraft account' },
      Body: {
        Html: {
          Data: `
          <!DOCTYPE html>
          <html>
          <body style="font-family: Arial, sans-serif; background: #f4f4f5; margin: 0; padding: 40px 20px;">
            <div style="max-width: 520px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08);">
              <div style="background: linear-gradient(135deg, #2563eb, #1d4ed8); padding: 32px; text-align: center;">
                <h1 style="color: #fff; margin: 0; font-size: 24px; letter-spacing: -0.5px;">ResumeCraft</h1>
                <p style="color: rgba(255,255,255,0.8); margin: 6px 0 0; font-size: 14px;">Build your perfect resume</p>
              </div>
              <div style="padding: 36px 32px;">
                <h2 style="margin: 0 0 12px; font-size: 20px; color: #111;">Welcome, ${name}! 👋</h2>
                <p style="color: #555; margin: 0 0 24px; line-height: 1.6;">
                  Thanks for signing up. Please verify your email address to activate your account.
                </p>
                <a href="${verifyUrl}" style="display: inline-block; background: #2563eb; color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 15px;">
                  Verify Email Address
                </a>
                <p style="color: #999; margin: 24px 0 0; font-size: 13px;">
                  This link expires in 24 hours. If you didn't create an account, you can ignore this email.
                </p>
              </div>
            </div>
          </body>
          </html>`,
        },
      },
    },
  }));
}

module.exports = { sendVerificationEmail };
