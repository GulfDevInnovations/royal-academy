// src/app/[locale]/support/_components/SupportClient.tsx
"use client";

import { useState, useTransition } from "react";
import {
  Crown,
  Search,
  ChevronDown,
  ChevronUp,
  Send,
  CheckCircle2,
  Clock,
  MessageSquare,
  AlertCircle,
  Loader2,
  HelpCircle,
  X,
} from "lucide-react";
import { submitStudentTicket } from "@/lib/actions/student-tickets";

const ORANGE = "#ff751f";

const FAQ_ITEMS = [
  {
    category: "Booking & Scheduling",
    icon: "📅",
    items: [
      {
        q: "How do I book a trial class?",
        a: "Navigate to any class page and click 'Book a Trial'. Trials are 10 OMR and give you a full session to experience the class before committing to a monthly plan.",
      },
      {
        q: "Can I reschedule a class?",
        a: "Yes — you can reschedule up to 24 hours before your session starts. Go to My Classes and tap the reschedule option on your booking.",
      },
      {
        q: "What happens if a class is cancelled by the instructor?",
        a: "You'll be notified immediately via email and in-app notification. A make-up session will be offered or a full credit applied to your account.",
      },
      {
        q: "How many times per week can I attend?",
        a: "Monthly plans come in two frequencies: once per week or twice per week. Choose your preferred frequency when enrolling.",
      },
    ],
  },
  {
    category: "Payments & Invoices",
    icon: "💳",
    items: [
      {
        q: "When is my monthly payment due?",
        a: "Monthly payments are due on the 1st of each month. You'll receive a reminder 5 days in advance.",
      },
      {
        q: "Can I get a refund?",
        a: "Trial classes are refundable within 24 hours of booking if you haven't attended. Monthly plans are non-refundable after the first session of the month.",
      },
      {
        q: "How do I download my invoice?",
        a: "Go to My Payments, expand any transaction, and click 'View Invoice'. From there you can print or share a PDF of the invoice.",
      },
      {
        q: "Which payment methods are accepted?",
        a: "We accept credit/debit cards and bank transfers. All payments are processed securely through Thawani Pay.",
      },
    ],
  },
  {
    category: "Classes & Instructors",
    icon: "✨",
    items: [
      {
        q: "What levels are available?",
        a: "We offer Beginner, Intermediate, and Advanced levels across most disciplines. Some classes are open to All Levels.",
      },
      {
        q: "Can my child join adult classes?",
        a: "Each class specifies an age group (Kids, Teens, Adults, All Ages). Please check the class details before booking.",
      },
      {
        q: "How do I know who my instructor is?",
        a: "Your instructor is shown on the class page, in your booking confirmation, and on your invoice.",
      },
    ],
  },
  {
    category: "Account",
    icon: "👤",
    items: [
      {
        q: "How do I update my profile?",
        a: "Go to Settings → Profile. You can update your name, contact details, emergency contact, and medical information there.",
      },
      {
        q: "I forgot my password — what do I do?",
        a: "Click 'Forgot password' on the sign-in page. A reset link will be sent to your registered email within a few minutes.",
      },
      {
        q: "Can I have multiple students under one account?",
        a: "Currently each account represents one student. Family accounts are on our roadmap — submit a ticket to register your interest.",
      },
    ],
  },
];

type TicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";

interface SerializedReply {
  id: string;
  body: string;
  createdAt: string;
  user: {
    role: string;
    adminProfile: { firstName: string; lastName: string } | null;
    studentProfile: { firstName: string; lastName: string } | null;
  };
}
interface SerializedTicket {
  id: string;
  subject: string;
  body: string;
  status: TicketStatus;
  priority: string;
  createdAt: string;
  updatedAt: string;
  replies: SerializedReply[];
  user: {
    id: string;
    email: string | null;
    phone: string | null;
    role: string;
    studentProfile: { firstName: string; lastName: string } | null;
    teacherProfile: { firstName: string; lastName: string } | null;
  };
}

