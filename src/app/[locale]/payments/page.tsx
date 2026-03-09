// src/app/[locale]/payments/page.tsx
import { getStudentPayments } from "@/lib/actions/student-payments";
import PaymentsClient from "./_components/PaymentsClient";
import { Crown } from "lucide-react";

export default async function PaymentsPage() {
  const { data: payments, error } = await getStudentPayments();

  if (error === "Not authenticated") {
    // Let your middleware handle the redirect; this is a fallback
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-royal-cream/50 text-sm">
          Please sign in to view your payments.
        </p>
      </div>
    );
  }

  return <PaymentsClient payments={payments} />;
}
