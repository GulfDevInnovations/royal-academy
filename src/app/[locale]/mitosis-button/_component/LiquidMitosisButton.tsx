import Link from "next/link";
import React from "react";
import { motion } from "framer-motion";

type LiquidMitosisGreenLinkProps = {
  href: string;
  label: string;
  isArabic?: boolean;
  className?: string;
  onNavigate?: () => void;
};

export default function LiquidMitosisGreenLink({
  href,
  label,
  isArabic = false,
  className = "",
  onNavigate,
}: LiquidMitosisGreenLinkProps) {
  return (
    <>
      <style>{`
        /*
          total cycle = 8s   Direction: RIGHT → LEFT
          ─────────────────────────────────────────────
          0%      → 18.75%  travel outward (right→left)
          18.75%  → 81.25%  bubble holds outside (left)
          81.25%  → 100%    bubble returns, dissolves

          BUBBLE RULES:
          • Invisible (opacity 0) during the entire travel phase (0% → 18.75%)
            — it rides along as a pure shape, no visual presence
          • At 18.75% it "pops" fully visible as a born cell
          • "NEW" text appears only AFTER 18.75% (born moment)
          • Bubble height: 38px (slimmer than before)
          • Bubble left% matches core left% exactly at every step — no lag

          LEFT BORDER PUSH:
          • Edge elements build up slowly (like resistance) before the bubble
            squeezes through, then snap away once it exits
          • Border on the button is animated to dissolve at the exit point
        */

        /* ── ENERGY CORE ──────────────────────────────────────────── */
        @keyframes lgm-energy-core {
          0% {
            opacity: 0;
            left: 92%;
            transform: translate(-50%, -50%) scale(0.28);
            filter: blur(12px);
          }
          2% {
            opacity: 0.18;
            left: 84%;
            transform: translate(-50%, -50%) scale(0.44);
            filter: blur(10px);
          }
          5% {
            opacity: 0.52;
            left: 74%;
            transform: translate(-50%, -50%) scale(0.66);
            filter: blur(8px);
          }
          8% {
            opacity: 0.78;
            left: 60%;
            transform: translate(-50%, -50%) scale(0.86);
            filter: blur(5px);
          }
          11% {
            opacity: 0.95;
            left: 44%;
            transform: translate(-50%, -50%) scale(1.02);
            filter: blur(2.5px);
          }
          14% {
            opacity: 1;
            left: 28%;
            transform: translate(-50%, -50%) scale(1.1);
            filter: blur(1px);
          }
          16.5% {
            opacity: 0.62;
            left: 14%;
            transform: translate(-50%, -50%) scale(0.72);
            filter: blur(6px);
          }
          18.75% {
            opacity: 0;
            left: 4%;
            transform: translate(-50%, -50%) scale(0.28);
            filter: blur(12px);
          }
          81.25% {
            opacity: 0;
            left: 4%;
            transform: translate(-50%, -50%) scale(0.28);
            filter: blur(12px);
          }
          83.5% {
            opacity: 0.18;
            left: 14%;
            transform: translate(-50%, -50%) scale(0.42);
            filter: blur(10px);
          }
          86% {
            opacity: 0.58;
            left: 28%;
            transform: translate(-50%, -50%) scale(0.68);
            filter: blur(7px);
          }
          88.5% {
            opacity: 0.82;
            left: 44%;
            transform: translate(-50%, -50%) scale(0.88);
            filter: blur(4px);
          }
          91% {
            opacity: 0.94;
            left: 58%;
            transform: translate(-50%, -50%) scale(0.98);
            filter: blur(2px);
          }
          93.5% {
            opacity: 0.72;
            left: 72%;
            transform: translate(-50%, -50%) scale(0.76);
            filter: blur(5px);
          }
          96% {
            opacity: 0.38;
            left: 84%;
            transform: translate(-50%, -50%) scale(0.48);
            filter: blur(9px);
          }
          100% {
            opacity: 0;
            left: 92%;
            transform: translate(-50%, -50%) scale(0.28);
            filter: blur(12px);
          }
        }

        /* ── INNER PULSE ──────────────────────────────────────────── */
        @keyframes lgm-inner-pulse {
          0% {
            opacity: 0;
            transform: translateX(0) scale(0.82);
          }
          5% {
            opacity: 0.14;
            transform: translateX(6px) scale(0.9);
          }
          10% {
            opacity: 0.32;
            transform: translateX(4px) scale(1.0);
          }
          14% {
            opacity: 0.52;
            transform: translateX(0px) scale(1.06);
          }
          18.75% {
            opacity: 0.14;
            transform: translateX(-4px) scale(0.96);
          }
          81.25% {
            opacity: 0.12;
            transform: translateX(-4px) scale(0.94);
          }
          86% {
            opacity: 0.36;
            transform: translateX(-2px) scale(1.0);
          }
          91% {
            opacity: 0.24;
            transform: translateX(2px) scale(0.96);
          }
          96% {
            opacity: 0.08;
            transform: translateX(4px) scale(0.88);
          }
          100% {
            opacity: 0;
            transform: translateX(0) scale(0.82);
          }
        }

        /*
          ── LEFT EDGE FLASH ────────────────────────────────────────
          Slow resistance build-up: starts faintly at 11% (when core is
          still ~44% away), peaks at 17% as bubble squeezes through,
          then snaps off at 18.75% once bubble is born outside.
          Same slow squeeze on return.
        */
        @keyframes lgm-edge-flash {
          0%     { opacity: 0;    transform: scaleY(0.5);  }
          /* slow resistance build */
          11%    { opacity: 0.08; transform: scaleY(0.72); }
          13%    { opacity: 0.22; transform: scaleY(0.86); }
          15%    { opacity: 0.58; transform: scaleY(0.98); }
          16.5%  { opacity: 0.9;  transform: scaleY(1.06); }
          17.5%  { opacity: 1;    transform: scaleY(1.1);  }
          /* snap off — bubble is through */
          18.75% { opacity: 0;    transform: scaleY(0.6);  }
          /* hold invisible */
          80%    { opacity: 0;    transform: scaleY(0.6);  }
          /* slow return resistance */
          81.25% { opacity: 0.08; transform: scaleY(0.72); }
          82.5%  { opacity: 0.28; transform: scaleY(0.88); }
          83.5%  { opacity: 0.72; transform: scaleY(1.04); }
          84.5%  { opacity: 1;    transform: scaleY(1.1);  }
          /* snap off — bubble re-enters */
          86%    { opacity: 0;    transform: scaleY(0.6);  }
          100%   { opacity: 0;    transform: scaleY(0.5);  }
        }

        /*
          ── LEFT BORDER DISSOLVE ───────────────────────────────────
          The button's left border section fades/compresses as the bubble
          pushes through, giving a "membrane parting" feel.
          Implemented as an overlay that masks the border region.
        */
        @keyframes lgm-border-dissolve {
          0%     { opacity: 0;    transform: translateY(-50%) scaleY(0.3); }
          11%    { opacity: 0;    transform: translateY(-50%) scaleY(0.3); }
          13%    { opacity: 0.5;  transform: translateY(-50%) scaleY(0.7); }
          16%    { opacity: 1;    transform: translateY(-50%) scaleY(1.1); }
          18.75% { opacity: 0;    transform: translateY(-50%) scaleY(0.3); }
          80%    { opacity: 0;    transform: translateY(-50%) scaleY(0.3); }
          81.25% { opacity: 0.5;  transform: translateY(-50%) scaleY(0.7); }
          84%    { opacity: 1;    transform: translateY(-50%) scaleY(1.1); }
          86%    { opacity: 0;    transform: translateY(-50%) scaleY(0.3); }
          100%   { opacity: 0;    transform: translateY(-50%) scaleY(0.3); }
        }

        /* ── LEFT EDGE PRESSURE ───────────────────────────────────── */
        @keyframes lgm-edge-pressure {
          0%     { opacity: 0;    transform: translateY(-50%) scaleX(0.1) scaleY(0.5);  width: 8px;  }
          11%    { opacity: 0.1;  transform: translateY(-50%) scaleX(0.3) scaleY(0.7);  width: 10px; }
          14%    { opacity: 0.42; transform: translateY(-50%) scaleX(0.7) scaleY(0.92); width: 16px; }
          16.5%  { opacity: 0.82; transform: translateY(-50%) scaleX(1.1) scaleY(1.06); width: 22px; }
          17.5%  { opacity: 1;    transform: translateY(-50%) scaleX(1.2) scaleY(1.1);  width: 26px; }
          18.75% { opacity: 0;    transform: translateY(-50%) scaleX(0.1) scaleY(0.5);  width: 8px;  }
          80%    { opacity: 0;    transform: translateY(-50%) scaleX(0.1) scaleY(0.5);  width: 8px;  }
          81.25% { opacity: 0.12; transform: translateY(-50%) scaleX(0.3) scaleY(0.7);  width: 10px; }
          83%    { opacity: 0.52; transform: translateY(-50%) scaleX(0.8) scaleY(0.96); width: 18px; }
          84.5%  { opacity: 0.9;  transform: translateY(-50%) scaleX(1.1) scaleY(1.08); width: 24px; }
          85.5%  { opacity: 1;    transform: translateY(-50%) scaleX(1.2) scaleY(1.1);  width: 26px; }
          86%    { opacity: 0;    transform: translateY(-50%) scaleX(0.1) scaleY(0.5);  width: 8px;  }
          100%   { opacity: 0;    transform: translateY(-50%) scaleX(0.1) scaleY(0.5);  width: 8px;  }
        }

        /* ── CONNECTION BRIDGE ────────────────────────────────────── */
        @keyframes lgm-connection-bridge {
          0%     { opacity: 0;    width: 6px;  transform: translateY(-50%) scaleX(0.1); }
          12%    { opacity: 0.22; width: 12px; transform: translateY(-50%) scaleX(0.6); }
          15%    { opacity: 0.72; width: 26px; transform: translateY(-50%) scaleX(1.0); }
          17%    { opacity: 0.92; width: 34px; transform: translateY(-50%) scaleX(1.2); }
          18.75% { opacity: 0;    width: 6px;  transform: translateY(-50%) scaleX(0.1); }
          81.25% { opacity: 0;    width: 6px;  transform: translateY(-50%) scaleX(0.1); }
          82.5%  { opacity: 0.62; width: 22px; transform: translateY(-50%) scaleX(0.9); }
          84%    { opacity: 0.88; width: 32px; transform: translateY(-50%) scaleX(1.15); }
          85.5%  { opacity: 1;    width: 36px; transform: translateY(-50%) scaleX(1.2); }
          86%    { opacity: 0;    width: 6px;  transform: translateY(-50%) scaleX(0.1); }
          100%   { opacity: 0;    width: 6px;  transform: translateY(-50%) scaleX(0.1); }
        }

        /*
          ── SPLIT BUBBLE ──────────────────────────────────────────
          KEY RULES:
          1. Opacity = 0 during entire travel (0% → 18.75%) — it's a ghost
             riding alongside the core; no visual presence while inside
          2. At 18.75% it pops to full opacity — the "birth" moment
          3. left% matches core exactly at every step (no lag)
          4. height: 38px (slimmer cell)
          5. On return it fades back to 0 before re-entering the button
        */
        @keyframes lgm-split-bubble {
          /* ---- ghost travel with core (opacity 0 throughout) ---- */
          0% {
            opacity: 0;
            left: 92%;
            transform: translateY(-50%) scale(0.28);
            filter: blur(12px);
          }
          2% {
            opacity: 0;
            left: 84%;
            transform: translateY(-50%) scale(0.44);
            filter: blur(10px);
          }
          5% {
            opacity: 0;
            left: 74%;
            transform: translateY(-50%) scale(0.66);
            filter: blur(8px);
          }
          8% {
            opacity: 0;
            left: 60%;
            transform: translateY(-50%) scale(0.86);
            filter: blur(5px);
          }
          11% {
            opacity: 0;
            left: 44%;
            transform: translateY(-50%) scale(1.0);
            filter: blur(2.5px);
          }
          14% {
            opacity: 0;
            left: 28%;
            transform: translateY(-50%) scale(1.05);
            filter: blur(1px);
          }
          16.5% {
            opacity: 0;
            left: 14%;
            transform: translateY(-50%) scale(1.0);
            filter: blur(0.5px);
          }
          /* approaching exit — still invisible, just outside */
          18% {
            opacity: 0;
            left: -20px;
            transform: translateY(-50%) scale(0.96);
            filter: blur(0px);
          }
          /* BORN — pops into existence */
          18.75% {
            opacity: 1;
            left: -48px;
            transform: translateY(-50%) scale(1);
            filter: blur(0px);
          }

          /* ---- hold outside left, fully visible ---- */
          81.25% {
            opacity: 1;
            left: -48px;
            transform: translateY(-50%) scale(1);
            filter: blur(0px);
          }

          /* ---- return: fades out before re-entering ---- */
          83% {
            opacity: 0.9;
            left: -20px;
            transform: translateY(-50%) scale(0.96);
            filter: blur(0px);
          }
          /* fades to 0 as it squeezes back in */
          84.5% {
            opacity: 0;
            left: 14%;
            transform: translateY(-50%) scale(1.0);
            filter: blur(0.5px);
          }
          /* stays invisible as core returns */
          86% {
            opacity: 0;
            left: 28%;
            transform: translateY(-50%) scale(0.9);
            filter: blur(3px);
          }
          88.5% {
            opacity: 0;
            left: 44%;
            transform: translateY(-50%) scale(0.72);
            filter: blur(6px);
          }
          91% {
            opacity: 0;
            left: 60%;
            transform: translateY(-50%) scale(0.52);
            filter: blur(8px);
          }
          96% {
            opacity: 0;
            left: 84%;
            transform: translateY(-50%) scale(0.36);
            filter: blur(10px);
          }
          100% {
            opacity: 0;
            left: 92%;
            transform: translateY(-50%) scale(0.28);
            filter: blur(12px);
          }
        }

        /*
          ── NEW LABEL ─────────────────────────────────────────────
          Appears ONLY after birth (18.75%). Invisible before that.
          Fades in with a gentle bloom after the bubble pops.
        */
        @keyframes lgm-new-float {
          /* invisible while travelling */
          0%     { opacity: 0; transform: translateY(3px) scale(0.6);  }
          18.74% { opacity: 0; transform: translateY(3px) scale(0.6);  }
          /* bloom in after birth */
          20%    { opacity: 0.5; transform: translateY(1px) scale(0.92); }
          22%    { opacity: 1;   transform: translateY(0px) scale(1.04); }
          25%    { opacity: 1;   transform: translateY(-1px) scale(1);   }
          /* gentle float while holding */
          50%    { opacity: 1;   transform: translateY(-2px) scale(1.02); }
          81.25% { opacity: 1;   transform: translateY(-1px) scale(1);   }
          /* fades before bubble returns */
          83%    { opacity: 0.6; transform: translateY(1px) scale(0.92); }
          84.5%  { opacity: 0;   transform: translateY(3px) scale(0.6);  }
          100%   { opacity: 0;   transform: translateY(3px) scale(0.6);  }
        }

        /* ── HOST BREATHE ─────────────────────────────────────────── */
        @keyframes lgm-host-breathe {
          0%, 100% { transform: scale(1); }
          14%      { transform: scaleX(1.012) scaleY(0.992); }
          18.75%   { transform: scaleX(1.018) scaleY(0.988); }
          81.25%   { transform: scaleX(1.012) scaleY(0.992); }
          88%      { transform: scaleX(1.006) scaleY(0.997); }
        }
      `}</style>

      <motion.div
        whileTap={{ scale: 0.96 }}
        whileHover={{ scale: 1.03 }}
        transition={{ duration: 0.2 }}
        className={`relative hidden sm:block ${className}`}
        style={{
          overflow: "visible",
          animation:
            "lgm-host-breathe 8s cubic-bezier(0.22, 1, 0.36, 1) infinite",
        }}
      >
        <Link
          href={href}
          onClick={() => {
            onNavigate?.();
          }}
          className="liquid-glass-green backdrop-blur-xs relative z-10 flex cursor-pointer items-center justify-center rounded-full px-4 py-2 transition-all duration-300 md:px-6 md:py-2.5"
        >
          <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-full">
            {/* Inner radial glow */}
            <span
              className="absolute inset-0 rounded-full"
              style={{
                background:
                  "radial-gradient(64px 64px at 78% 50%, rgba(180,255,210,0.22), transparent 72%)",
                animation:
                  "lgm-inner-pulse 8s cubic-bezier(0.22, 1, 0.36, 1) infinite",
                filter: "blur(10px)",
                opacity: 0,
              }}
            />

            {/* Energy core orb — RIGHT → LEFT */}
            <span
              className="absolute top-1/2 z-[2] rounded-full"
              style={{
                left: "92%",
                width: "34px",
                height: "34px",
                opacity: 0,
                transform: "translate(-50%, -50%) scale(0.28)",
                background:
                  "radial-gradient(circle at 35% 35%, rgba(230,255,240,0.98), rgba(170,255,205,0.5) 32%, rgba(90,220,140,0.24) 58%, transparent 72%)",
                boxShadow:
                  "0 0 14px rgba(220,255,230,0.55), 0 0 30px rgba(120,255,170,0.32), inset 0 1px 1px rgba(255,255,255,0.82)",
                animation:
                  "lgm-energy-core 8s cubic-bezier(0.22, 1, 0.36, 1) infinite",
              }}
            />
          </span>

          <span
            className={`text-royal-green relative z-10 whitespace-nowrap text-xs font-medium uppercase tracking-widest md:text-sm ${isArabic ? "inline-block scale-125" : ""}`}
          >
            {label}
          </span>
        </Link>

        {/*
          Border dissolve overlay — sits over the left edge of the button,
          same background as the button so it visually "erases" the border
          as the bubble squeezes through. Gives a membrane-parting effect.
        */}
        <span
          className="pointer-events-none absolute z-[13] rounded-full"
          style={{
            top: "50%",
            left: "-3px",
            width: "14px",
            height: "70%",
            opacity: 0,
            transform: "translateY(-50%) scaleY(0.3)",
            background:
              "radial-gradient(ellipse at center, rgba(120,255,170,0.55) 0%, rgba(80,200,120,0.28) 40%, transparent 75%)",
            filter: "blur(3px)",
            animation:
              "lgm-border-dissolve 8s cubic-bezier(0.22, 1, 0.36, 1) infinite",
          }}
        />

        {/* Left edge flash */}
        <span
          className="pointer-events-none absolute z-[11] rounded-full"
          style={{
            top: "14%",
            left: "-2px",
            width: "18px",
            height: "72%",
            opacity: 0,
            background:
              "linear-gradient(to bottom, rgba(255,255,255,0), rgba(200,255,220,0.38), rgba(120,255,170,0.85), rgba(220,255,235,0.2), rgba(255,255,255,0))",
            filter: "blur(4px)",
            animation:
              "lgm-edge-flash 8s cubic-bezier(0.22, 1, 0.36, 1) infinite",
          }}
        />

        {/* Left edge pressure */}
        <span
          className="pointer-events-none absolute z-[9] rounded-full"
          style={{
            top: "50%",
            left: "6px",
            width: "8px",
            height: "22px",
            opacity: 0,
            transform: "translateY(-50%) scaleX(0.1) scaleY(0.5)",
            background:
              "radial-gradient(circle at 65% 50%, rgba(210,255,225,0.54), rgba(130,255,175,0.14) 48%, transparent 74%)",
            filter: "blur(3px)",
            animation:
              "lgm-edge-pressure 8s cubic-bezier(0.22, 1, 0.36, 1) infinite",
          }}
        />

        {/* Left bridge */}
        <span
          className="pointer-events-none absolute z-[8] rounded-full"
          style={{
            top: "50%",
            left: "2px",
            width: "6px",
            height: "24px",
            opacity: 0,
            transform: "translateY(-50%) scaleX(0.1)",
            background:
              "radial-gradient(circle at 65% 50%, rgba(220,255,230,0.52), rgba(120,255,165,0.16) 45%, transparent 75%)",
            filter: "blur(4px)",
            animation:
              "lgm-connection-bridge 8s cubic-bezier(0.22, 1, 0.36, 1) infinite",
          }}
        />

        {/*
          Detached outside bubble (the new born cell)
          — 38px tall (slimmer), invisible during travel,
            pops visible at 18.75% (birth), NEW text appears after birth
        */}
        <span
          className="pointer-events-none absolute z-[12] flex items-center justify-center rounded-full"
          style={{
            top: "50%",
            left: "92%",
            width: "46px",
            height: "38px",
            opacity: 0,
            transform: "translateY(-50%) scale(0.28)",
            background: `
              linear-gradient(
                145deg,
                rgba(210, 255, 225, 0.22) 0%,
                rgba(110, 220, 150, 0.12) 38%,
                rgba(60, 160, 95, 0.08) 68%,
                rgba(170, 255, 205, 0.18) 100%
              )
            `,
            backdropFilter:
              "blur(40px) saturate(2.4) brightness(1.1) contrast(1.06)",
            WebkitBackdropFilter:
              "blur(40px) saturate(2.4) brightness(1.1) contrast(1.06)",
            boxShadow: `
              0 6px 20px rgba(0, 0, 0, 0.2),
              0 0 16px rgba(120,255,170,0.26),
              inset 1px 1px 0 rgba(180,255,210,0.34),
              inset 0 1px 0 rgba(140,255,190,0.22),
              inset -1px -1px 0 rgba(40,120,70,0.1),
              inset 0 -1px 1px rgba(0,40,20,0.18)
            `,
            animation:
              "lgm-split-bubble 8s cubic-bezier(0.22, 1, 0.36, 1) infinite",
          }}
        >
          {/* NEW text — only visible after birth at 18.75% */}
          <span
            className="select-none text-[10px] font-semibold uppercase tracking-[0.18em]"
            style={{
              color: "rgba(232,255,240,0.95)",
              textShadow: "0 0 10px rgba(180,255,210,0.28)",
              transformOrigin: "center",
              animation:
                "lgm-new-float 8s cubic-bezier(0.22, 1, 0.36, 1) infinite",
              display: "inline-block",
            }}
          >
            NEW
          </span>
        </span>
      </motion.div>
    </>
  );
}
