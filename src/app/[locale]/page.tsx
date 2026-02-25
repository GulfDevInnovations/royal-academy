export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isArabic = locale === "ar";

  return (
    <main className="flex min-h-screen items-center justify-center">
      <h1 className="text-royal-gold text-4xl font-bold">
        {isArabic
          ? "مرحباً بكم في الأكاديمية الملكية"
          : "Welcome to Royal Academy"}
      </h1>
    </main>
  );
}
