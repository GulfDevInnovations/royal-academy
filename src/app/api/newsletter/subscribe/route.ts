// src/app/api/newsletter/subscribe/route.ts

import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, source } = body;

    // ── Validate ────────────────────────────────────────────────────────────
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required.' },
        { status: 400 },
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json(
        { error: 'Invalid email address.' },
        { status: 400 },
      );
    }

    const validSources = ['sidebar', 'footer', 'other'];
    const resolvedSource = validSources.includes(source) ? source : 'other';

    // ── Upsert ──────────────────────────────────────────────────────────────
    // If they previously unsubscribed and sign up again → reactivate them.
    // If already active → silently succeed (don't leak whether email exists).
    const existing = await prisma.newsletterSubscriber.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (existing) {
      if (existing.status === 'active') {
        // Already subscribed — return success so we don't reveal the email exists
        return NextResponse.json({ ok: true });
      }

      // Was unsubscribed/bounced — reactivate
      await prisma.newsletterSubscriber.update({
        where: { id: existing.id },
        data: {
          status: 'active',
          unsubscribedAt: null,
          source: resolvedSource,
        },
      });

      return NextResponse.json({ ok: true });
    }

    // New subscriber
    await prisma.newsletterSubscriber.create({
      data: {
        email: email.trim().toLowerCase(),
        source: resolvedSource,
        status: 'active',
      },
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error('[newsletter/subscribe]', err);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 },
    );
  }
}
