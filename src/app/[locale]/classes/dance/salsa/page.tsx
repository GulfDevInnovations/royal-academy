import DanceWellnessSubclassPage from "@/components/DanceWellnessSubclassPage";

export default function SalsaPage({ params }: { params: { locale: string } }) {
  return (
    <DanceWellnessSubclassPage
      locale={params.locale}
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
