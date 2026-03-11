// src/app/[locale]/payments/_components/ShareModal.tsx
"use client";

import { X, Share2, Mail, MessageCircle, Send } from "lucide-react";
import type { StudentPaymentRecord } from "@/lib/actions/student-payments";

interface Props {
  payment: StudentPaymentRecord;
  onClose: () => void;
}

export default function ShareModal({ payment, onClose }: Props) {
  const period = payment.month
    ? `${payment.month} ${payment.year}`
    : payment.eventDate
      ? new Date(payment.eventDate).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : "";

  const text = encodeURIComponent(
    `🎓 Royal Academy — Invoice ${payment.invoiceNo}\n\n` +
      `Class: ${payment.subClassName}\n` +
      (period ? `Period: ${period}\n` : "") +
      `Instructor: ${payment.teacherName}\n` +
      `Amount: ${payment.amount} ${payment.currency}\n` +
      `Status: ${payment.status}\n\n` +
      `Royal Academy · Muscat, Oman\nwww.royalacademy.om`,
  );

  const subject = encodeURIComponent(
    `Invoice ${payment.invoiceNo} — Royal Academy`,
  );

  const options = [
    {
      label: "Gmail",
      icon: <Mail size={18} />,
      cls: "from-red-600/25 to-red-800/15 border-red-500/25 text-red-300 hover:border-red-400/40",
      href: `https://mail.google.com/mail/?view=cm&su=${subject}&body=${text}`,
    },
    {
      label: "WhatsApp",
      icon: <MessageCircle size={18} />,
      cls: "from-green-600/25 to-green-800/15 border-green-500/25 text-green-300 hover:border-green-400/40",
      href: `https://wa.me/?text=${text}`,
    },
    {
      label: "Telegram",
      icon: <Send size={18} />,
      cls: "from-sky-600/25 to-sky-800/15 border-sky-500/25 text-sky-300 hover:border-sky-400/40",
      href: `https://t.me/share/url?url=${encodeURIComponent("https://royalacademy.om")}&text=${text}`,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="relative z-10 w-full max-w-xs rounded-2xl p-6"
        style={{
          background:
            "linear-gradient(135deg,rgba(255,255,255,0.1) 0%,rgba(255,255,255,0.03) 100%)",
          backdropFilter: "blur(24px)",
          border: "1px solid rgba(196,168,130,0.25)",
          boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
        }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-royal-cream/40 hover:text-royal-cream transition-colors"
        >
          <X size={16} />
        </button>

        <div className="flex items-center gap-2 mb-1">
          <Share2 size={14} className="text-royal-gold" />
          <span className="text-royal-gold text-xs font-semibold uppercase tracking-widest">
            Share Invoice
          </span>
        </div>
        <p className="text-royal-cream/40 text-xs mb-5">
          {payment.invoiceNo} · {payment.subClassName}
        </p>

        <div className="space-y-2">
          {options.map((o) => (
            <a
              key={o.label}
              href={o.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border bg-gradient-to-r transition-all hover:scale-[1.02] ${o.cls}`}
            >
              {o.icon}
              <span className="text-sm font-medium">Share via {o.label}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
