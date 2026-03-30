import DanceWellnessSubclassPage from "@/components/DanceWellnessSubclassPage";

export default function YogaMovementPage({
  params,
}: {
  params: { locale: string };
}) {
  return (
    <DanceWellnessSubclassPage
      locale={params.locale}
      title={{ en: "Aerial Hoop" }}
      description={{
        en: "Aerial hoop sessions focused on strength, control, and graceful transitions — with progressions designed for safe skill-building.",
      }}
      highlights={[
        { en: "Grip, core, and upper-body strength" },
        { en: "Spins, poses, and transitions" },
        { en: "Flexibility and body alignment" },
        { en: "Safe technique + conditioning drills" },
      ]}
      imgSrc="/images/dance/aerial-hoop.jpg"
    />
  );
}
