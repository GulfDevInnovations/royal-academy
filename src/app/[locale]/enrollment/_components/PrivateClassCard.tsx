"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, X, Crown } from "lucide-react";

export function PrivateClassCard() {
  const [showContact, setShowContact] = useState(false);

  return (
    <>
      <motion.div
        whileHover={{ y: -4 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        onClick={() => setShowContact(true)}
        className="relative rounded-2xl overflow-hidden border border-royal-gold/20 cursor-pointer h-full min-h-[280px]"
        style={{
          background: "linear-gradient(145deg, #1e1808, #100e0c)",
          boxShadow: "inset 0 0 60px rgba(201,168,76,0.03)",
        }}
      >
        {/* Radial glow */}
        <div
          className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500"
          style={{
            background:
              "radial-gradient(ellipse at 50% 0%, rgba(201,168,76,0.12), transparent 70%)",
          }}
        />

        {/* Ornamental corners */}
        <div className="absolute top-3 left-3 w-4 h-4 border-t border-l border-royal-gold/30" />
        <div className="absolute top-3 right-3 w-4 h-4 border-t border-r border-royal-gold/30" />
        <div className="absolute bottom-3 left-3 w-4 h-4 border-b border-l border-royal-gold/30" />
        <div className="absolute bottom-3 right-3 w-4 h-4 border-b border-r border-royal-gold/30" />

        <div className="flex flex-col items-center justify-center h-full p-8 text-center gap-4">
          <div className="w-14 h-14 rounded-full bg-royal-gold/10 border border-royal-gold/30 flex items-center justify-center">
            <Crown className="w-6 h-6 text-royal-gold" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-royal-gold mb-1">
              Exclusive
            </p>
            <h3 className="text-lg font-bold text-royal-cream font-goudy mb-2">
              Private Classes
            </h3>
            <p className="text-xs text-royal-cream/40 leading-relaxed">
              Tailored one-on-one sessions crafted around your goals and
              schedule.
            </p>
          </div>
          <div className="px-5 py-2.5 rounded-full border border-royal-gold/40 text-royal-gold text-xs font-semibold uppercase tracking-widest hover:bg-royal-gold/10 transition-colors">
            Enquire Now
          </div>
        </div>

        {/* Bottom shimmer */}
        <div
          className="absolute bottom-0 left-0 right-0 h-0.5"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(201,168,76,0.4), transparent)",
          }}
        />
      </motion.div>

      {/* Contact modal */}
      <AnimatePresence>
        {showContact && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
              onClick={() => setShowContact(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 32, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 32, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="fixed z-50 inset-x-4 bottom-0 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl overflow-hidden"
              style={{
                background: "linear-gradient(145deg, #1e1808, #100e0c)",
                border: "1px solid rgba(201,168,76,0.3)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Gold top bar */}
              <div
                className="h-0.5"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, #C9A84C, transparent)",
                }}
              />

              <div className="p-8 text-center">
                <button
                  onClick={() => setShowContact(false)}
                  className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-royal-cream/40 hover:text-royal-cream"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="w-16 h-16 rounded-full bg-royal-gold/10 border border-royal-gold/30 flex items-center justify-center mx-auto mb-4">
                  <Crown className="w-7 h-7 text-royal-gold" />
                </div>

                <p className="text-xs font-bold uppercase tracking-widest text-royal-gold mb-2">
                  Private Classes
                </p>
                <h3 className="text-2xl font-bold text-royal-cream font-goudy mb-2">
                  Let's Craft Your Journey
                </h3>
                <p className="text-royal-cream/50 text-sm leading-relaxed mb-8">
                  Reach out to our team and we'll design a private programme
                  tailored to your aspirations.
                </p>

                {/* Phone CTA */}
                <a
                  href="tel:+96812345678"
                  className="flex items-center justify-center gap-3 w-full py-4 rounded-xl font-bold text-royal-dark text-sm tracking-wide mb-3 transition-all hover:scale-[1.02]"
                  style={{
                    background: "linear-gradient(135deg, #C9A84C, #a8893e)",
                    boxShadow: "0 8px 24px rgba(201,168,76,0.3)",
                  }}
                >
                  <Phone className="w-4 h-4" />
                  Call +968 1234 5678
                </a>

                <p className="text-royal-cream/30 text-xs">
                  Available Sun – Thu, 9am – 6pm
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
