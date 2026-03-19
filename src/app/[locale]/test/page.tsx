import { motion } from "framer-motion";
import Image from "next/image";
import React from "react";

const page = () => {
  return (
    <div>
      <Image
        src="/images/initial-room2.png"
        alt="Royal Academy Room"
        fill
        unoptimized
        className="object-cover"
        priority
        style={{ zIndex: 0 }}
      />
      <div className="mt-20 liquid-glass backdrop-blur-3xl shimmer flex items-center justify-center gap-3 px-8 py-3 rounded-full transition-all duration-300 cursor-pointer"></div>
      <span className="text-royal-cream text-xl tracking-widest uppercase whitespace-nowrap"></span>
    </div>
  );
};

export default page;
