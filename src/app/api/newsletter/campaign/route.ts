// src/app/api/newsletter/campaign/route.ts

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  // ── Auth guard — admin only ────────────────────────────────────────────────
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { subject, previewText, heading, body: emailBody, source } = body;

    // ── Validate ──────────────────────────────────────────────────────────────
    if (!subject?.trim()) {
      return NextResponse.json(
        { error: 'Subject is required.' },
        { status: 400 },
      );
    }
    if (!emailBody?.trim()) {
      return NextResponse.json(
        { error: 'Email body is required.' },
        { status: 400 },
      );
    }

    // ── Fetch recipients ──────────────────────────────────────────────────────
    const where: Record<string, unknown> = { status: 'active' };
    if (source && source !== 'all') where.source = source;

    const subscribers = await prisma.newsletterSubscriber.findMany({
      where,
      select: { email: true },
    });

    if (subscribers.length === 0) {
      return NextResponse.json(
        { error: 'No active subscribers found for this audience.' },
        { status: 400 },
      );
    }

    const emails = subscribers.map((s) => s.email);

    // ── Build unsubscribe footer ───────────────────────────────────────────────
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://radma.com';

    // ── HTML email template ───────────────────────────────────────────────────
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Georgia,serif;">
  ${previewText ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${previewText}</div>` : ''}

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:#111118;padding:32px 40px;border-radius:8px 8px 0 0;">
              <p style="margin:0;font-size:13px;letter-spacing:.18em;text-transform:uppercase;color:rgba(255,255,255,.45);">
                Royal Academy
              </p>
              ${heading ? `<h1 style="margin:12px 0 0;font-size:24px;font-weight:600;color:#ffffff;line-height:1.3;">${heading}</h1>` : ''}
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#ffffff;padding:36px 40px;">
              <div style="font-size:15px;line-height:1.75;color:#374151;">
                ${emailBody
                  .split('\n')
                  .filter((line: string) => line.trim())
                  .map(
                    (line: string) => `<p style="margin:0 0 16px;">${line}</p>`,
                  )
                  .join('')}
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9f9fb;padding:24px 40px;border-radius:0 0 8px 8px;border-top:1px solid #e5e7eb;">
              <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;line-height:1.6;">
                You are receiving this because you subscribed at
                <a href="${siteUrl}" style="color:#6b7280;">${siteUrl}</a>.<br/>
                <a href="${siteUrl}/unsubscribe" style="color:#6b7280;text-decoration:underline;">
                  Unsubscribe
                </a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    // ── Send via Resend ───────────────────────────────────────────────────────
    // Resend supports up to 50 recipients per call in the `to` array (on paid).
    // On free tier, send one at a time using bcc or batch in chunks of 1.
    // We use bcc with a no-reply to: so recipients don't see each other.

    const CHUNK_SIZE = 50;
    const chunks: string[][] = [];
    for (let i = 0; i < emails.length; i += CHUNK_SIZE) {
      chunks.push(emails.slice(i, i + CHUNK_SIZE));
    }

    let sent = 0;
    const errors: string[] = [];

    for (const chunk of chunks) {
      const result = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL!,
        to: process.env.RESEND_FROM_EMAIL!, // send to self
        bcc: chunk, // actual recipients via bcc
        subject,
        html,
      });
      console.log('Resend result:', JSON.stringify(result, null, 2));

      if (result.error) {
        errors.push(result.error.message);
      } else {
        sent += chunk.length;
      }
    }

    if (errors.length > 0 && sent === 0) {
      return NextResponse.json(
        { error: `Failed to send: ${errors[0]}` },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      sent,
      failed: emails.length - sent,
    });
  } catch (err) {
    console.error('[newsletter/campaign]', err);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 },
    );
  }
}
