import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendInviteEmail(to: string, inviteUrl: string) {
  const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #0d9488; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">🐱 Trocker</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Track Rocky the Cat</p>
          </div>
          <div class="content">
            <h2>You've been invited!</h2>
            <p>You've been invited to join Trocker - the app for tracking Rocky's adventures around the neighborhood.</p>
            <p>Click the button below to create your account:</p>
            <div style="text-align: center;">
              <a href="${inviteUrl}" class="button">Accept Invitation</a>
            </div>
            <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
              Or copy and paste this link into your browser:<br>
              <code style="background: #f3f4f6; padding: 8px; display: inline-block; margin-top: 8px; border-radius: 4px; word-break: break-all;">${inviteUrl}</code>
            </p>
            <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
              This invitation link will expire in 7 days.
            </p>
          </div>
          <div class="footer">
            <p>Trocker - Track Rocky the Cat</p>
            <p><a href="${appUrl}" style="color: #0d9488;">Visit Trocker</a></p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
You've been invited to join Trocker!

You've been invited to join Trocker - the app for tracking Rocky's adventures around the neighborhood.

Click the link below to create your account:
${inviteUrl}

This invitation link will expire in 7 days.

---
Trocker - Track Rocky the Cat
${appUrl}
  `.trim();

  await transporter.sendMail({
    from: process.env.SMTP_FROM || '"Trocker" <noreply@localhost>',
    to,
    subject: '🐱 You\'ve been invited to Trocker',
    text,
    html,
  });
}

export async function testEmailConnection() {
  try {
    await transporter.verify();
    return { success: true };
  } catch (error) {
    console.error('Email connection test failed:', error);
    return { success: false, error };
  }
}
