import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY!);

export const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL ?? 'Royal Academy <no-reply@royalacademy.om>';

// ─────────────────────────────────────────────────────────────────────────────
// Verification email
// ─────────────────────────────────────────────────────────────────────────────

export async function sendVerificationEmail({
  email,
  firstName,
  verifyUrl,
}: {
  email: string;
  firstName: string;
  verifyUrl: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Verify your email — Royal Academy',
      html: buildVerificationHtml({ firstName, verifyUrl }),
    });
    return { success: true };
  } catch (err) {
    console.error('sendVerificationEmail error:', err);
    return { success: false, error: String(err) };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Password reset email
// ─────────────────────────────────────────────────────────────────────────────

export async function sendPasswordResetEmail({
  email,
  resetUrl,
}: {
  email: string;
  resetUrl: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Reset your password — Royal Academy',
      html: buildPasswordResetHtml({ resetUrl }),
    });
    return { success: true };
  } catch (err) {
    console.error('sendPasswordResetEmail error:', err);
    return { success: false, error: String(err) };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HTML templates
// ─────────────────────────────────────────────────────────────────────────────

function buildVerificationHtml({
  firstName,
  verifyUrl,
}: {
  firstName: string;
  verifyUrl: string;
}) {
  const esc = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Verify your email — Royal Academy</title>
</head>
<body style="margin:0;padding:0;background:#592c41;font-family:'Georgia',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#592c41;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0a0f2c,#5c2d4a);border-radius:16px 16px 0 0;padding:32px 36px;text-align:center;">
              <p style="margin:0 0 4px;color:#c4a882;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;">Royal Academy</p>
              <h1 style="margin:0;color:#dec2ab;font-size:22px;font-weight:bold;letter-spacing:0.05em;">Verify Your Email</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#3a1e2e;padding:32px 36px;">
              <p style="margin:0 0 20px;color:#dec2ab;font-size:14px;line-height:1.6;">
                Dear ${esc(firstName)},
              </p>
              <p style="margin:0 0 28px;color:#c4a882aa;font-size:13px;line-height:1.6;">
                Thank you for registering with Royal Academy. Please verify your email address
                by clicking the button below. This link expires in <strong style="color:#dec2ab;">24 hours</strong>.
              </p>

              <!-- CTA -->
              <div style="text-align:center;margin-bottom:28px;">
                <a href="${verifyUrl}"
                   style="display:inline-block;background:linear-gradient(135deg,#c4a882,#d4b896);color:#0a0f2c;font-size:13px;font-weight:bold;text-decoration:none;padding:14px 32px;border-radius:10px;letter-spacing:0.05em;">
                  Verify My Email
                </a>
              </div>

              <p style="margin:0;color:#c4a882aa;font-size:12px;line-height:1.6;">
                If you did not create an account, you can safely ignore this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#0a0f2c;border-radius:0 0 16px 16px;padding:20px 36px;text-align:center;">
              <p style="margin:0 0 4px;color:#c4a882aa;font-size:11px;">Royal Academy · Muscat, Sultanate of Oman</p>
              <p style="margin:0;color:#c4a882aa;font-size:11px;">
                <a href="mailto:info@royalacademy.om" style="color:#c4a882;text-decoration:none;">info@royalacademy.om</a>
                &nbsp;·&nbsp;
                <a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'https://royalacademy.om'}" style="color:#c4a882;text-decoration:none;">royalacademy.om</a>
              </p>
              <p style="margin:12px 0 0;color:#c4a882aa;font-size:10px;font-style:italic;">"Where excellence meets art."</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildPasswordResetHtml({ resetUrl }: { resetUrl: string }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Reset your password — Royal Academy</title>
</head>
<body style="margin:0;padding:0;background:#592c41;font-family:'Georgia',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#592c41;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0a0f2c,#5c2d4a);border-radius:16px 16px 0 0;padding:32px 36px;text-align:center;">
              <p style="margin:0 0 4px;color:#c4a882;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;">Royal Academy</p>
              <h1 style="margin:0;color:#dec2ab;font-size:22px;font-weight:bold;letter-spacing:0.05em;">Reset Your Password</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#3a1e2e;padding:32px 36px;">
              <p style="margin:0 0 20px;color:#dec2ab;font-size:14px;line-height:1.6;">
                Hi there,
              </p>
              <p style="margin:0 0 28px;color:#c4a882aa;font-size:13px;line-height:1.6;">
                We received a request to reset your Royal Academy password.
                Click the button below to choose a new one. This link expires in
                <strong style="color:#dec2ab;">1 hour</strong>.
              </p>

              <!-- CTA -->
              <div style="text-align:center;margin-bottom:28px;">
                <a href="${resetUrl}"
                   style="display:inline-block;background:linear-gradient(135deg,#c4a882,#d4b896);color:#0a0f2c;font-size:13px;font-weight:bold;text-decoration:none;padding:14px 32px;border-radius:10px;letter-spacing:0.05em;">
                  Reset My Password
                </a>
              </div>

              <p style="margin:0;color:#c4a882aa;font-size:12px;line-height:1.6;">
                If you did not request a password reset, you can safely ignore this email.
                Your password will not be changed.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#0a0f2c;border-radius:0 0 16px 16px;padding:20px 36px;text-align:center;">
              <p style="margin:0 0 4px;color:#c4a882aa;font-size:11px;">Royal Academy · Muscat, Sultanate of Oman</p>
              <p style="margin:0;color:#c4a882aa;font-size:11px;">
                <a href="mailto:info@royalacademy.om" style="color:#c4a882;text-decoration:none;">info@royalacademy.om</a>
                &nbsp;·&nbsp;
                <a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'https://royalacademy.om'}" style="color:#c4a882;text-decoration:none;">royalacademy.om</a>
              </p>
              <p style="margin:12px 0 0;color:#c4a882aa;font-size:10px;font-style:italic;">"Where excellence meets art."</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Ticket reply notification email
// ─────────────────────────────────────────────────────────────────────────────

export async function sendTicketReplyEmail({
  toEmail,
  toName,
  ticketSubject,
  replyBody,
}: {
  toEmail: string;
  toName: string;
  ticketSubject: string;
  replyBody: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: toEmail,
      subject: `Re: ${ticketSubject} — Royal Academy Support`,
      html: buildTicketReplyHtml({ toName, ticketSubject, replyBody }),
    });
    return { success: true };
  } catch (err) {
    console.error('sendTicketReplyEmail error:', err);
    return { success: false, error: String(err) };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HTML template — matches Royal Academy's dark royal theme
// ─────────────────────────────────────────────────────────────────────────────

function buildTicketReplyHtml({
  toName,
  ticketSubject,
  replyBody,
}: {
  toName: string;
  ticketSubject: string;
  replyBody: string;
}) {
  // Escape HTML entities in user content
  const esc = (s: string) =>
    s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br/>');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Support Reply — Royal Academy</title>
</head>
<body style="margin:0;padding:0;background:#592c41;font-family:'Georgia',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#592c41;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0a0f2c,#5c2d4a);border-radius:16px 16px 0 0;padding:32px 36px;text-align:center;">
              <p style="margin:0 0 4px;color:#c4a882;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;">Royal Academy</p>
              <h1 style="margin:0;color:#dec2ab;font-size:22px;font-weight:bold;letter-spacing:0.05em;">Support Update</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#3a1e2e;padding:32px 36px;">

              <p style="margin:0 0 20px;color:#dec2ab;font-size:14px;line-height:1.6;">
                Dear ${esc(toName)},
              </p>

              <p style="margin:0 0 20px;color:#c4a882aa;font-size:13px;line-height:1.6;">
                Our support team has replied to your ticket:
              </p>

              <!-- Ticket subject pill -->
              <div style="background:rgba(196,168,130,0.08);border:1px solid rgba(196,168,130,0.2);border-radius:10px;padding:10px 16px;margin-bottom:20px;">
                <p style="margin:0;color:#c4a882;font-size:11px;text-transform:uppercase;letter-spacing:0.12em;">Ticket Subject</p>
                <p style="margin:4px 0 0;color:#dec2ab;font-size:13px;font-weight:bold;">${esc(ticketSubject)}</p>
              </div>

              <!-- Reply content -->
              <div style="background:rgba(196,168,130,0.05);border-left:3px solid #c4a882;border-radius:0 10px 10px 0;padding:16px 20px;margin-bottom:28px;">
                <p style="margin:0 0 8px;color:#c4a882;font-size:11px;text-transform:uppercase;letter-spacing:0.12em;">Reply from Royal Academy Team</p>
                <p style="margin:0;color:#dec2ab;font-size:14px;line-height:1.7;">${esc(replyBody)}</p>
              </div>

              <!-- CTA -->
              <div style="text-align:center;margin-bottom:24px;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'https://royalacademy.om'}/support"
                   style="display:inline-block;background:linear-gradient(135deg,#c4a882,#d4b896);color:#0a0f2c;font-size:13px;font-weight:bold;text-decoration:none;padding:12px 28px;border-radius:10px;letter-spacing:0.05em;">
                  View Full Conversation
                </a>
              </div>

              <p style="margin:0;color:#c4a882aa;font-size:12px;line-height:1.6;">
                You can view the full thread and reply on the Royal Academy website.
                If you have further questions, please don't hesitate to reach out.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#0a0f2c;border-radius:0 0 16px 16px;padding:20px 36px;text-align:center;">
              <p style="margin:0 0 4px;color:#c4a882aa;font-size:11px;">Royal Academy · Muscat, Sultanate of Oman</p>
              <p style="margin:0;color:#c4a882aa;font-size:11px;">
                <a href="mailto:info@royalacademy.om" style="color:#c4a882;text-decoration:none;">info@royalacademy.om</a>
                &nbsp;·&nbsp;
                <a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'https://royalacademy.om'}" style="color:#c4a882;text-decoration:none;">royalacademy.om</a>
              </p>
              <p style="margin:12px 0 0;color:#c4a882aa;font-size:10px;font-style:italic;">
                "Where excellence meets art."
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
