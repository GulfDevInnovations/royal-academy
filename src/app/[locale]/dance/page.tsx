"use client";

import DanceWellnessSubclassPage from "@/components/DanceWellnessSubclassPage";
import { useLocale, useTranslations } from "next-intl";

export default async function Dance() {
  const t = useTranslations();
  const locale = useLocale();

  const asLocalizedText = (value: string) =>
    ({ [locale]: value } as unknown as any);

  return (
    <div className="flex h-screen items-center justify-center">
      <DanceWellnessSubclassPage
        locale={locale}
        title={asLocalizedText(t("dance.title"))}
        description={asLocalizedText(t("dance.description"))}
        highlights={asLocalizedText(t("dance.highlights"))}
      />
    </div>
  );
}