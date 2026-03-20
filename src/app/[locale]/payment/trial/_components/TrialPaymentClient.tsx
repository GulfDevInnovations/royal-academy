// src/app/[locale]/payment/trial/_components/TrialPaymentClient.tsx
"use client";

import { format, parseISO } from "date-fns";
import { confirmTrialPayment } from "@/lib/actions/confirm-payment";
import { PaymentShell } from "@/components/payment/PaymentShell";

export type TrialPaymentProps = {
  amount: number;
  currency: string;
  studentName: string;
  studentEmail: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  subClass: {
    name: string;
    className: string;
    level: string | null;
    durationMinutes: number;
  };
  teacher: {
    firstName: string;
    lastName: string;
    photoUrl: string | null;
  } | null;
};

export function TrialPaymentClient({ data }: { data: TrialPaymentProps }) {
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
      total={data.amount.toString()}
      currency={data.currency}
      alreadyPaid={false}
      onConfirm={() =>
        confirmTrialPayment({
          studentId: data.studentId,
          subClassId: data.subClassId,
          sessionId: data.sessionId,
          amount: data.amount,
          currency: data.currency,
        })
      }
      successRedirect="/reservation?success=1"
    />
  );
}
