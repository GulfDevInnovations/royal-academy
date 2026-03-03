import HeroSection from "@/components/HeroSection";

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isArabic = locale === "ar";

  return (
    <main className="flex min-h-screen items-center justify-center">
      {/* <HeroSection /> */}
    </main>
  );
}
