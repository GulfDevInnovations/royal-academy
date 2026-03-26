import GalleryPageClient from "@/components/GalleryPageClient";
import { getPublishedGalleryItems } from "@/lib/actions/gallery.public.actions";

export default async function AestheticsPage() {
  const items = await getPublishedGalleryItems();

  return (
    <main className="min-h-screen bg-[#121212]">
      <GalleryPageClient items={items} />
    </main>
  );
}
