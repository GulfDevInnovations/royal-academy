// src/app/[locale]/payments/page.tsx
import { getStudentPayments } from '@/lib/actions/student-payments';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import PaymentsClient from './_components/PaymentsClient';

export const metadata = { title: 'My Payments | Royal Academy' };

export default async function PaymentsPage() {
  const authSession = await auth();
  if (!authSession?.user) redirect('/login?redirect=/payments');

  const { data: payments, error } = await getStudentPayments();

  if (error && error !== 'Not authenticated') {
    // Non-auth error — still render with empty state
    console.error('PaymentsPage error:', error);
  }

  return <PaymentsClient payments={payments} />;
}
