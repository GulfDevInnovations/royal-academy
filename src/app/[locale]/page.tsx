import HeroSection from "@/components/HeroSection";
import Image from "next/image";

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isArabic = locale === "ar";

  return (
    <main className="flex min-h-screen items-center justify-center">
      {/* <Image
        src="/images/logo-color.png"
        alt="Royal Academy"
        width={800}
        height={58}
        className="object-contain opacity-80"
        priority
      /> */}
      <HeroSection />
    </main>
  );
}
