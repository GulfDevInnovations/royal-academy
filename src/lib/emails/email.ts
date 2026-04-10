// src/lib/email.ts
// Requires: npm install resend
// Env vars: RESEND_API_KEY, RESEND_FROM_EMAIL (e.g. "Royal Academy <no-reply@royalacademy.om>")

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);

export const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL ?? "Royal Academy <no-reply@royalacademy.om>";

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
    console.error("sendTicketReplyEmail error:", err);
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
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br/>");

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
                <a href="${process.env.NEXT_PUBLIC_APP_URL ?? "https://royalacademy.om"}/support"
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
                <a href="${process.env.NEXT_PUBLIC_APP_URL ?? "https://royalacademy.om"}" style="color:#c4a882;text-decoration:none;">royalacademy.om</a>
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