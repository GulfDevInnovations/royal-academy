"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { signIn, resendVerification, signInWithGoogle } from "@/lib/actions/auth.actions";
import { useSearchParams } from "next/navigation";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [attemptedEmail, setAttemptedEmail] = useState<string>("");
  const [resendState, setResendState] = useState<"idle" | "sending" | "sent">("idle");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const searchParams = useSearchParams();
  const verified = searchParams.get("verified");
  const locale = useLocale();
  const navT = useTranslations("nav");
  const redirectTo = searchParams.get("redirectTo") || `/${locale}`;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setErrorCode(null);
    const formData = new FormData(e.currentTarget);
    setAttemptedEmail(formData.get("email") as string);
    const result = await signIn(formData);
    if (result?.error) {
      setError(result.error);
      setErrorCode(result.code ?? null);
      setLoading(false);
    } else if (result?.redirectTo) {
      window.location.href = result.redirectTo;
    }
  }

  async function handleResend() {
    if (!attemptedEmail || resendState !== "idle") return;
    setResendState("sending");
    await resendVerification(attemptedEmail);
    setResendState("sent");
  }

  return (
    <main
      className="min-h-screen flex items-center justify-center px-4 py-20"
      style={{ backgroundColor: "#227b81" }}
    >
      {/* Background pattern */}
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
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link href={`/${locale}`}>
            <Image
              src="/images/logo/Logo-White.png"
              alt="Royal Academy"
              width={140}
              height={52}
              className="object-contain"
            />
          </Link>
        </div>

        {/* Card */}
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
          {verified && (
            <motion.p
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs text-center py-2 px-4 rounded-xl mb-4"
              style={{
                color: "#86efac",
                background: "rgba(134,239,172,0.08)",
                border: "1px solid rgba(134,239,172,0.20)",
              }}
            >
              ✓ Email confirmed! You can now sign in.
            </motion.p>
          )}

          <div className="px-8 py-10">
            <h1
              className="text-3xl font-light tracking-widest text-center mb-1"
              style={{ color: "#e4d0b5" }}
            >
              Welcome Back
            </h1>
            <p
              className="text-center text-xs tracking-[0.3em] uppercase mb-8"
              style={{ color: "rgba(228,208,181,0.5)" }}
            >
              Sign in to your account
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <input type="hidden" name="redirectTo" value={redirectTo} />
              <input type="hidden" name="locale" value={locale} />

              <AuthInput
                name="email"
                type="email"
                placeholder="Email Address"
                required
              />

              <div className="relative">
                <AuthInput
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs tracking-widest uppercase"
                  style={{ color: "rgba(228,208,181,0.45)" }}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>

              {/* Forgot password */}
              <div className="flex justify-end">
                <Link
                  href={`/${locale}/forgot-password`}
                  className="text-xs tracking-wide transition-opacity hover:opacity-70"
                  style={{ color: "rgba(228,208,181,0.50)" }}
                >
                  Forgot password?
                </Link>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div
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
                    <p>{error}</p>
                    {errorCode === "EMAIL_NOT_VERIFIED" && (
                      <p className="mt-1.5">
                        {resendState === "sent" ? (
                          <span style={{ color: "#86efac" }}>
                            ✓ Verification email sent — check your inbox.
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={handleResend}
                            disabled={resendState === "sending"}
                            className="underline underline-offset-2 hover:opacity-80 transition-opacity disabled:opacity-50"
                            style={{ color: "#f87171" }}
                          >
                            {resendState === "sending" ? "Sending…" : "Resend verification email"}
                          </button>
                        )}
                      </p>
                    )}
                  </motion.div>
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
                {loading ? "Signing In..." : "Sign In"}
              </motion.button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 mt-5">
              <div className="flex-1 h-px" style={{ background: "rgba(228,208,181,0.15)" }} />
              <span className="text-xs tracking-widest" style={{ color: "rgba(228,208,181,0.35)" }}>or</span>
              <div className="flex-1 h-px" style={{ background: "rgba(228,208,181,0.15)" }} />
            </div>

            {/* Google sign-in */}
            <form action={signInWithGoogle} className="mt-3">
              <input type="hidden" name="locale" value={locale} />
              <input type="hidden" name="redirectTo" value={redirectTo} />
              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl text-sm tracking-wide flex items-center justify-center gap-3 transition-all duration-200 hover:opacity-80"
                style={{
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(228,208,181,0.18)",
                  color: "#e4d0b5",
                }}
              >
                <GoogleIcon />
                Continue with Google
              </button>
            </form>

            <p
              className="text-center text-xs mt-5 tracking-wide"
              style={{ color: "rgba(228,208,181,0.45)" }}
            >
              {navT("dontHaveAccount")}{" "}
              <Link
                href={`/${locale}/signup`}
                className="transition-colors duration-200 hover:opacity-80"
                style={{ color: "#e4d0b5" }}
              >
                {navT("signUp")}
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

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
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
