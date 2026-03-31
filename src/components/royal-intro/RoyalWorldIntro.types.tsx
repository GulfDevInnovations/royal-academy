// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

export type ContentCard = {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  mediaUrls: string[];
  videoUrls: string[];
  thumbnailUrl: string | null;
  linkUrl: string | null;
  linkLabel: string | null;
  isExternal: boolean;
  badgeLabel: string | null;
  eventDate?: string | null;
  expireAt?: string | null;
  slug?: string;
};

export interface Props {
  upcoming: ContentCard[];
  news: ContentCard[];
  offers: ContentCard[];
  logoUrl?: string;
  backgroundImageUrl?: string;
  onScrollDown?: () => void;
  active?: boolean;
}

// ─────────────────────────────────────────────
// SECTIONS DATA
// ─────────────────────────────────────────────

export interface Section {
  id: string;
  label: string;
  subclasses: { label: string; href: string }[];
  image: string;
}

export const SECTIONS: Section[] = [
  {
    id: "ballet",
    label: "Ballet",
    subclasses: [
      { label: "Baby Ballet", href: "/classes/ballet/baby-ballet" },
      { label: "RAD Ballet", href: "/classes/ballet/rad-ballet" },
      { label: "Open Ballet", href: "/classes/ballet/open-ballet" },
    ],
    image: "/images/HeroSection/balletGold.png",
  },
  {
    id: "dance-wellness",
    label: "Dance & Wellness",
    subclasses: [
      { label: "Aerial Hoop", href: "/classes/dance/aerial-hoop" },
      {
        label: "Body & Flexibility",
        href: "/classes/dance/body&flexibility",
      },
      {
        label: "Contemporary Dance",
        href: "/classes/dance/contemporary-dance",
      },
      { label: "Kids Movements", href: "/classes/dance/kids-movements" },
      { label: "Salsa", href: "/classes/dance/salsa" },
      { label: "Zumba", href: "/classes/dance/zumba" },
    ],
    image: "/images/HeroSection/dance&wellnessGold.png",
  },
  {
    id: "music",
    label: "Music",
    subclasses: [
      { label: "Piano", href: "/classes/music/piano" },
      { label: "Guitar", href: "/classes/music/guitar" },
      { label: "Violin", href: "/classes/music/violin" },
      { label: "Oud", href: "/classes/music/oud" },
      {
        label: "Drums & Percussion",
        href: "/classes/music/drumsandpercussion",
      },
      { label: "Durbuka", href: "/classes/music/durbuka" },
      { label: "Bass", href: "/classes/music/bass" },
      { label: "Handpan", href: "/classes/music/handpan" },
      { label: "Vocal", href: "/classes/music/vocal" },
      { label: "Theory", href: "/classes/music/theory" },
      { label: "Sight Reading", href: "/classes/music/sightreading" },
      { label: "Solfège", href: "/classes/music/solfege" },
      { label: "Music Awakening", href: "/classes/music/musicawakening" },
    ],
    image: "/images/HeroSection/musicGold.png",
  },
  {
    id: "art",
    label: "Art",
    subclasses: [
      { label: "Drawing", href: "/classes/art" },
      { label: "Shading & Color", href: "/classes/art" },
      { label: "Portrait & Caricature", href: "/classes/art" },
      { label: "Acrylic", href: "/classes/art" },
      { label: "Oil Painting", href: "/classes/art" },
      { label: "Watercolor", href: "/classes/art" },
    ],
    image: "/images/HeroSection/artGold.png",
  },
];

// ─────────────────────────────────────────────
// EMPTY CARD FALLBACK
// ─────────────────────────────────────────────

export function emptyCard(id: string, message: string): ContentCard {
  return {
    id,
    title: message,
    subtitle: null,
    description: null,
    mediaUrls: [],
    videoUrls: [],
    thumbnailUrl: null,
    linkUrl: null,
    linkLabel: null,
    isExternal: false,
    badgeLabel: null,
    expireAt: null,
  };
}
