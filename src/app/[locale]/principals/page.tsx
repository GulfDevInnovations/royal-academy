"use client";

import { motion } from "framer-motion";
import Image from "next/image";

const PRINCIPLE_STRIPS: Array<{
  key: string;
  src: string;
  label: string;
  special?: boolean;
}> = [
  {
    key: "about-1",
    src: "/images/aboutSection/about-1.jpg",
    label: "Excellence",
  },
  {
    key: "about-2",
    src: "/images/aboutSection/about-2.jpg",
    label: "Integrity",
    special: true,
  },
  { key: "about-3", src: "/images/aboutSection/about-3.jpg", label: "Community" },
  {
    key: "art-hero",
    src: "/images/art-hero.jpg",
    label: "Heritage",
    special: true,
  },
];

export default function About() {
  return (
    <section className="w-full">
      <section className="relative z-10 w-full bg-[#121212] text-royal-cream">
        <div className="mx-auto w-full max-w-9xl px-6 pt-10 pb-18 md:pt-14 md:pb-24">
          <motion.div
            initial={{ opacity: 0, y: 26 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto mb-10 text-center"
          >
            <h2 className="text-2xl md:text-4xl tracking-wide text-royal-cream">
              Core Principles
            </h2>
            <p className="mt-20 text-sm md:text-base tracking-widest text-royal-cream/65 w-block flex justify-around">
              <span className="text-3xl tracking-[10px]">Excellence</span>
              <span>.</span>
              <span className="text-3xl tracking-[10px]">Integrity</span>
              <span>.</span>
              <span className="text-3xl tracking-[10px]">Community</span>
              <span>.</span>
              <span className="text-3xl tracking-[10px]">Heritage</span>
            </p>
          </motion.div>

          <div className="mx-auto grid w-full grid-cols-4 gap-4 py-10 md:flex md:w-auto md:justify-center md:gap-2">
            {PRINCIPLE_STRIPS.map((p, idx) => (
              <motion.div
                key={p.key}
                initial={{ opacity: 0, y: 90 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{
                  duration: 5,
                  delay: 1 * idx,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="w-full mx-auto pl-10"
              >
                <div
                  className={`group relative w-full overflow-hidden border border-white/10 bg-white/5 shadow-[0_30px_90px_rgba(0,0,0,0.35)] md:w-62${p.special ? " mt-20" : ""}`}
                  style={{ height: "min(50vh, 300px)" }}
                >
                  <div className="absolute inset-0">
                    <Image
                      src={p.src}
                      alt={p.label}
                      fill
                      sizes="(min-width: 768px) 208px, 50vw"
                      draggable={false}
                      className="object-cover opacity-90 transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                    />
                    <div className="absolute inset-0 bg-linear-to-b from-black/10 via-black/30 to-black/80" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto mt-10 md:mt-14 max-w-5xl text-center text-sm md:text-xl leading-relaxed text-royal-cream/90"
          >
            Royal Academy is built on four enduring principles: excellence in
            craft, integrity in teaching, community in belonging, and heritage
            in honoring the traditions we pass on to the next generation.
          </motion.p>
        </div>
      </section>
    </section>
  );
}
