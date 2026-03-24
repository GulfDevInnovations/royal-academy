"use client";

import type { PublicGalleryItem } from "@/lib/actions/gallery.public.actions";
import GallerySection from "@/components/GallerySection";

export default function GalleryPageClient({
  items,
}: {
  items: PublicGalleryItem[];
}) {
  return (
    <GallerySection
      items={items}
      active={true}
      onScrollUp={() => {}}
      onScrollDown={() => {}}
    />
  );
}
