export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isArabic = locale === "ar";

  return (
    <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 md:px-8 pt-28 pb-12">
      <h1 className="text-3xl md:text-4xl tracking-wide">
        {isArabic ? "سياسة الخصوصية" : "Privacy Policy"}
      </h1>
      <p className="mt-4 text-royal-cream/80 leading-relaxed">
        {isArabic
          ? "هذه صفحة سياسة الخصوصية. سيتم تحديثها بالمحتوى الرسمي قريباً."
          : "This is the Privacy Policy page. It will be updated with the official content soon."}
      </p>
    </div>
  );
}
