import { getTranslations } from 'next-intl/server';
import {
  getDashboardStats,
  getRecentBookings,
  getUpcomingSessionsToday,
  getLatestSignups,
  getLatestTickets,
} from './dashboard-actions';

const TICKET_STATUS_COLORS: Record<string, string> = {
  OPEN: '#dc2626',
  IN_PROGRESS: '#d97706',
  RESOLVED: '#059669',
  CLOSED: '#6b7280',
};

const BOOKING_STATUS_COLORS: Record<string, string> = {
  CONFIRMED: '#059669',
  CANCELLED: '#dc2626',
  RESCHEDULED: '#d97706',
  COMPLETED: '#2563eb',
  NO_SHOW: '#6b7280',
};

function formatTime(time: string) {
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
}

function isToday(date: Date) {
  const now = new Date();
  const d = new Date(date);
  return (
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  );
}

export default async function AdminDashboardPage() {
  const [
    t,
    stats,
    recentBookings,
    upcomingSessions,
    latestSignups,
    latestTickets,
  ] = await Promise.all([
    getTranslations('admin'),
    getDashboardStats(),
    getRecentBookings(),
    getUpcomingSessionsToday(),
    getLatestSignups(),
    getLatestTickets(),
  ]);

  const statCards = [
    {
      label: t('totalStudents'),
      value: stats.totalStudents,
      sub: t('enrolled'),
      accent: '#f59e0b',
    },
    {
      label: t('workshopsThisMonth'),
      value: stats.workshopsThisMonth,
      sub: t('thisMonth'),
      accent: '#34d399',
    },
    {
      label: t('upcomingSessions'),
      value: stats.upcomingSessions,
      sub: t('next7Days'),
      accent: '#60a5fa',
    },
    {
      label: t('activeClasses'),
      value: stats.activeClasses,
      sub: t('subClassesActive'),
      accent: '#f87171',
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page heading */}
      <div>
        <h1 className="text-3xl font-goudy font-semibold text-gray-900 tracking-tight">
          {t('items.Dashboard')}
        </h1>
        <p className="text-xl text-gray-400 mt-0.5">{t('dashboardSubtitle')}</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-black/8 p-5 relative overflow-hidden"
            style={{ background: '#ffffff' }}
          >
            <div
              className="absolute top-0 left-0 right-0 h-[2px] rounded-t-xl"
              style={{ background: stat.accent, opacity: 0.7 }}
            />
            <p className="text-sm text-gray-400 font-medium uppercase tracking-wider">
              {stat.label}
            </p>
            <p
              className="text-4xl font-bold mt-2 tracking-tight"
              style={{ color: stat.accent }}
            >
              {stat.value}
            </p>
            <p className="text-sm text-gray-400 mt-1">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Lower panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Bookings */}
        <div
          className="rounded-xl border border-black/8 p-5 flex flex-col"
          style={{ background: '#ffffff' }}
        >
          <p className="text-base font-semibold text-gray-500 mb-3 uppercase tracking-wider">
            {t('recentBookings')}
          </p>
          {recentBookings.length === 0 ? (
            <p className="text-sm text-gray-300 my-auto text-center py-6">
              {t('noBookingsYet')}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-400 text-xs uppercase tracking-wider border-b border-black/5">
                    <th className="text-left pb-2 font-medium">
                      {t('student')}
                    </th>
                    <th className="text-left pb-2 font-medium">{t('class')}</th>
                    <th className="text-left pb-2 font-medium">{t('date')}</th>
                    <th className="text-left pb-2 font-medium">
                      {t('status')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {recentBookings.map((b) => (
                    <tr key={b.id} className="text-gray-600">
                      <td className="py-2 pr-3 font-medium text-gray-800 whitespace-nowrap">
                        {b.studentName}
                      </td>
                      <td className="py-2 pr-3 text-gray-500 whitespace-nowrap">
                        {b.subClass}
                      </td>
                      <td className="py-2 pr-3 text-gray-400 whitespace-nowrap">
                        {formatDate(b.sessionDate)}
                      </td>
                      <td className="py-2">
                        <span
                          className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{
                            color: BOOKING_STATUS_COLORS[b.status] ?? '#94a3b8',
                            background:
                              (BOOKING_STATUS_COLORS[b.status] ?? '#94a3b8') +
                              '22',
                          }}
                        >
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Upcoming Sessions (today & tomorrow) */}
        <div
          className="rounded-xl border border-black/8 p-5 flex flex-col"
          style={{ background: '#ffffff' }}
        >
          <p className="text-base font-semibold text-gray-500 mb-3 uppercase tracking-wider">
            {t('upcomingSessions')}
            <span className="ml-2 text-xs text-gray-400 normal-case tracking-normal font-normal">
              {t('todayAndTomorrow')}
            </span>
          </p>
          {upcomingSessions.length === 0 ? (
            <p className="text-sm text-gray-300 my-auto text-center py-6">
              {t('noSessionsTodayTomorrow')}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-400 text-xs uppercase tracking-wider border-b border-black/5">
                    <th className="text-left pb-2 font-medium">{t('class')}</th>
                    <th className="text-left pb-2 font-medium">
                      {t('teacher')}
                    </th>
                    <th className="text-left pb-2 font-medium">{t('time')}</th>
                    <th className="text-left pb-2 font-medium">{t('day')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {upcomingSessions.map((s) => (
                    <tr key={s.id} className="text-gray-600">
                      <td className="py-2 pr-3 font-medium text-gray-800 whitespace-nowrap">
                        {s.subClass}
                      </td>
                      <td className="py-2 pr-3 text-gray-500 whitespace-nowrap">
                        {s.teacher}
                      </td>
                      <td className="py-2 pr-3 text-gray-400 whitespace-nowrap">
                        {formatTime(s.startTime)} – {formatTime(s.endTime)}
                      </td>
                      <td className="py-2">
                        <span
                          className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={
                            isToday(s.sessionDate)
                              ? { color: '#2563eb', background: 'rgba(37,99,235,0.08)' }
                              : { color: '#6b7280', background: 'rgba(107,114,128,0.10)' }
                          }
                        >
                          {isToday(s.sessionDate) ? t('today') : t('tomorrow')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Latest Signups */}
        <div
          className="rounded-xl border border-black/8 p-5 flex flex-col"
          style={{ background: '#ffffff' }}
        >
          <p className="text-base font-semibold text-gray-500 mb-3 uppercase tracking-wider">
            {t('latestSignups')}
          </p>
          {latestSignups.length === 0 ? (
            <p className="text-sm text-gray-300 my-auto text-center py-6">
              {t('noSignupsYet')}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-400 text-xs uppercase tracking-wider border-b border-black/5">
                    <th className="text-left pb-2 font-medium">{t('name')}</th>
                    <th className="text-left pb-2 font-medium">{t('email')}</th>
                    <th className="text-left pb-2 font-medium">{t('phone')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {latestSignups.map((u) => (
                    <tr key={u.id} className="text-gray-600">
                      <td className="py-2 pr-3 font-medium text-gray-800 whitespace-nowrap">
                        {u.name}
                      </td>
                      <td className="py-2 pr-3 text-gray-500 max-w-40 truncate">
                        {u.email}
                      </td>
                      <td className="py-2 text-gray-400 whitespace-nowrap">
                        {u.phone}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Last 3 Tickets */}
        <div
          className="rounded-xl border border-black/8 p-5 flex flex-col"
          style={{ background: '#ffffff' }}
        >
          <p className="text-base font-semibold text-gray-500 mb-3 uppercase tracking-wider">
            {t('last3Tickets')}
          </p>
          {latestTickets.length === 0 ? (
            <p className="text-sm text-gray-300 my-auto text-center py-6">
              {t('noTicketsYet')}
            </p>
          ) : (
            <div className="space-y-3">
              {latestTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="flex items-start justify-between gap-3 border-b border-black/5 pb-3 last:border-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {ticket.subject}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {ticket.userName} · {formatDate(ticket.createdAt)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap"
                      style={{
                        color: TICKET_STATUS_COLORS[ticket.status] ?? '#94a3b8',
                        background:
                          (TICKET_STATUS_COLORS[ticket.status] ?? '#94a3b8') +
                          '22',
                      }}
                    >
                      {ticket.status.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-gray-400">
                      {ticket.priority}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
