import GalleryPageClient from '@/components/GalleryPageClient';
import { getPublishedGalleryItems } from '@/lib/actions/gallery.public.actions';

export default async function GalleryPage() {
  const items = await getPublishedGalleryItems();

  return (
    <main className="h-screen bg-[#121212]">
      <GalleryPageClient items={items} />
    </main>
  );
}
