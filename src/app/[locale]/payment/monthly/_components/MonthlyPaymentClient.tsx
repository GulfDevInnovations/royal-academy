"use client";

import { useRouter } from "next/navigation";
import { PaymentShell } from "@/components/payment/PaymentShell";
import { DayOfWeek, FrequencyType } from "@prisma/client";

export type MonthlyPaymentProps = {
  month: number;
  year: number;
  frequency: FrequencyType;
  preferredDays: DayOfWeek[];
  amount: number;
  currency: string;
  studentName: string;
  studentEmail: string;
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

export function MonthlyPaymentClient({ data }: { data: MonthlyPaymentProps }) {
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
      total={data.amount.toString()}
      currency={data.currency}
      alreadyPaid={true}
      onConfirm={async () => ({ success: true })}
      successRedirect="/reservation?success=1"
    />
  );
}
