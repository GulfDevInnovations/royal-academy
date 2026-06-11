export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isArabic = locale === "ar";
  const dir = isArabic ? "rtl" : "ltr";

  return (
    <div style={{ backgroundColor: '#f3f4f6', minHeight: '100vh' }}>
      <div
        dir={dir}
        className="mx-auto w-full max-w-4xl px-4 sm:px-6 md:px-8 pt-28 pb-20"
      >
        <div className="mb-14">
          <div className="flex items-center gap-3 mb-6">
            <span className="block h-px w-8" style={{ background: '#d1d5db' }} />
            <span
              className="text-xs tracking-[0.2em] uppercase font-light"
              style={{ color: '#ff751f' }}
            >
              {isArabic ? 'الأكاديمية الملكية' : 'Royal Academy'}
            </span>
          </div>

          <h1
            className="text-4xl md:text-5xl lg:text-6xl font-light tracking-wide leading-tight"
            style={{ color: '#111827' }}
          >
            {isArabic ? 'سياسة الخصوصية' : 'Privacy Policy'}
          </h1>

          <p
            className="mt-5 text-base md:text-lg leading-relaxed max-w-xl"
            style={{ color: '#6b7280' }}
          >
            {isArabic
              ? 'نحن في الأكاديمية الملكية نقدر خصوصيتك ونلتزم بحماية بياناتك الشخصية.'
              : 'At Royal Academy, we value your privacy and are committed to protecting your personal data.'}
          </p>

          <div className="mt-10 flex items-center gap-4">
            <div className="h-px flex-1" style={{ background: '#e5e7eb' }} />
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#d1d5db' }} />
            <div className="h-px flex-1" style={{ background: '#e5e7eb' }} />
          </div>
        </div>

        <p className="text-base leading-relaxed" style={{ color: '#6b7280' }}>
          {isArabic
            ? 'هذه صفحة سياسة الخصوصية. سيتم تحديثها بالمحتوى الرسمي قريباً.'
            : 'This is the Privacy Policy page. It will be updated with the official content soon.'}
        </p>
      </div>
    </div>
  );
}
