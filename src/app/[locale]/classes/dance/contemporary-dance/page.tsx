import DanceWellnessSubclassPage from "@/components/DanceWellnessSubclassPage";

export default function ContemporaryDancePage({
  params,
}: {
  params: { locale: string };
}) {
  return (
    <DanceWellnessSubclassPage
      locale={params.locale}
      title={{ en: "Hip Hop" }}
      description={{
        en: "High-energy classes that build groove, musicality, and confidence — with foundations for beginners and challenging combos for advanced dancers.",
      }}
      highlights={[
        { en: "Groove, bounce, and musical timing" },
        { en: "Footwork, coordination, and stamina" },
        { en: "Choreography + freestyle prompts" },
        { en: "Performance confidence and stage presence" },
      ]}
      imgSrc="/images/dance/contemporary.jpg"
    />
  );
}
