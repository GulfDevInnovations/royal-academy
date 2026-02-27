"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { resendVerification } from "@/lib/actions/auth.actions";

export default function VerifyEmailPage() {
  const [resent, setResent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleResend() {
    setLoading(true);
    // In a real app you'd pass the email from a cookie or query param
    // For now this is a placeholder
    setResent(true);
    setLoading(false);
  }

  return (
    <main
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: "#227b81" }}
    >
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: "url('/images/pattern.svg')",
          backgroundRepeat: "repeat",
          backgroundSize: "280px auto",
          opacity: 0.04,
          filter: "sepia(1) saturate(0.5) brightness(2)",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-sm relative z-10"
      >
        <div className="flex justify-center mb-8">
          <Link href="/en">
            <Image
              src="/images/Logo-White.png"
              alt="Royal Academy"
              width={140}
              height={52}
              className="object-contain"
            />
          </Link>
        </div>

        <div
          className="rounded-3xl overflow-hidden text-center"
          style={{
            background:
              "linear-gradient(135deg, rgba(228,208,181,0.13) 0%, rgba(228,208,181,0.05) 50%, rgba(228,208,181,0.10) 100%)",
            backdropFilter: "blur(24px) saturate(1.8)",
            WebkitBackdropFilter: "blur(24px) saturate(1.8)",
            border: "1px solid rgba(228,208,181,0.20)",
            boxShadow:
              "0 24px 64px rgba(0,0,0,0.25), inset 0 1px 1px rgba(228,208,181,0.30)",
          }}
        >
          <div
            className="h-px w-full"
            style={{
              background:
                "linear-gradient(to right, transparent, rgba(228,208,181,0.6), transparent)",
            }}
          />

          <div className="px-8 py-12">
            {/* Envelope icon */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="flex justify-center mb-6"
            >
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{
                  background: "rgba(228,208,181,0.08)",
                  border: "1px solid rgba(228,208,181,0.20)",
                  boxShadow: "inset 0 1px 1px rgba(228,208,181,0.20)",
                }}
              >
                <svg
                  viewBox="0 0 48 48"
                  fill="none"
                  className="w-10 h-10"
                  style={{ color: "#e4d0b5" }}
                >
                  <rect
                    x="4"
                    y="10"
                    width="40"
                    height="28"
                    rx="4"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  />
                  <path
                    d="M4 14 L24 26 L44 14"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </motion.div>

            <h1
              className="text-2xl font-light tracking-widest mb-2"
              style={{ color: "#e4d0b5" }}
            >
              Check Your Email
            </h1>
            <p
              className="text-xs tracking-wide leading-relaxed mb-8"
              style={{ color: "rgba(228,208,181,0.55)" }}
            >
              We sent a confirmation link to your email address. Click it to
              activate your account.
            </p>

            {/* Resend */}
            {!resent ? (
              <button
                onClick={handleResend}
                disabled={loading}
                className="text-xs tracking-widest uppercase transition-opacity hover:opacity-70"
                style={{ color: "rgba(228,208,181,0.55)" }}
              >
                {loading ? "Sending..." : "Resend confirmation email"}
              </button>
            ) : (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs tracking-wide"
                style={{ color: "rgba(228,208,181,0.55)" }}
              >
                ✓ Confirmation email resent
              </motion.p>
            )}

            <div
              className="mt-8 pt-6"
              style={{ borderTop: "1px solid rgba(228,208,181,0.10)" }}
            >
              <Link
                href="/en/login"
                className="text-xs tracking-widest uppercase transition-opacity hover:opacity-70"
                style={{ color: "rgba(228,208,181,0.40)" }}
              >
                Back to Login
              </Link>
            </div>
          </div>

          <div
            className="h-px w-full"
            style={{
              background:
                "linear-gradient(to right, transparent, rgba(228,208,181,0.6), transparent)",
            }}
          />
        </div>
      </motion.div>
    </main>
  );
}
