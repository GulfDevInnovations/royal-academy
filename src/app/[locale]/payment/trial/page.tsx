// src/app/[locale]/payment/trial/page.tsx
import { notFound } from "next/navigation";
import { getTrialPaymentData } from "@/lib/actions/confirm-payment";
import { TrialPaymentClient } from "./components/TrialPaymentClient";

export const metadata = {
  title: "Complete Payment | Royal Academy",
};

export default async function TrialPaymentPage({
  searchParams,
}: {
  searchParams: Promise<{ trialBookingId?: string }>;
}) {
  const { trialBookingId } = await searchParams;
  if (!trialBookingId) notFound();

  const data = await getTrialPaymentData(trialBookingId);
  if (!data) notFound();

  return <TrialPaymentClient data={data} />;
}
