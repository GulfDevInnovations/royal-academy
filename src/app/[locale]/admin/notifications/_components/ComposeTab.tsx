"use client";

import { useRef, useState, useTransition } from "react";
import {
  Send,
  Clock,
  ChevronDown,
  ChevronUp,
  Users,
  User,
  BookOpen,
  AlertCircle,
  Loader2,
  CheckCircle2,
  X,
} from "lucide-react";
import { sendNotification } from "@/lib/actions/admin/Notifications.actions";
import type { AudienceOptions } from "../page";
import {
  AdminButton,
  AdminSelect,
  AdminInput,
  adminColors,
} from "@/components/admin/ui";

// ─────────────────────────────────────────────
// Built-in templates
// ─────────────────────────────────────────────

const TEMPLATES = [
  {
    id: "payment_reminder",
    label: "Payment Reminder",
    subject: "Payment Due",
    body: "Dear student, this is a friendly reminder that your monthly enrollment payment is due. Please complete your payment to confirm your spot.",
  },
  {
    id: "class_cancelled",
    label: "Class Cancelled",
    subject: "Class Cancellation Notice",
    body: "We regret to inform you that today's class has been cancelled. We apologise for the inconvenience and will notify you of the rescheduled date.",
  },
  {
    id: "welcome",
    label: "Welcome Message",
    subject: "Welcome to the Academy!",
    body: "Welcome! We are thrilled to have you join us. If you have any questions, please don't hesitate to reach out.",
  },
  {
    id: "enrollment_confirmed",
    label: "Enrollment Confirmed",
    subject: "Enrollment Confirmed",
    body: "Your enrollment has been confirmed. We look forward to seeing you in class. Please arrive 5 minutes early for your first session.",
  },
  {
    id: "holiday_notice",
    label: "Holiday Notice",
    subject: "Academy Holiday Notice",
    body: "Please note that the academy will be closed for the upcoming holiday. Classes will resume as normal after the break.",
  },
];

const AUDIENCE_OPTIONS = [
  { value: "ALL_STUDENTS", label: "All Students", icon: <Users size={13} /> },
  { value: "ALL_TEACHERS", label: "All Teachers", icon: <Users size={13} /> },
  {
    value: "SUBCLASS_STUDENTS",
    label: "Students in a Sub-class",
    icon: <BookOpen size={13} />,
  },
  {
    value: "UNPAID_STUDENTS",
    label: "Students with Unpaid Enrollment",
    icon: <AlertCircle size={13} />,
  },
  { value: "CUSTOM", label: "Custom Selection", icon: <User size={13} /> },
];

