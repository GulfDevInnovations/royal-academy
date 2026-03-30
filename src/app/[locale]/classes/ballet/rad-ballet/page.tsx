import BalletSubclassPage from "@/components/BalletSubclassPage";

export default async function RadBalletPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <BalletSubclassPage
      locale={locale}
      title={{ en: "RAD Ballet", ar: "باليه RAD" }}
      reservationQuery={{ q: "RAD Ballet" }}
      description={{
        en: "Structured ballet training inspired by Royal Academy of Dance standards — building strong technique and artistry.",
        ar: "تدريب باليه منظم مستوحى من معايير Royal Academy of Dance — لبناء تقنية قوية وحس فني.",
      }}
      highlights={[
        { en: "Technique, alignment, and turnout basics", ar: "تقنية ومحاذاة وأساسيات الدوران" },
        { en: "Graceful port de bras and musical phrasing", ar: "حركات ذراعين رشيقة وتعبير موسيقي" },
        { en: "Progressive combinations and confidence", ar: "تركيبات تدريجية وثقة" },
      ]}
      img="/images/dance/rad-ballet.jpg"
    />
  );
}