function TicketStatusBadge({ status }: { status: TicketStatus }) {
  const map: Record<TicketStatus, { label: string; cls: string }> = {
    OPEN: {
      label: "Open",
      cls: "bg-amber-50 text-amber-600 border-amber-200",
    },
    IN_PROGRESS: {
      label: "In Progress",
      cls: "bg-sky-50 text-sky-600 border-sky-200",
    },
    RESOLVED: {
      label: "Resolved",
      cls: "bg-emerald-50 text-emerald-600 border-emerald-200",
    },
    CLOSED: {
      label: "Closed",
      cls: "bg-gray-100 text-gray-500 border-gray-300",
    },
  };
  const { label, cls } = map[status] ?? map.OPEN;
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${cls}`}
    >
      {label}
    </span>
  );
}

function FaqPanel({ onClose }: { onClose: () => void }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [openKey, setOpenKey] = useState<string | null>(null);
  const q = searchQuery.toLowerCase().trim();
  const filtered = FAQ_ITEMS.map((cat) => ({
    ...cat,
    items: cat.items.filter(
      (item) =>
        !q ||
        item.q.toLowerCase().includes(q) ||
        item.a.toLowerCase().includes(q),
    ),
  })).filter((cat) => cat.items.length > 0);

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: "#ffffff", border: "1px solid #e5e7eb" }}
    >
      {/* Panel header */}
      <div
        className="flex items-center justify-between px-6 py-5 border-b"
        style={{ borderColor: "#e5e7eb" }}
      >
        <div className="flex items-center gap-3">
          <HelpCircle size={18} style={{ color: ORANGE }} />
          <span className="font-semibold text-base" style={{ color: "#111827" }}>
            Frequently Asked Questions
          </span>
          <span className="text-xs" style={{ color: "#9ca3af" }}>
            {FAQ_ITEMS.reduce((s, c) => s + c.items.length, 0)} questions
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 transition-colors"
          style={{ color: "#9ca3af" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#6b7280")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#9ca3af")}
        >
          <X size={18} />
        </button>
      </div>

      {/* Search */}
      <div className="px-6 pt-5 pb-3">
        <div
          className="flex items-center gap-3 rounded-xl px-5 py-3"
          style={{ background: "#f9fafb", border: "1px solid #e5e7eb" }}
        >
          <Search size={15} className="shrink-0" style={{ color: "#9ca3af" }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search questions…"
            className="flex-1 bg-transparent text-base outline-none"
            style={{ color: "#111827" }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="transition-colors"
              style={{ color: "#9ca3af" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#6b7280")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#9ca3af")}
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* FAQ list */}
      <div className="px-6 pb-6 pt-3 space-y-6 max-h-150 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="text-center py-10">
            <HelpCircle
              size={36}
              className="mx-auto mb-3"
              style={{ color: "rgba(255,117,31,0.3)" }}
            />
            <p className="text-base" style={{ color: "#9ca3af" }}>
              No matches for &quot;{searchQuery}&quot;
            </p>
            <p className="text-sm mt-1" style={{ color: "#d1d5db" }}>
              Try a different word or submit a ticket below.
            </p>
          </div>
        ) : (
          filtered.map((cat) => (
            <div key={cat.category}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-base">{cat.icon}</span>
                <span
                  className="text-xs uppercase tracking-widest font-semibold"
                  style={{ color: ORANGE }}
                >
                  {cat.category}
                </span>
              </div>
              <div className="space-y-2">
                {cat.items.map((item) => {
                  const key = `${cat.category}-${item.q}`;
                  const isOpen = openKey === key;
                  return (
                    <div
                      key={key}
                      className="rounded-xl overflow-hidden transition-all duration-200"
                      style={{
                        background: isOpen ? `rgba(255,117,31,0.05)` : "#f9fafb",
                        border: isOpen
                          ? `1px solid rgba(255,117,31,0.3)`
                          : "1px solid #e5e7eb",
                      }}
                    >
                      <button
                        onClick={() => setOpenKey(isOpen ? null : key)}
                        className="w-full flex items-center justify-between px-5 py-4 text-left"
                      >
                        <span
                          className="text-base transition-colors"
                          style={{ color: isOpen ? ORANGE : "#374151" }}
                        >
                          {item.q}
                        </span>
                        <span className="shrink-0 ml-4" style={{ color: "#9ca3af" }}>
                          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </span>
                      </button>
                      {isOpen && (
                        <div className="px-5 pb-4">
                          <p
                            className="text-base leading-relaxed border-t pt-4"
                            style={{ color: "#6b7280", borderColor: "#e5e7eb" }}
                          >
                            {item.a}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function MyTickets({ tickets }: { tickets: SerializedTicket[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  if (tickets.length === 0) return null;
  return (
    <div className="space-y-4">
      {tickets.map((t) => {
        const isOpen = openId === t.id;
        return (
          <div
            key={t.id}
            className="rounded-2xl overflow-hidden"
            style={{ background: "#ffffff", border: "1px solid #e5e7eb" }}
          >
            <button
              onClick={() => setOpenId(isOpen ? null : t.id)}
              className="w-full flex items-center gap-4 p-5 text-left"
            >
              <MessageSquare
                size={18}
                className="shrink-0"
                style={{ color: `rgba(255,117,31,0.6)` }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap mb-1">
                  <span
                    className="text-base font-medium truncate"
                    style={{ color: "#111827" }}
                  >
                    {t.subject}
                  </span>
                  <TicketStatusBadge status={t.status} />
                </div>
                <div className="text-sm" style={{ color: "#9ca3af" }}>
                  {new Date(t.createdAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                  {t.replies.length > 0 && (
                    <span className="ml-2" style={{ color: ORANGE }}>
                      · {t.replies.length}{" "}
                      {t.replies.length === 1 ? "reply" : "replies"}
                    </span>
                  )}
                </div>
              </div>
              <span className="shrink-0" style={{ color: "#d1d5db" }}>
                {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </span>
            </button>

            {isOpen && (
              <div
                className="border-t px-5 py-5 space-y-4"
                style={{ borderColor: "#e5e7eb" }}
              >
                {/* Original message */}
                <div
                  className="rounded-xl p-5"
                  style={{ background: "#f9fafb", border: "1px solid #e5e7eb" }}
                >
                  <div
                    className="text-xs uppercase tracking-widest mb-2.5"
                    style={{ color: "#9ca3af" }}
                  >
                    Your message
                  </div>
                  <p className="text-base leading-relaxed" style={{ color: "#4b5563" }}>
                    {t.body}
                  </p>
                </div>

                {/* Replies */}
                {t.replies.map((r) => {
                  const isAdmin = r.user.role === "ADMIN";
                  const name = isAdmin
                    ? r.user.adminProfile
                      ? `${r.user.adminProfile.firstName} ${r.user.adminProfile.lastName}`
                      : "Royal Academy Team"
                    : "You";
                  return (
                    <div
                      key={r.id}
                      className={`rounded-xl p-5 ${isAdmin ? "" : "ml-6"}`}
                      style={{
                        background: isAdmin ? `rgba(255,117,31,0.05)` : "#f9fafb",
                        border: isAdmin
                          ? `1px solid rgba(255,117,31,0.2)`
                          : "1px solid #e5e7eb",
                      }}
                    >
                      <div className="flex items-center justify-between mb-2.5">
                        <span
                          className="text-xs uppercase tracking-widest font-semibold"
                          style={{ color: isAdmin ? ORANGE : "#9ca3af" }}
                        >
                          {name}
                        </span>
                        <span className="text-xs" style={{ color: "#9ca3af" }}>
                          {new Date(r.createdAt).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="text-base leading-relaxed" style={{ color: "#4b5563" }}>
                        {r.body}
                      </p>
                    </div>
                  );
                })}

                {t.replies.length === 0 && t.status === "OPEN" && (
                  <div className="flex items-center gap-2.5 text-sm px-1" style={{ color: "#9ca3af" }}>
                    <Clock size={13} />
                    Our team typically responds within 1 business day.
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function TicketForm() {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = () => {
    setError(null);
    if (!subject.trim() || !body.trim()) {
      setError("Please fill in both fields.");
      return;
    }
    startTransition(async () => {
      const result = await submitStudentTicket({ subject, body });
      if (result.success) {
        setSuccess(true);
        setSubject("");
        setBody("");
      } else setError(result.error ?? "Something went wrong.");
    });
  };

  if (success)
    return (
      <div
        className="rounded-2xl p-10 text-center"
        style={{ background: "#ffffff", border: `1px solid rgba(255,117,31,0.25)` }}
      >
        <CheckCircle2 size={44} className="text-emerald-500 mx-auto mb-4" />
        <h3 className="font-semibold text-xl mb-2" style={{ color: "#111827" }}>
          Ticket Submitted
        </h3>
        <p className="text-base mb-5" style={{ color: "#6b7280" }}>
          We&apos;ve received your message and will respond within 1 business day.
        </p>
        <button
          onClick={() => setSuccess(false)}
          className="text-sm underline underline-offset-2 transition-colors"
          style={{ color: ORANGE }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.75")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          Submit another ticket
        </button>
      </div>
    );

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <label className="text-sm uppercase tracking-widest" style={{ color: "#6b7280" }}>
          Subject
        </label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="e.g. Unable to reschedule my ballet class"
          maxLength={120}
          className="w-full rounded-xl px-5 py-4 text-base outline-none transition-all"
          style={{ background: "#ffffff", border: "1px solid #d1d5db", color: "#111827" }}
          onFocus={(e) => (e.currentTarget.style.borderColor = ORANGE)}
          onBlur={(e) => (e.currentTarget.style.borderColor = "#d1d5db")}
        />
        <div className="text-right text-xs" style={{ color: "#9ca3af" }}>
          {subject.length}/120
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm uppercase tracking-widest" style={{ color: "#6b7280" }}>
          Message
        </label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Describe your issue in detail — the more context you give, the faster we can help."
          maxLength={2000}
          rows={6}
          className="w-full rounded-xl px-5 py-4 text-base outline-none resize-none transition-all"
          style={{ background: "#ffffff", border: "1px solid #d1d5db", color: "#111827" }}
          onFocus={(e) => (e.currentTarget.style.borderColor = ORANGE)}
          onBlur={(e) => (e.currentTarget.style.borderColor = "#d1d5db")}
        />
        <div className="flex justify-between text-xs" style={{ color: "#9ca3af" }}>
          <span>Be as specific as possible</span>
          <span>{body.length}/2000</span>
        </div>
      </div>

      {error && (
        <div
          className="flex items-center gap-2.5 rounded-xl px-5 py-4 text-base text-red-600"
          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}
        >
          <AlertCircle size={16} className="shrink-0" />
          {error}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={isPending}
        className="w-full flex items-center justify-center gap-2.5 py-4 rounded-xl font-semibold text-base transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ background: ORANGE, color: "#fff" }}
      >
        {isPending ? (
          <>
            <Loader2 size={17} className="animate-spin" />
            Submitting…
          </>
        ) : (
          <>
            <Send size={17} />
            Send to Support Team
          </>
        )}
      </button>
    </div>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-2xl p-8 space-y-6"
      style={{ background: "#ffffff", border: "1px solid #e5e7eb" }}
    >
      <div className="flex items-center gap-3">
        <span style={{ color: ORANGE }}>{icon}</span>
        <h2 className="font-semibold text-lg" style={{ color: "#111827" }}>
          {title}
        </h2>
      </div>
      {children}
    </div>
  );
}

export default function SupportClient({
  myTickets,
}: {
  myTickets: SerializedTicket[];
}) {
  const [faqOpen, setFaqOpen] = useState(false);
  const hasOpenTickets = myTickets.some((t) =>
    ["OPEN", "IN_PROGRESS"].includes(t.status),
  );

  return (
    <div className="min-h-screen py-10 px-6" style={{ backgroundColor: "#f3f4f6" }}>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <div
            className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] mb-3"
            style={{ color: ORANGE }}
          >
            <Crown size={12} /> Royal Academy
          </div>
          <h1 className="text-4xl font-bold" style={{ color: "#111827" }}>
            Help & Support
          </h1>
          <p className="text-base mt-2" style={{ color: "#6b7280" }}>
            Find answers or reach our team — we&apos;re here to help.
          </p>
        </div>

        {/* FAQ toggle */}
        <div>
          <button
            onClick={() => setFaqOpen((v) => !v)}
            className="w-full flex items-center justify-between px-6 py-5 rounded-2xl transition-all hover:shadow-md"
            style={{
              background: faqOpen ? `rgba(255,117,31,0.05)` : "#ffffff",
              border: faqOpen ? `1px solid rgba(255,117,31,0.3)` : "1px solid #e5e7eb",
            }}
          >
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  background: `rgba(255,117,31,0.1)`,
                  border: `1px solid rgba(255,117,31,0.2)`,
                }}
              >
                <HelpCircle size={22} style={{ color: ORANGE }} />
              </div>
              <div className="text-left">
                <div className="font-semibold text-base" style={{ color: "#111827" }}>
                  Frequently Asked Questions
                </div>
                <div className="text-sm mt-0.5" style={{ color: "#9ca3af" }}>
                  {FAQ_ITEMS.reduce((s, c) => s + c.items.length, 0)} questions
                  across {FAQ_ITEMS.length} categories — searchable
                </div>
              </div>
            </div>
            <span
              className="shrink-0"
              style={{
                color: "#9ca3af",
                transform: faqOpen ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.3s ease",
              }}
            >
              <ChevronDown size={22} />
            </span>
          </button>

          {faqOpen && (
            <div className="mt-2">
              <FaqPanel onClose={() => setFaqOpen(false)} />
            </div>
          )}
        </div>

        {/* My tickets */}
        {myTickets.length > 0 && (
          <Section title="My Support Tickets" icon={<MessageSquare size={18} />}>
            {hasOpenTickets && (
              <div
                className="flex items-center gap-3 rounded-xl px-5 py-3.5 text-sm text-sky-600"
                style={{
                  background: "rgba(14,165,233,0.06)",
                  border: "1px solid rgba(14,165,233,0.2)",
                }}
              >
                <Clock size={14} className="shrink-0" />
                You have open tickets — we&apos;ll reply within 1 business day.
              </div>
            )}
            <MyTickets tickets={myTickets} />
          </Section>
        )}

        {/* Submit ticket */}
        <Section title="Contact Support" icon={<Send size={18} />}>
          <p className="text-base -mt-2" style={{ color: "#6b7280" }}>
            Didn&apos;t find your answer? Send us a message and our team will get back to you.
          </p>
          <TicketForm />
          <div
            className="flex items-center gap-3 rounded-xl px-5 py-4"
            style={{ background: "#f9fafb", border: "1px solid #e5e7eb" }}
          >
            <Clock size={15} className="shrink-0" style={{ color: ORANGE }} />
            <p className="text-sm" style={{ color: "#6b7280" }}>
              Our team responds within{" "}
              <span style={{ color: "#111827", fontWeight: 500 }}>1 business day</span>
              {" "}— Sunday through Thursday, 9 AM – 6 PM GST.
            </p>
          </div>
        </Section>
      </div>
    </div>
  );
}