const MONTHS = [
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

interface Props {
  audienceOptions: AudienceOptions;
  onSent: (count: number) => void;
}

export default function ComposeTab({ audienceOptions, onSent }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const now = new Date();

  const [target, setTarget] = useState("ALL_STUDENTS");
  const [notifType, setNotifType] = useState("SMS");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [subClassId, setSubClassId] = useState("");
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [scheduled, setScheduled] = useState(false);
  const [scheduledFor, setScheduledFor] = useState("");
  const [customIds, setCustomIds] = useState<string[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const smsLimit = 160;

  const applyTemplate = (t: (typeof TEMPLATES)[0]) => {
    setSubject(t.subject);
    setBody(t.body);
    setImageUrl("");
    setLinkUrl("");
    setShowTemplates(false);
  };

  const toggleCustomId = (userId: string) => {
    setCustomIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const fd = new FormData();
    fd.set("target", target);
    fd.set("type", notifType);
    fd.set("subject", subject);
    fd.set("imageUrl", imageUrl);
    fd.set("linkUrl", linkUrl);
    fd.set("body", body);
    fd.set("subClassId", subClassId);
    fd.set("month", String(month));
    fd.set("year", String(year));
    fd.set("scheduledFor", scheduled && scheduledFor ? scheduledFor : "");
    fd.set("customIds", customIds.join(","));

    startTransition(async () => {
      const result = await sendNotification(fd);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(
          `Notification queued for ${result.count} recipient${result.count !== 1 ? "s" : ""}.`,
        );
        setBody("");
        setSubject("");
        setImageUrl("");
        setLinkUrl("");
        setCustomIds([]);
        onSent(result.count ?? 0);
      }
    });
  };

  // All users for custom selection
  const allPeople = [
    ...audienceOptions.students.map((s) => ({
      userId: s.userId,
      name: `${s.firstName} ${s.lastName}`,
      role: "Student",
      contact: s.user.phone ?? s.user.email ?? "",
    })),
    ...audienceOptions.teachers
      .filter((t) => t.userId)
      .map((t) => ({
        userId: t.userId!,
        name: `${t.firstName} ${t.lastName}`,
        role: "Teacher",
        contact: t.user?.phone ?? t.user?.email ?? "",
      })),
  ];

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
      {/* ── Templates ── */}
      <div
        className="rounded-xl border overflow-hidden"
        style={{ borderColor: "rgba(255,255,255,0.07)" }}
      >
        <button
          type="button"
          onClick={() => setShowTemplates((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm transition-colors hover:bg-white/[0.02]"
          style={{ color: adminColors.textSecondary }}
        >
          <span className="font-medium">Message Templates</span>
          {showTemplates ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        {showTemplates && (
          <div
            className="border-t grid grid-cols-1 divide-y"
            style={{ borderColor: "rgba(255,255,255,0.06)" }}
          >
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => applyTemplate(t)}
                className="flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-white/[0.02]"
              >
                <div
                  className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                  style={{ background: "#f59e0b" }}
                />
                <div>
                  <p
                    className="text-xs font-medium"
                    style={{ color: adminColors.textPrimary }}
                  >
                    {t.label}
                  </p>
                  <p
                    className="text-xs mt-0.5 line-clamp-1"
                    style={{ color: adminColors.textMuted }}
                  >
                    {t.body}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Audience ── */}
      <Section title="Audience">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {AUDIENCE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setTarget(opt.value)}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-all"
              style={{
                borderColor:
                  target === opt.value
                    ? "rgba(245,158,11,0.5)"
                    : "rgba(255,255,255,0.07)",
                background:
                  target === opt.value
                    ? "rgba(245,158,11,0.08)"
                    : "rgba(255,255,255,0.02)",
              }}
            >
              <span
                style={{
                  color:
                    target === opt.value ? "#f59e0b" : adminColors.textMuted,
                }}
              >
                {opt.icon}
              </span>
              <span
                className="text-xs font-medium"
                style={{
                  color:
                    target === opt.value
                      ? "#f59e0b"
                      : adminColors.textSecondary,
                }}
              >
                {opt.label}
              </span>
            </button>
          ))}
        </div>

        {/* Sub-class picker */}
        {target === "SUBCLASS_STUDENTS" && (
          <div className="grid grid-cols-2 gap-3 mt-3">
            <AdminSelect
              label="Sub-class"
              value={subClassId}
              onChange={(e) => setSubClassId(e.target.value)}
            >
              <option className="text-black" value="">
                Select sub-class…
              </option>
              {audienceOptions.subClasses.map((s) => (
                <option className="text-black" key={s.id} value={s.id}>
                  {s.class.name} → {s.name}
                </option>
              ))}
            </AdminSelect>
            <AdminSelect
              label="Month"
              value={String(month)}
              onChange={(e) => setMonth(Number(e.target.value))}
            >
              {MONTHS.map((m, i) => (
                <option className="text-black" key={i} value={i + 1}>
                  {m}
                </option>
              ))}
            </AdminSelect>
          </div>
        )}

        {/* Unpaid picker */}
        {target === "UNPAID_STUDENTS" && (
          <div className="grid grid-cols-2 gap-3 mt-3">
            <AdminSelect
              label="Month"
              value={String(month)}
              onChange={(e) => setMonth(Number(e.target.value))}
            >
              {MONTHS.map((m, i) => (
                <option className="text-black" key={i} value={i + 1}>
                  {m}
                </option>
              ))}
            </AdminSelect>
            <AdminSelect
              label="Year"
              value={String(year)}
              onChange={(e) => setYear(Number(e.target.value))}
            >
              {[year - 1, year, year + 1].map((y) => (
                <option className="text-black" key={y} value={y}>
                  {y}
                </option>
              ))}
            </AdminSelect>
          </div>
        )}

        {/* Custom selection */}
        {target === "CUSTOM" && (
          <div className="mt-3 space-y-2">
            <p className="text-xs" style={{ color: adminColors.textMuted }}>
              Select recipients ({customIds.length} selected)
            </p>
            <div
              className="rounded-xl border overflow-hidden max-h-48 overflow-y-auto"
              style={{ borderColor: "rgba(255,255,255,0.07)" }}
            >
              {allPeople.map((person) => {
                const isSelected = customIds.includes(person.userId);
                return (
                  <label
                    key={person.userId}
                    className="flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors hover:bg-white/[0.02] border-b"
                    style={{ borderColor: "rgba(255,255,255,0.04)" }}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleCustomId(person.userId)}
                      className="accent-amber-500 w-3.5 h-3.5"
                    />
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-xs font-medium truncate"
                        style={{ color: adminColors.textPrimary }}
                      >
                        {person.name}
                      </p>
                      <p
                        className="text-[10px]"
                        style={{ color: adminColors.textMuted }}
                      >
                        {person.role} · {person.contact || "No contact"}
                      </p>
                    </div>
                    {isSelected && (
                      <div
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ background: "#f59e0b" }}
                      />
                    )}
                  </label>
                );
              })}
            </div>
          </div>
        )}
      </Section>

      {/* ── Message ── */}
      <Section title="Message">
        <div className="grid grid-cols-2 gap-3">
          <AdminSelect
            label="Type"
            value={notifType}
            onChange={(e) => setNotifType(e.target.value)}
          >
            <option className="text-black" value="SMS">
              SMS
            </option>
            <option className="text-black" value="EMAIL">
              Email
            </option>
            <option className="text-black" value="BOTH">
              SMS + Email
            </option>
            <option className="text-black" value="INAPP">
              In-App
            </option>
          </AdminSelect>
        </div>

        {(notifType === "EMAIL" ||
          notifType === "BOTH" ||
          notifType === "INAPP") && (
          <AdminInput
            label="Subject"
            value={subject}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setSubject(e.target.value)
            }
            placeholder="e.g. Payment Reminder"
          />
        )}

        <div className="space-y-1.5">
          <label
            className="text-xs font-medium"
            style={{ color: adminColors.textSecondary }}
          >
            Message Body *
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={5}
            placeholder="Type your message here…"
            className="w-full px-3 py-2.5 rounded-xl border bg-white/[0.03] text-sm text-white/80 placeholder-white/20 focus:outline-none focus:border-amber-500/40 resize-none transition-colors"
            style={{ borderColor: "rgba(255,255,255,0.07)" }}
            required
          />
          <div className="flex items-center justify-between">
            <p className="text-[10px]" style={{ color: adminColors.textMuted }}>
              {notifType === "SMS" || notifType === "BOTH"
                ? `${body.length} chars · ${Math.ceil(body.length / smsLimit) || 1} SMS segment${Math.ceil(body.length / smsLimit) > 1 ? "s" : ""}`
                : `${body.length} chars`}
            </p>
            {notifType === "INAPP" && (
              <div className="space-y-3">
                <AdminInput
                  label="Image URL (optional)"
                  value={imageUrl}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setImageUrl(e.target.value)
                  }
                  placeholder="https://yoursite.com/image.jpg"
                  type="url"
                />
                <AdminInput
                  label="Link URL (optional)"
                  value={linkUrl}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setLinkUrl(e.target.value)
                  }
                  placeholder="https://yoursite.com/workshops"
                  type="url"
                />
                <div
                  className="flex items-center gap-2 px-3 py-2 rounded-lg"
                  style={{
                    background: "rgba(245,158,11,0.06)",
                    border: "1px solid rgba(245,158,11,0.15)",
                  }}
                >
                  <p
                    className="text-xs"
                    style={{ color: "rgba(245,158,11,0.8)" }}
                  >
                    In-app notifications appear in the student's notification
                    bell on the website. Link opens in a new tab when clicked.
                  </p>
                </div>
              </div>
            )}
            {notifType !== "EMAIL" &&
              notifType !== "INAPP" &&
              body.length > smsLimit && (
                <p className="text-[10px]" style={{ color: "#f59e0b" }}>
                  Splits into {Math.ceil(body.length / smsLimit)} SMS messages
                </p>
              )}
          </div>
        </div>
      </Section>

      {/* ── Schedule — not relevant for in-app, they appear instantly ── */}
      {notifType !== "INAPP" && (
        <Section title="Delivery">
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => setScheduled((v) => !v)}
              className="w-9 h-5 rounded-full relative transition-colors flex-shrink-0"
              style={{
                background: scheduled ? "#f59e0b" : "rgba(255,255,255,0.1)",
              }}
            >
              <div
                className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all"
                style={{ left: scheduled ? "calc(100% - 18px)" : "2px" }}
              />
            </div>
            <div>
              <p
                className="text-sm"
                style={{ color: adminColors.textSecondary }}
              >
                Schedule for later
              </p>
              <p className="text-xs" style={{ color: adminColors.textMuted }}>
                Send immediately if off, or pick a future date/time
              </p>
            </div>
          </label>

          {scheduled && (
            <AdminInput
              label="Send at"
              type="datetime-local"
              value={scheduledFor}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setScheduledFor(e.target.value)
              }
              min={new Date().toISOString().slice(0, 16)}
              required={scheduled}
            />
          )}

          {!scheduled && (
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-lg"
              style={{
                background: "rgba(96,165,250,0.06)",
                border: "1px solid rgba(96,165,250,0.12)",
              }}
            >
              <Send size={12} style={{ color: "#60a5fa" }} />
              <p className="text-xs" style={{ color: "rgba(96,165,250,0.8)" }}>
                Notification will be queued immediately for your SMS/email
                worker.
              </p>
            </div>
          )}
        </Section>
      )}

      {/* ── Feedback ── */}
      {error && (
        <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
          <AlertCircle
            size={13}
            className="flex-shrink-0 mt-0.5 text-red-400"
          />
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-green-500/10 border border-green-500/20">
          <CheckCircle2 size={13} className="text-green-400" />
          <p className="text-xs text-green-400">{success}</p>
        </div>
      )}

      <div className="flex items-center justify-between pt-1">
        <p className="text-xs" style={{ color: adminColors.textMuted }}>
          {scheduled && scheduledFor
            ? `Scheduled for ${new Date(scheduledFor).toLocaleString("en-GB")}`
            : "Will send immediately"}
        </p>
        <AdminButton
          type="submit"
          variant="primary"
          disabled={isPending || !body.trim()}
        >
          {isPending ? (
            <Loader2 size={13} className="animate-spin" />
          ) : scheduled ? (
            <Clock size={13} />
          ) : (
            <Send size={13} />
          )}
          {scheduled ? "Schedule" : "Send Now"}
        </AdminButton>
      </div>
    </form>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <p
        className="text-[10px] font-semibold tracking-widest uppercase"
        style={{ color: "rgba(245,158,11,0.6)" }}
      >
        {title}
      </p>
      {children}
    </div>
  );
}
