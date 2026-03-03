"use client";

import {
  MonthlyPaymentData,
  confirmMonthlyPayment,
} from "@/lib/actions/confirm-payment";
import { PaymentShell } from "@/components/payment/PaymentShell";

const MONTH_NAMES = [
  "",
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const DAY_LABELS: Record<string, string> = {
  MONDAY: "Monday",
  TUESDAY: "Tuesday",
  WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday",
  FRIDAY: "Friday",
  SATURDAY: "Saturday",
  SUNDAY: "Sunday",
};

const FREQUENCY_LABELS: Record<string, string> = {
  ONCE_PER_WEEK: "Once a Week",
  TWICE_PER_WEEK: "Twice a Week",
};

export function MonthlyPaymentClient({ data }: { data: MonthlyPaymentData }) {
  const badge = `Monthly · ${FREQUENCY_LABELS[data.frequency] ?? data.frequency}`;
  const monthLabel = `${MONTH_NAMES[data.month]} ${data.year}`;
  const daysLabel = data.preferredDays
    .map((d) => DAY_LABELS[d] ?? d)
    .join(" & ");
  const sessionsCount = data.frequency === "ONCE_PER_WEEK" ? 4 : 8;

  const lineItems = [
    { label: "Month", value: monthLabel },
    {
      label: "Schedule",
      value: `${FREQUENCY_LABELS[data.frequency]} · ${daysLabel}`,
    },
    { label: "Sessions", value: `${sessionsCount} sessions` },
    { label: "Duration", value: `${data.subClass.durationMinutes} min each` },
    ...(data.subClass.level
      ? [{ label: "Level", value: data.subClass.level }]
      : []),
  ];

  return (
    <PaymentShell
      className={data.subClass.className}
      subClassName={data.subClass.name}
      badge={badge}
      teacher={data.teacher}
      studentName={data.studentName}
      studentEmail={data.studentEmail}
      lineItems={lineItems}
      total={data.totalAmount}
      currency={data.currency}
      alreadyPaid={data.status === "CONFIRMED"}
      onConfirm={() => confirmMonthlyPayment(data.enrollmentId)}
      successRedirect="/reservation?success=1"
    />
  );
}
