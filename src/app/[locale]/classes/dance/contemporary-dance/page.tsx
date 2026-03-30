import DanceWellnessSubclassPage from "@/components/DanceWellnessSubclassPage";

export default function ContemporaryDancePage({
  params,
}: {
  params: { locale: string };
}) {
  return (
    <DanceWellnessSubclassPage
      locale={params.locale}
      title={{ en: "Contemporary Dance" }}
      reservationQuery={{ q: "Contemporary Dance" }}
      description={{
        en: "Contemporary dance sessions that build control, fluidity, and expression — with technique-focused progressions for every level.",
      }}
      highlights={[
        { en: "Floorwork, flow, and body awareness" },
        { en: "Strength, mobility, and alignment" },
        { en: "Musicality and movement quality" },
        { en: "Choreography and creative exploration" },
      ]}
      imgSrc="/images/dance/contemporary.jpg"
    />
  );
}
