"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, X } from "lucide-react";

export function SuccessToast() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (searchParams.get("success") === "1") {
      setVisible(true);
      // Clean URL without re-render
      router.replace(pathname, { scroll: false });
      // Auto-dismiss after 5s
      const t = setTimeout(() => setVisible(false), 5000);
      return () => clearTimeout(t);
    }
  }, [searchParams, router, pathname]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="
            fixed bottom-6 left-1/2 -translate-x-1/2 z-50
            flex items-center gap-3
            px-5 py-4 rounded-2xl
            bg-[#141414] border border-emerald-500/30
            shadow-2xl shadow-black/60
            min-w-[320px] max-w-[90vw]
          "
        >
          {/* Icon */}
          <div className="w-9 h-9 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>

          {/* Text */}
          <div className="flex-1">
            <p className="font-bold text-royal-cream text-sm font-goudy">
              Booking Confirmed!
            </p>
            <p className="text-royal-cream/50 text-xs mt-0.5">
              Your class has been reserved successfully.
            </p>
          </div>

          {/* Progress bar */}
          <motion.div
            className="absolute bottom-0 left-0 h-0.5 rounded-full bg-emerald-500/60"
            initial={{ width: "100%" }}
            animate={{ width: "0%" }}
            transition={{ duration: 5, ease: "linear" }}
          />

          {/* Dismiss */}
          <button
            onClick={() => setVisible(false)}
            className="text-royal-cream/30 hover:text-royal-cream transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
