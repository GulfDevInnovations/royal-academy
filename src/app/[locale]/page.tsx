import HomeClient from "@/components/HomeClient";
import { getPublishedGalleryItems } from "@/lib/actions/gallery.public.actions";

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const galleryItems = await getPublishedGalleryItems();

  return <HomeClient locale={locale} galleryItems={galleryItems} />;
}
