"use client";

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

          <div className="mx-auto grid w-full grid-cols-4 gap-4 py-10 md:flex md:w-auto md:justify-center md:gap-2">
            {PRINCIPLE_STRIPS.map((p) => (
              <div
                key={p.key}
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
                      className="object-cover opacity-90"
                    />
                    <div className="absolute inset-0 bg-linear-to-b from-black/10 via-black/30 to-black/80" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <p className="mx-auto mt-10 md:mt-14 max-w-5xl text-center text-sm md:text-xl leading-relaxed text-royal-cream/90">
            Royal Academy is built on four enduring principles: excellence in
            craft, integrity in teaching, community in belonging, and heritage
            in honoring the traditions we pass on to the next generation.
          </p>
        </div>
      </section>
    </section>
  );
}
