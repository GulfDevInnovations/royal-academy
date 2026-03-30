import BalletSubclassPage from "@/components/BalletSubclassPage";

export default async function BabyBalletPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <BalletSubclassPage
      locale={locale}
      title={{ en: "Baby Ballet", ar: "باليه للأطفال الصغار" }}
      reservationQuery={{ q: "Baby Ballet" }}
      description={{
        en: "A gentle introduction to ballet for little ones — focusing on coordination, rhythm, and joyful movement.",
        ar: "مدخل لطيف إلى الباليه للصغار — يركز على التناسق والإيقاع وحب الحركة.",
      }}
      highlights={[
        { en: "Basic ballet positions and balance", ar: "وضعيات باليه أساسية وتوازن" },
        { en: "Musicality and rhythm games", ar: "إحساس بالموسيقى وألعاب إيقاع" },
        { en: "Age-appropriate stretching and posture", ar: "تمدد ووقفة مناسبة للعمر" },
      ]}
    />
  );
}
