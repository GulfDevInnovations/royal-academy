export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isArabic = locale === "ar";

  return (
    <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 md:px-8 pt-28 pb-12">
      <h1 className="text-3xl md:text-4xl tracking-wide">
        {isArabic ? "شروط الاستخدام" : "Terms of Use"}
      </h1>
      <p className="mt-4 text-royal-cream/80 leading-relaxed">
        {isArabic
          ? "هذه صفحة شروط الاستخدام. سيتم تحديثها بالمحتوى الرسمي قريباً."
          : "This is the Terms of Use page. It will be updated with the official content soon."}
      </p>
    </div>
  );
}
