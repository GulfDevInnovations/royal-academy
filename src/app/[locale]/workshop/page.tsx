import Link from "next/link";

export default async function WorkshopPage({
	params,
}: {
	params: Promise<{ locale: string }>;
}) {
	const { locale } = await params;
	const isArabic = locale === "ar";

	const content = isArabic
		? {
				title: "ورش العمل",
				subtitle: "قريباً — سيتم الإعلان عن ورش العمل القادمة هنا.",
				back: "العودة إلى الرئيسية",
			}
		: {
				title: "Workshops",
				subtitle: "Coming soon — upcoming workshops will be announced here.",
				back: "Back to Home",
			};

	return (
		<main className="min-h-screen bg-royal-purple px-4 py-24">
			<div
				className="fixed inset-0 pointer-events-none"
				style={{
					backgroundImage: "url('/images/pattern.svg')",
					backgroundRepeat: "repeat",
					backgroundSize: "1200px auto",
					opacity: 0.02,
					filter: "sepia(1) saturate(0.6) brightness(2)",
				}}
			/>

			<section
				className="relative z-10 mx-auto w-full max-w-3xl rounded-3xl p-6 md:p-10"
				style={{
					background:
						"linear-gradient(135deg, rgba(228,208,181,0.14) 0%, rgba(228,208,181,0.05) 50%, rgba(228,208,181,0.11) 100%)",
					backdropFilter: "blur(26px) saturate(1.9)",
					WebkitBackdropFilter: "blur(26px) saturate(1.9)",
					border: "1px solid rgba(228,208,181,0.22)",
					boxShadow:
						"0 30px 90px rgba(0,0,0,0.33), inset 0 1px 1px rgba(228,208,181,0.30), inset 0 -1px 1px rgba(0,0,0,0.15)",
				}}
			>
				<h1
					className="text-3xl md:text-4xl font-light tracking-widest"
					style={{ color: "#e4d0b5" }}
				>
					{content.title}
				</h1>
				<p className="mt-3 text-sm" style={{ color: "rgba(228,208,181,0.7)" }}>
					{content.subtitle}
				</p>

				<div className="mt-8 border-t border-white/10 pt-5">
					<Link
						href={`/${locale}`}
						className="text-xs tracking-widest uppercase transition-opacity hover:opacity-70"
						style={{ color: "rgba(228,208,181,0.65)" }}
					>
						{content.back}
					</Link>
				</div>
			</section>
		</main>
	);
}
