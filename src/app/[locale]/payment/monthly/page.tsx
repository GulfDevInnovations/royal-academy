// src/app/[locale]/payment/monthly/page.tsx
import { notFound } from "next/navigation";
import { getMonthlyPaymentData } from "@/lib/actions/confirm-payment";
import { MonthlyPaymentClient } from "./_components/MonthlyPaymentClient";

export const metadata = {
  title: "Complete Payment | Royal Academy",
};

export default async function MonthlyPaymentPage({
  searchParams,
}: {
  searchParams: Promise<{ enrollmentId?: string }>;
}) {
  const { enrollmentId } = await searchParams;
  if (!enrollmentId) notFound();

  const data = await getMonthlyPaymentData(enrollmentId);
  if (!data) notFound();

  return <MonthlyPaymentClient data={data} />;
}
