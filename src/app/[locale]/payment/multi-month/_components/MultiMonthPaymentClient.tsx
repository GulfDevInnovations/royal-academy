'use client';

import { PaymentShell } from '@/components/payment/PaymentShell';
import { DayOfWeek, FrequencyType } from '@prisma/client';

export type MultiMonthPaymentProps = {
  startMonth: number;
  startYear: number;
  endMonth: number;
  endYear: number;
  totalMonths: number;
  frequency: FrequencyType;
  preferredDays: DayOfWeek[];
  monthlyPrice: number;
  totalAmount: number;
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
  '',
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const MONTH_SHORT = [
  '',
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const DAY_SHORT: Record<string, string> = {
  MONDAY: 'Mon',
  TUESDAY: 'Tue',
  WEDNESDAY: 'Wed',
  THURSDAY: 'Thu',
  FRIDAY: 'Fri',
  SATURDAY: 'Sat',
  SUNDAY: 'Sun',
};

const FREQUENCY_LABELS: Record<string, string> = {
  ONCE_PER_WEEK: 'Once a Week',
  TWICE_PER_WEEK: 'Twice a Week',
};

export function MultiMonthPaymentClient({
  data,
}: {
  data: MultiMonthPaymentProps;
}) {
  const daysLabel = data.preferredDays
    .map((d) => DAY_SHORT[d] ?? d)
    .join(' & ');
  const sessionsPerMonth = data.frequency === 'ONCE_PER_WEEK' ? 4 : 8;
  const totalSessions = sessionsPerMonth * data.totalMonths;
  const monthlyDisplay = data.monthlyPrice.toFixed(3);
  const badge = `${data.totalMonths}-Month Plan · ${FREQUENCY_LABELS[data.frequency] ?? data.frequency}`;

  const lineItems = [
    {
      label: 'Period',
      value: `${MONTH_NAMES[data.startMonth]} ${data.startYear} → ${MONTH_NAMES[data.endMonth]} ${data.endYear}`,
    },
    { label: 'Duration', value: `${data.totalMonths} months` },
    {
      label: 'Schedule',
      value: `${FREQUENCY_LABELS[data.frequency] ?? data.frequency} · ${daysLabel}`,
    },
    {
      label: 'Sessions',
      value: `${totalSessions} total (${sessionsPerMonth}/month × ${data.totalMonths} months)`,
    },
    { label: 'Per Month', value: `${monthlyDisplay} ${data.currency}` },
    {
      label: 'Class Duration',
      value: `${data.subClass.durationMinutes} min each`,
    },
    ...(data.subClass.level
      ? [{ label: 'Level', value: data.subClass.level }]
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
      total={data.totalAmount.toString()}
      currency={data.currency}
      alreadyPaid={true}
      onConfirm={async () => ({ success: true })}
      successRedirect="/enrollment?success=1"
    />
  );
}
