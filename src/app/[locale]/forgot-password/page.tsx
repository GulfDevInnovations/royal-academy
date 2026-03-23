"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useLocale } from "next-intl";
import { requestPasswordReset } from "@/lib/actions/auth.actions";

export default function ForgotPasswordPage() {
  const locale = useLocale();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await requestPasswordReset(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  }

  return (
    <main
      className="min-h-screen flex items-center justify-center px-4 py-20"
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
          <Link href={`/${locale}`}>
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
          className="rounded-3xl overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, rgba(228,208,181,0.13) 0%, rgba(228,208,181,0.05) 50%, rgba(228,208,181,0.10) 100%)",
            backdropFilter: "blur(24px) saturate(1.8)",
            WebkitBackdropFilter: "blur(24px) saturate(1.8)",
            border: "1px solid rgba(228,208,181,0.20)",
            boxShadow: `
              0 24px 64px rgba(0,0,0,0.25),
              inset 0 1px 1px rgba(228,208,181,0.30),
              inset 0 -1px 1px rgba(0,0,0,0.12),
              inset 1px 0 1px rgba(228,208,181,0.12),
              inset -1px 0 1px rgba(0,0,0,0.08)
            `,
          }}
        >
          <div
            className="h-px w-full"
            style={{
              background:
                "linear-gradient(to right, transparent, rgba(228,208,181,0.6), transparent)",
            }}
          />

          <div className="px-8 py-10">
            <h1
              className="text-3xl font-light tracking-widest text-center mb-1"
              style={{ color: "#e4d0b5" }}
            >
              Reset Password
            </h1>
            <p
              className="text-center text-xs tracking-[0.3em] uppercase mb-8"
              style={{ color: "rgba(228,208,181,0.5)" }}
            >
              We’ll email you a reset link
            </p>

            {sent ? (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-center py-3 px-4 rounded-xl"
                style={{
                  color: "#86efac",
                  background: "rgba(134,239,172,0.08)",
                  border: "1px solid rgba(134,239,172,0.20)",
                }}
              >
                If that email exists, you’ll receive a reset link shortly.
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <input type="hidden" name="locale" value={locale} />

                <AuthInput
                  name="email"
                  type="email"
                  placeholder="Email Address"
                  required
                />

                <AnimatePresence>
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-xs text-center py-2 px-4 rounded-xl"
                      style={{
                        color: "#f87171",
                        background: "rgba(248,113,113,0.08)",
                        border: "1px solid rgba(248,113,113,0.20)",
                      }}
                    >
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>

                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="mt-2 w-full py-4 rounded-2xl text-sm tracking-[0.25em] uppercase font-medium shimmer transition-all duration-300"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(228,208,181,0.18) 0%, rgba(228,208,181,0.08) 50%, rgba(228,208,181,0.15) 100%)",
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                    border: "1px solid rgba(228,208,181,0.35)",
                    color: "#e4d0b5",
                    boxShadow: `
                      0 4px 20px rgba(0,0,0,0.15),
                      inset 0 1px 1px rgba(228,208,181,0.35),
                      inset 0 -1px 1px rgba(0,0,0,0.12)
                    `,
                    cursor: loading ? "not-allowed" : "pointer",
                    opacity: loading ? 0.7 : 1,
                  }}
                >
                  {loading ? "Sending..." : "Send Reset Link"}
                </motion.button>
              </form>
            )}

            <p
              className="text-center text-xs mt-6 tracking-wide"
              style={{ color: "rgba(228,208,181,0.45)" }}
            >
              <Link
                href={`/${locale}/login`}
                className="transition-colors duration-200 hover:opacity-80"
                style={{ color: "#e4d0b5" }}
              >
                Back to Sign In
              </Link>
            </p>
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

function AuthInput({
  name,
  type,
  placeholder,
  required,
}: {
  name: string;
  type: string;
  placeholder: string;
  required?: boolean;
}) {
  return (
    <input
      name={name}
      type={type}
      placeholder={placeholder}
      required={required}
      className="w-full px-5 py-3.5 rounded-2xl text-sm outline-none transition-all duration-300 placeholder:tracking-wide"
      style={{
        background:
          "linear-gradient(135deg, rgba(228,208,181,0.09) 0%, rgba(228,208,181,0.04) 100%)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: "1px solid rgba(228,208,181,0.15)",
        color: "#e4d0b5",
        boxShadow: `
          inset 0 1px 1px rgba(228,208,181,0.12),
          inset 0 -1px 1px rgba(0,0,0,0.10)
        `,
      }}
      onFocus={(e) => {
        e.target.style.border = "1px solid rgba(228,208,181,0.40)";
        e.target.style.boxShadow = `
          inset 0 1px 1px rgba(228,208,181,0.18),
          inset 0 -1px 1px rgba(0,0,0,0.10),
          0 0 0 3px rgba(228,208,181,0.08)
        `;
      }}
      onBlur={(e) => {
        e.target.style.border = "1px solid rgba(228,208,181,0.15)";
        e.target.style.boxShadow = `
          inset 0 1px 1px rgba(228,208,181,0.12),
          inset 0 -1px 1px rgba(0,0,0,0.10)
        `;
      }}
    />
  );
}
