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
      <HeroSection />
    </main>
  );
}
