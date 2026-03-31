import DanceWellnessSubclassPage from "@/components/DanceWellnessSubclassPage";

export default async function ZumbaPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <DanceWellnessSubclassPage
      locale={locale}
      title={{ en: "Zumba" }}
      reservationQuery={{ q: "Zumba" }}
      description={{
        en: "A joyful cardio-dance workout with upbeat playlists — perfect for improving endurance while having fun.",
      }}
      highlights={[
        { en: "Full-body cardio + calorie burn" },
        { en: "Easy-to-follow rhythmic combinations" },
        { en: "Coordination and agility" },
        { en: "Energy, mood, and community" },
      ]}
      imgSrc="/images/dance/zumba.jpg"
    />
  );
}
