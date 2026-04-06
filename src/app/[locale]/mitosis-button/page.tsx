"use client";

import LiquidMitosisButton from "./_component/LiquidMitosisButton";
const workshopHref = "www.google.com";
const workshopLabel = "Workshops";
export default function DemoPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0b1020]">
      <LiquidMitosisButton href={workshopHref} label={workshopLabel} />
    </div>
  );
}
