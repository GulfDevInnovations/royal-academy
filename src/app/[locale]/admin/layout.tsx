// src/app/[locale]/admin/layout.tsx
// Server component — verifies ADMIN role before rendering anything.
// Middleware already blocks non-admins, but this is a second layer of defence.

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";

interface AdminLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>; // Next.js 15: params is a Promise
}

export default async function AdminLayout({
  children,
  params,
}: AdminLayoutProps) {
  const { locale } = await params; // ✅ await before use

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Double-check: middleware handles this, but belt-and-suspenders
  if (!user || user.app_metadata?.role !== "ADMIN") {
    redirect(`/${locale}/login`);
  }

  const adminName =
    user.user_metadata?.firstName ?? user.email?.split("@")[0] ?? "Admin";

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: "#13161f" }}
    >
      <AdminSidebar />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <AdminHeader adminName={adminName} locale={locale} />

        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
