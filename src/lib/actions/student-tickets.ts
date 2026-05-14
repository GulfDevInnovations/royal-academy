'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export interface SubmitTicketInput {
  subject: string;
  body: string;
}

export async function submitStudentTicket(
  input: SubmitTicketInput,
): Promise<{ success: boolean; ticketId?: string; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user) return { success: false, error: 'Not authenticated' };

    const subject = input.subject.trim();
    const body = input.body.trim();

    if (!subject || subject.length < 3)
      return {
        success: false,
        error: 'Subject must be at least 3 characters.',
      };
    if (!body || body.length < 10)
      return {
        success: false,
        error: 'Message must be at least 10 characters.',
      };
    if (subject.length > 120)
      return { success: false, error: 'Subject must be under 120 characters.' };
    if (body.length > 2000)
      return {
        success: false,
        error: 'Message must be under 2000 characters.',
      };

    const ticket = await prisma.supportTicket.create({
      data: {
        userId: session.user.id,
        subject,
        body,
        status: 'OPEN',
        priority: 'NORMAL',
      },
    });

    return { success: true, ticketId: ticket.id };
  } catch (err) {
    console.error('submitStudentTicket error:', err);
    return {
      success: false,
      error: 'Failed to submit ticket. Please try again.',
    };
  }
}

export async function getMyTickets() {
  try {
    const session = await auth();
    if (!session?.user) return { data: [], error: 'Not authenticated' };

    const tickets = await prisma.supportTicket.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            role: true,
            studentProfile: { select: { firstName: true, lastName: true } },
            teacherProfile: { select: { firstName: true, lastName: true } },
          },
        },
        replies: {
          orderBy: { createdAt: 'asc' },
          include: {
            user: {
              select: {
                role: true,
                adminProfile: { select: { firstName: true, lastName: true } },
                studentProfile: { select: { firstName: true, lastName: true } },
              },
            },
          },
        },
      },
    });

    return { data: tickets };
  } catch (err) {
    console.error('getMyTickets error:', err);
    return { data: [], error: 'Failed to load tickets.' };
  }
}
