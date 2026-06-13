'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { ComplementaryRequestStatus } from '@prisma/client';
import { sendSms } from '@/lib/sms';
import { Resend } from 'resend';
import { FROM_EMAIL } from '@/lib/email';

const resend = new Resend(process.env.RESEND_API_KEY!);

// ─────────────────────────────────────────────
// READ
// ─────────────────────────────────────────────

export async function getComplementaryRequests() {
  return prisma.complementaryClassRequest.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      subClass: {
        select: { id: true, name: true, name_ar: true },
      },
    },
  });
}

// ─────────────────────────────────────────────
// STATUS UPDATE
// ─────────────────────────────────────────────

export async function updateRequestStatus(
  id: string,
  status: ComplementaryRequestStatus,
): Promise<{ error?: string }> {
  try {
    await prisma.complementaryClassRequest.update({ where: { id }, data: { status } });
    revalidatePath('/admin/complementary-classes');
    return {};
  } catch {
    return { error: 'Failed to update status.' };
  }
}

// ─────────────────────────────────────────────
// NOTES UPDATE
// ─────────────────────────────────────────────

export async function updateRequestNotes(
  id: string,
  notes: string,
): Promise<{ error?: string }> {
  try {
    await prisma.complementaryClassRequest.update({ where: { id }, data: { notes } });
    revalidatePath('/admin/complementary-classes');
    return {};
  } catch {
    return { error: 'Failed to save notes.' };
  }
}

// ─────────────────────────────────────────────
// DELETE
// ─────────────────────────────────────────────

export async function deleteComplementaryRequest(id: string): Promise<{ error?: string }> {
  try {
    await prisma.complementaryClassRequest.delete({ where: { id } });
    revalidatePath('/admin/complementary-classes');
    return {};
  } catch {
    return { error: 'Failed to delete request.' };
  }
}

// ─────────────────────────────────────────────
// SEND EMAIL
// ─────────────────────────────────────────────

export async function sendEmailToRequester(
  id: string,
  subject: string,
  message: string,
): Promise<{ error?: string }> {
  try {
    const req = await prisma.complementaryClassRequest.findUnique({ where: { id } });
    if (!req) return { error: 'Request not found.' };
    if (!req.email) return { error: 'This requester did not provide an email address.' };

    const esc = (s: string) =>
      s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br/>');

    const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><title>${esc(subject)}</title></head>
<body style="margin:0;padding:0;background:#592c41;font-family:'Georgia',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#592c41;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
        <tr>
          <td style="background:linear-gradient(135deg,#0a0f2c,#5c2d4a);border-radius:16px 16px 0 0;padding:32px 36px;text-align:center;">
            <p style="margin:0 0 4px;color:#c4a882;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;">Royal Academy</p>
            <h1 style="margin:0;color:#dec2ab;font-size:22px;font-weight:bold;">15-Minute Complementary Class</h1>
          </td>
        </tr>
        <tr>
          <td style="background:#3a1e2e;padding:32px 36px;">
            <p style="margin:0 0 20px;color:#dec2ab;font-size:14px;line-height:1.6;">Dear ${esc(req.studentName)},</p>
            <div style="color:#dec2ab;font-size:14px;line-height:1.7;">${esc(message)}</div>
          </td>
        </tr>
        <tr>
          <td style="background:#0a0f2c;border-radius:0 0 16px 16px;padding:20px 36px;text-align:center;">
            <p style="margin:0;color:#c4a882aa;font-size:11px;">Royal Academy · Muscat, Sultanate of Oman</p>
            <p style="margin:4px 0 0;color:#c4a882aa;font-size:10px;font-style:italic;">"Where excellence meets art."</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    await resend.emails.send({
      from: FROM_EMAIL,
      to: req.email,
      subject,
      html,
    });

    await prisma.complementaryClassRequest.update({
      where: { id },
      data: { status: 'CONTACTED' },
    });

    revalidatePath('/admin/complementary-classes');
    return {};
  } catch (err) {
    console.error('sendEmailToRequester error:', err);
    return { error: 'Failed to send email.' };
  }
}

// ─────────────────────────────────────────────
// SEND SMS
// ─────────────────────────────────────────────

export async function sendSmsToRequester(
  id: string,
  message: string,
): Promise<{ error?: string }> {
  try {
    const req = await prisma.complementaryClassRequest.findUnique({ where: { id } });
    if (!req) return { error: 'Request not found.' };

    const result = await sendSms({ to: req.contactNumber, body: message });
    if (!result.success) return { error: result.error ?? 'Failed to send SMS.' };

    await prisma.complementaryClassRequest.update({
      where: { id },
      data: { status: 'CONTACTED' },
    });

    revalidatePath('/admin/complementary-classes');
    return {};
  } catch (err) {
    console.error('sendSmsToRequester error:', err);
    return { error: 'Failed to send SMS.' };
  }
}

// ─────────────────────────────────────────────
// SEND IN-APP NOTIFICATION (broadcasts to all admins)
// ─────────────────────────────────────────────

export async function sendInAppNotification(
  id: string,
  subject: string,
  message: string,
): Promise<{ error?: string }> {
  try {
    const req = await prisma.complementaryClassRequest.findUnique({ where: { id } });
    if (!req) return { error: 'Request not found.' };

    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN', isActive: true },
      select: { id: true },
    });

    if (admins.length === 0) return { error: 'No active admin users found.' };

    await prisma.notification.createMany({
      data: admins.map((a) => ({
        userId: a.id,
        type: 'INAPP' as const,
        status: 'PENDING' as const,
        subject,
        body: `[Complementary Class Request — ${req.studentName}] ${message}`,
      })),
    });

    revalidatePath('/admin/complementary-classes');
    return {};
  } catch (err) {
    console.error('sendInAppNotification error:', err);
    return { error: 'Failed to send in-app notification.' };
  }
}

// ─────────────────────────────────────────────
// EXPORT EXCEL DATA
// Returns plain objects that the client will turn into .xlsx
// ─────────────────────────────────────────────

export async function getComplementaryRequestsForExport() {
  const rows = await prisma.complementaryClassRequest.findMany({
    orderBy: { createdAt: 'desc' },
    include: { subClass: { select: { name: true } } },
  });

  return rows.map((r) => {
    let days: string[] = [];
    try { days = JSON.parse(r.preferredDays as string); } catch {}
    return {
      'Student Name': r.studentName,
      'Date of Birth': r.dateOfBirth.toISOString().slice(0, 10),
      'Program': r.subClass.name,
      'Background': r.background === 'MORE_THAN_ONE_YEAR' ? 'More than a year' : 'Less than a year',
      'Contact Number': r.contactNumber,
      'Email': r.email ?? '',
      'Preferred Days': days.join(', '),
      'Status': r.status,
      'Notes': r.notes ?? '',
      'Submitted At': r.createdAt.toISOString().replace('T', ' ').slice(0, 19),
    };
  });
}
