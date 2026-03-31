import DanceWellnessSubclassPage from "@/components/DanceWellnessSubclassPage";

export default async function SalsaPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <DanceWellnessSubclassPage
      locale={locale}
      title={{ en: "Salsa" }}
      reservationQuery={{ q: "Salsa" }}
      description={{
        en: "Learn timing, turns, and partner-work fundamentals with a focus on technique, connection, and musical interpretation.",
      }}
      highlights={[
        { en: "Basic steps, timing, and rhythm" },
        { en: "Turns, styling, and footwork" },
        { en: "Partner connection and leading/following" },
        { en: "Social-dance confidence" },
      ]}
      imgSrc="/images/dance/salsa.jpg"
    />
  );
}
