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
  Sparkles,
  BookOpen,
  HelpCircle,
  X,
  ShieldCheck,
  RefreshCw,
  User,
} from "lucide-react";
import { submitStudentTicket } from "@/lib/actions/student-tickets";

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
    // ← ADD THIS
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
      cls: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    },
    IN_PROGRESS: {
      label: "In Progress",
      cls: "bg-sky-500/15 text-sky-300 border-sky-500/30",
    },
    RESOLVED: {
      label: "Resolved",
      cls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    },
    CLOSED: {
      label: "Closed",
      cls: "bg-gray-500/15 text-gray-400 border-gray-500/20",
    },
  };
  const { label, cls } = map[status] ?? map.OPEN;
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${cls}`}
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
      style={{
        background:
          "linear-gradient(135deg,rgba(255,255,255,0.07),rgba(255,255,255,0.02))",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(196,168,130,0.18)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
      }}
    >
      <div
        className="flex items-center justify-between px-5 py-4 border-b"
        style={{ borderColor: "rgba(196,168,130,0.12)" }}
      >
        <div className="flex items-center gap-2">
          <HelpCircle size={15} className="text-royal-gold" />
          <span
            className="text-royal-cream font-semibold text-sm"
            style={{ fontFamily: "'Palatino Linotype',Palatino,serif" }}
          >
            Frequently Asked Questions
          </span>
          <span className="text-royal-cream/30 text-[10px]">
            {FAQ_ITEMS.reduce((s, c) => s + c.items.length, 0)} questions
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-royal-cream/30 hover:text-royal-cream/60 transition-colors p-1"
        >
          <X size={15} />
        </button>
      </div>

      <div className="px-5 pt-4 pb-2">
        <div
          className="flex items-center gap-2 rounded-xl px-4 py-2.5"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(196,168,130,0.15)",
          }}
        >
          <Search size={13} className="text-royal-cream/30 flex-shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search questions…"
            className="flex-1 bg-transparent text-sm text-royal-cream placeholder:text-royal-cream/25 outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-royal-cream/30 hover:text-royal-cream/60 transition-colors"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      <div className="px-5 pb-5 pt-2 space-y-5 max-h-[480px] overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="text-center py-8">
            <HelpCircle size={28} className="text-royal-gold/20 mx-auto mb-2" />
            <p className="text-royal-cream/35 text-sm">
              No matches for "{searchQuery}"
            </p>
            <p className="text-royal-cream/20 text-xs mt-1">
              Try a different word or submit a ticket below.
            </p>
          </div>
        ) : (
          filtered.map((cat) => (
            <div key={cat.category}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm">{cat.icon}</span>
                <span className="text-royal-gold/60 text-[10px] uppercase tracking-widest font-semibold">
                  {cat.category}
                </span>
              </div>
              <div className="space-y-1.5">
                {cat.items.map((item) => {
                  const key = `${cat.category}-${item.q}`;
                  const isOpen = openKey === key;
                  return (
                    <div
                      key={key}
                      className="rounded-xl overflow-hidden transition-all duration-200"
                      style={{
                        background: isOpen
                          ? "linear-gradient(135deg,rgba(196,168,130,0.1),rgba(196,168,130,0.04))"
                          : "rgba(255,255,255,0.03)",
                        border: isOpen
                          ? "1px solid rgba(196,168,130,0.25)"
                          : "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      <button
                        onClick={() => setOpenKey(isOpen ? null : key)}
                        className="w-full flex items-center justify-between px-4 py-3 text-left"
                      >
                        <span
                          className={`text-sm transition-colors ${isOpen ? "text-royal-gold" : "text-royal-cream/75"}`}
                        >
                          {item.q}
                        </span>
                        <span className="text-royal-cream/30 flex-shrink-0 ml-3">
                          {isOpen ? (
                            <ChevronUp size={14} />
                          ) : (
                            <ChevronDown size={14} />
                          )}
                        </span>
                      </button>
                      {isOpen && (
                        <div className="px-4 pb-3">
                          <p className="text-royal-cream/55 text-sm leading-relaxed border-t border-royal-gold/10 pt-3">
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
    <div className="space-y-3">
      {tickets.map((t) => {
        const isOpen = openId === t.id;
        return (
          <div
            key={t.id}
            className="rounded-2xl overflow-hidden"
            style={{
              background:
                "linear-gradient(135deg,rgba(255,255,255,0.07),rgba(255,255,255,0.02))",
              border: "1px solid rgba(196,168,130,0.12)",
            }}
          >
            <button
              onClick={() => setOpenId(isOpen ? null : t.id)}
              className="w-full flex items-center gap-3 p-4 text-left"
            >
              <MessageSquare
                size={14}
                className="text-royal-gold/50 flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <span className="text-royal-cream/80 text-sm font-medium truncate">
                    {t.subject}
                  </span>
                  <TicketStatusBadge status={t.status} />
                </div>
                <div className="text-royal-cream/30 text-xs">
                  {new Date(t.createdAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                  {t.replies.length > 0 && (
                    <span className="ml-2 text-royal-gold/50">
                      · {t.replies.length}{" "}
                      {t.replies.length === 1 ? "reply" : "replies"}
                    </span>
                  )}
                </div>
              </div>
              <span className="text-royal-cream/25 flex-shrink-0">
                {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </span>
            </button>
            {isOpen && (
              <div
                className="border-t px-4 py-4 space-y-3"
                style={{ borderColor: "rgba(196,168,130,0.1)" }}
              >
                <div
                  className="rounded-xl p-3.5"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.07)",
                  }}
                >
                  <div className="text-royal-cream/35 text-[10px] uppercase tracking-widest mb-2">
                    Your message
                  </div>
                  <p className="text-royal-cream/65 text-sm leading-relaxed">
                    {t.body}
                  </p>
                </div>
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
                      className={`rounded-xl p-3.5 ${isAdmin ? "" : "ml-4"}`}
                      style={{
                        background: isAdmin
                          ? "linear-gradient(135deg,rgba(196,168,130,0.1),rgba(196,168,130,0.04))"
                          : "rgba(255,255,255,0.04)",
                        border: isAdmin
                          ? "1px solid rgba(196,168,130,0.2)"
                          : "1px solid rgba(255,255,255,0.07)",
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className={`text-[10px] uppercase tracking-widest font-semibold ${isAdmin ? "text-royal-gold/70" : "text-royal-cream/35"}`}
                        >
                          {name}
                        </span>
                        <span className="text-royal-cream/25 text-[10px]">
                          {new Date(r.createdAt).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="text-royal-cream/70 text-sm leading-relaxed">
                        {r.body}
                      </p>
                    </div>
                  );
                })}
                {t.replies.length === 0 && t.status === "OPEN" && (
                  <div className="flex items-center gap-2 text-royal-cream/30 text-xs px-1">
                    <Clock size={11} />
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
        className="rounded-2xl p-8 text-center"
        style={{
          background:
            "linear-gradient(135deg,rgba(196,168,130,0.1),rgba(196,168,130,0.03))",
          border: "1px solid rgba(196,168,130,0.22)",
        }}
      >
        <CheckCircle2 size={36} className="text-emerald-400 mx-auto mb-3" />
        <h3
          className="text-royal-cream font-semibold text-lg mb-1"
          style={{ fontFamily: "'Palatino Linotype',Palatino,serif" }}
        >
          Ticket Submitted
        </h3>
        <p className="text-royal-cream/50 text-sm mb-4">
          We&apos;ve received your message and will respond within 1 business
          day.
        </p>
        <button
          onClick={() => setSuccess(false)}
          className="text-royal-gold/70 text-xs underline underline-offset-2 hover:text-royal-gold transition-colors"
        >
          Submit another ticket
        </button>
      </div>
    );

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-royal-cream/50 text-xs uppercase tracking-widest">
          Subject
        </label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="e.g. Unable to reschedule my ballet class"
          maxLength={120}
          className="w-full rounded-xl px-4 py-3 text-sm text-royal-cream placeholder:text-royal-cream/25 outline-none transition-all"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(196,168,130,0.18)",
          }}
          onFocus={(e) =>
            (e.currentTarget.style.borderColor = "rgba(196,168,130,0.45)")
          }
          onBlur={(e) =>
            (e.currentTarget.style.borderColor = "rgba(196,168,130,0.18)")
          }
        />
        <div className="text-right text-royal-cream/25 text-[10px]">
          {subject.length}/120
        </div>
      </div>
      <div className="space-y-1.5">
        <label className="text-royal-cream/50 text-xs uppercase tracking-widest">
          Message
        </label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Describe your issue in detail — the more context you give, the faster we can help."
          maxLength={2000}
          rows={5}
          className="w-full rounded-xl px-4 py-3 text-sm text-royal-cream placeholder:text-royal-cream/25 outline-none resize-none transition-all"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(196,168,130,0.18)",
          }}
          onFocus={(e) =>
            (e.currentTarget.style.borderColor = "rgba(196,168,130,0.45)")
          }
          onBlur={(e) =>
            (e.currentTarget.style.borderColor = "rgba(196,168,130,0.18)")
          }
        />
        <div className="flex justify-between text-[10px]">
          <span className="text-royal-cream/25">
            Be as specific as possible
          </span>
          <span className="text-royal-cream/25">{body.length}/2000</span>
        </div>
      </div>
      {error && (
        <div
          className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm text-red-300"
          style={{
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.2)",
          }}
        >
          <AlertCircle size={14} className="flex-shrink-0" />
          {error}
        </div>
      )}
      <button
        onClick={handleSubmit}
        disabled={isPending}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-all hover:scale-[1.01] disabled:opacity-60 disabled:cursor-not-allowed"
        style={{
          background: "linear-gradient(135deg,#c4a882,#d4b896)",
          color: "#0a0f2c",
        }}
      >
        {isPending ? (
          <>
            <Loader2 size={15} className="animate-spin" />
            Submitting…
          </>
        ) : (
          <>
            <Send size={15} />
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
      className="rounded-2xl p-6 space-y-5"
      style={{
        background:
          "linear-gradient(135deg,rgba(255,255,255,0.07) 0%,rgba(255,255,255,0.02) 100%)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(196,168,130,0.13)",
      }}
    >
      <div className="flex items-center gap-2">
        <span className="text-royal-gold">{icon}</span>
        <h2
          className="text-royal-cream font-semibold text-base"
          style={{ fontFamily: "'Palatino Linotype',Palatino,serif" }}
        >
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
    <div
      className="min-h-screen py-8 px-4"
      style={{ backgroundColor: "var(--royal-purple)" }}
    >
      <div className="max-w-2xl mx-auto space-y-7">
        <div>
          <div className="flex items-center gap-1.5 text-royal-gold/55 text-[10px] uppercase tracking-[0.2em] mb-2">
            <Crown size={10} /> Royal Academy
          </div>
          <h1
            className="text-3xl font-bold text-royal-cream"
            style={{ fontFamily: "'Palatino Linotype',Palatino,serif" }}
          >
            Help & Support
          </h1>
          <p className="text-royal-cream/40 text-sm mt-1">
            Find answers or reach our team — we&apos;re here to help.
          </p>
        </div>

        {/* FAQ toggle */}
        <div>
          <button
            onClick={() => setFaqOpen((v) => !v)}
            className="w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all hover:shadow-lg group"
            style={{
              background: faqOpen
                ? "linear-gradient(135deg,rgba(196,168,130,0.14),rgba(196,168,130,0.06))"
                : "linear-gradient(135deg,rgba(255,255,255,0.07),rgba(255,255,255,0.02))",
              border: faqOpen
                ? "1px solid rgba(196,168,130,0.3)"
                : "1px solid rgba(196,168,130,0.13)",
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: "rgba(196,168,130,0.12)",
                  border: "1px solid rgba(196,168,130,0.2)",
                }}
              >
                <HelpCircle size={16} className="text-royal-gold" />
              </div>
              <div className="text-left">
                <div
                  className="text-royal-cream font-semibold text-sm"
                  style={{ fontFamily: "'Palatino Linotype',Palatino,serif" }}
                >
                  Frequently Asked Questions
                </div>
                <div className="text-royal-cream/35 text-xs">
                  {FAQ_ITEMS.reduce((s, c) => s + c.items.length, 0)} questions
                  across {FAQ_ITEMS.length} categories — searchable
                </div>
              </div>
            </div>
            <span
              className="text-royal-cream/40 group-hover:text-royal-cream/70 transition-colors flex-shrink-0"
              style={{
                transform: faqOpen ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.3s ease",
              }}
            >
              <ChevronDown size={18} />
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
          <Section
            title="My Support Tickets"
            icon={<MessageSquare size={15} />}
          >
            {hasOpenTickets && (
              <div
                className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs text-sky-300"
                style={{
                  background: "rgba(14,165,233,0.08)",
                  border: "1px solid rgba(14,165,233,0.18)",
                }}
              >
                <Clock size={12} className="flex-shrink-0" />
                You have open tickets — we&apos;ll reply within 1 business day.
              </div>
            )}
            <MyTickets tickets={myTickets} />
          </Section>
        )}

        {/* Submit ticket */}
        <Section title="Contact Support" icon={<Send size={15} />}>
          <p className="text-royal-cream/40 text-sm -mt-2">
            Didn&apos;t find your answer? Send us a message and our team will
            get back to you.
          </p>
          <TicketForm />
          <div
            className="flex items-center gap-2.5 rounded-xl px-4 py-3"
            style={{
              background: "rgba(196,168,130,0.06)",
              border: "1px solid rgba(196,168,130,0.1)",
            }}
          >
            <Clock size={13} className="text-royal-gold/50 flex-shrink-0" />
            <p className="text-royal-cream/40 text-xs">
              Our team responds within{" "}
              <span className="text-royal-cream/65">1 business day</span> —
              Sunday through Thursday, 9 AM – 6 PM GST.
            </p>
          </div>
        </Section>
      </div>
    </div>
  );
}
