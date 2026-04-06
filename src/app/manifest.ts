import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Royal Academy",
    short_name: "Royal Academy",
    description: "Excellence in Education | التميز في التعليم",
    start_url: "/en",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#000000",
    icons: [
       {
    src: "/icons/icon-192x192.png",
    sizes: "192x192",
    type: "image/png",
  },
  {
    src: "/icons/icon-512x512.png",
    sizes: "512x512",
    type: "image/png",
  },
  {
    src: "/icons/icon-512x512-maskable.png",
    sizes: "512x512",
    type: "image/png",
    purpose: "maskable",
  },
    ],
  };
}
