"use client";

import DanceWellnessSubclassPage from "@/components/DanceWellnessSubclassPage";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";

export default async function Dance() {
  const t = useTranslations();

  const asLocalizedText = (value: string) =>
    ({ [locale]: value } as unknown as any);


  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? "en";

  return (
    <div className="flex h-screen items-center justify-center">
      <DanceWellnessSubclassPage
        locale={locale}
        title={asLocalizedText(t("dance.title"))}
        description={asLocalizedText(t("dance.description"))}
        highlights={asLocalizedText(t("dance.highlights"))}
        imgSrc="/images/dance/contemporary.jpg"
      />
    </div>
  );
}