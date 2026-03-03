"use client";

import { format, parseISO } from "date-fns";
import {
  TrialPaymentData,
  confirmTrialPayment,
} from "@/lib/actions/confirm-payment";
import { PaymentShell } from "@/components/payment/PaymentShell";

export function TrialPaymentClient({ data }: { data: TrialPaymentData }) {
  const sessionDate = parseISO(data.sessionDate);

  const lineItems = [
    { label: "Date", value: format(sessionDate, "EEEE, MMMM d, yyyy") },
    { label: "Time", value: `${data.startTime} – ${data.endTime}` },
    { label: "Duration", value: `${data.subClass.durationMinutes} minutes` },
    { label: "Type", value: "Trial Session (one-time)" },
    ...(data.subClass.level
      ? [{ label: "Level", value: data.subClass.level }]
      : []),
  ];

  return (
    <PaymentShell
      className={data.subClass.className}
      subClassName={data.subClass.name}
      badge="Trial Session"
      teacher={data.teacher}
      studentName={data.studentName}
      studentEmail={data.studentEmail}
      lineItems={lineItems}
      total={data.amount}
      currency={data.currency}
      alreadyPaid={data.status === "CONFIRMED"}
      onConfirm={() => confirmTrialPayment(data.trialBookingId)}
      successRedirect="/reservation?success=1"
    />
  );
}
