// src/app/[locale]/admin/schedules/page.tsx

import {
  getSchedules,
  getScheduleFormOptions,
} from "@/lib/actions/admin/Schedules.actions";
import SchedulesClient from "./_components/ScheduleClient";

function serializeSchedules(
  schedules: Awaited<ReturnType<typeof getSchedules>>,
) {
  return schedules.map((s) => ({
    ...s,
    startDate: s.startDate.toISOString(),
    endDate: s.endDate ? s.endDate.toISOString() : null,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  }));
}

export type SerializedSchedules = ReturnType<typeof serializeSchedules>;
export type SerializedSchedule = SerializedSchedules[number];

export default async function AdminSchedulesPage() {
  const [raw, formOptions] = await Promise.all([
    getSchedules(),
    getScheduleFormOptions(),
  ]);

  return (
    <SchedulesClient
      initialSchedules={serializeSchedules(raw)}
      formOptions={formOptions}
    />
  );
}
