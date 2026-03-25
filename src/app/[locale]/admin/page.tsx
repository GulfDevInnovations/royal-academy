// src/app/[locale]/admin/page.tsx
// Dashboard — placeholder stats, ready to wire up to real data

export default function AdminDashboardPage() {
  const stats = [
    { label: "Total Students", value: "—", sub: "enrolled", accent: "#f59e0b" },
    {
      label: "Active Classes",
      value: "—",
      sub: "this month",
      accent: "#34d399",
    },
    {
      label: "Upcoming Sessions",
      value: "—",
      sub: "next 7 days",
      accent: "#60a5fa",
    },
    {
      label: "Pending Payments",
      value: "—",
      sub: "awaiting action",
      accent: "#f87171",
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Background pattern */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: "url('/images/pattern.svg')",
          backgroundRepeat: "repeat",
          backgroundSize: "1600px auto",
          opacity: 0.01,
          filter: "sepia(1) saturate(0.5) brightness(2)",
        }}
      />
      {/* Page heading */}
      <div>
        <h1 className="text-xl font-goudy font-semibold text-white/90 tracking-tight">
          Dashboard
        </h1>
        <p className="text-sm text-white/30 mt-0.5">
          Studio overview at a glance
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-white/[0.07] p-5 relative overflow-hidden"
            style={{ background: "#1a1d27" }}
          >
            {/* Accent top border */}
            <div
              className="absolute top-0 left-0 right-0 h-[2px] rounded-t-xl"
              style={{ background: stat.accent, opacity: 0.6 }}
            />
            <p className="text-xs text-white/35 font-medium uppercase tracking-wider">
              {stat.label}
            </p>
            <p
              className="text-3xl font-bold mt-2 tracking-tight"
              style={{ color: stat.accent }}
            >
              {stat.value}
            </p>
            <p className="text-xs text-white/25 mt-1">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Lower panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[
          "Recent Bookings",
          "Upcoming Sessions",
          "Latest Payments",
          "Pending Enrollments",
        ].map((title) => (
          <div
            key={title}
            className="rounded-xl border border-white/[0.07] p-5 h-56 flex flex-col"
            style={{ background: "#1a1d27" }}
          >
            <p className="text-sm font-medium text-white/60 mb-3">{title}</p>
            <div className="flex-1 flex items-center justify-center">
              <p className="text-xs text-white/20">Coming soon</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
