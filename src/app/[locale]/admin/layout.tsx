// src/app/[locale]/admin/layout.tsx
// Server component — verifies ADMIN role before rendering anything.
// Middleware already blocks non-admins, but this is a second layer of defence.

import AdminHeader from '@/components/admin/AdminHeader';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

interface AdminLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>; // Next.js 15: params is a Promise
}

export default async function AdminLayout({
  children,
  params,
}: AdminLayoutProps) {
  const { locale } = await params; // ✅ await before use

  const session = await auth();

  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect(`/${locale}/login`);
  }

  const adminName =
    session.user.name?.split(' ')[0] ??
    session.user.email?.split('@')[0] ??
    'Admin';

  return (
    <div
      dir="ltr"
      className="flex h-screen overflow-hidden"
      style={{ background: '#13161f' }}
    >
      {/* Background pattern */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: "url('/images/pattern.svg')",
          backgroundRepeat: 'repeat',
          backgroundSize: '1600px auto',
          opacity: 0.01,
          filter: 'sepia(1) saturate(0.5) brightness(2)',
        }}
      />
      <AdminSidebar />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <AdminHeader adminName={adminName} locale={locale} />

        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
