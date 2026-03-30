import DanceWellnessSubclassPage from "@/components/DanceWellnessSubclassPage";

export default function ZumbaPage({ params }: { params: { locale: string } }) {
  return (
    <DanceWellnessSubclassPage
      locale={params.locale}
      title={{ en: "Zumba" }}
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
